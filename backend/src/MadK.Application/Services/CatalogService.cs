using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Catalog;
using MadK.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MadK.Application.Services;

public class CatalogService : ICatalogService
{
    private readonly IAppDbContext _context;
    private readonly IPricingService? _pricingService;

    public CatalogService(IAppDbContext context) : this(context, null)
    {
    }

    public CatalogService(IAppDbContext context, IPricingService? pricingService)
    {
        _context = context;
        _pricingService = pricingService;
    }

    public async Task<Result<IReadOnlyList<CategoryTreeDto>>> GetCategoryTreeAsync(CancellationToken ct = default)
    {
        // Fetch all active categories in a single query (avoids N+1)
        var allCategories = await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .AsNoTracking()
            .ToListAsync(ct);

        // Build tree hierarchy in memory
        var lookup = allCategories.ToLookup(c => c.ParentId);

        List<CategoryTreeDto> BuildChildren(Guid? parentId)
        {
            return lookup[parentId]
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new CategoryTreeDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    IconUrl = c.IconUrl,
                    DisplayOrder = c.DisplayOrder,
                    Children = BuildChildren(c.Id)
                })
                .ToList();
        }

        var tree = BuildChildren(null);
        return Result<IReadOnlyList<CategoryTreeDto>>.Success(tree);
    }

    public async Task<Result<CategoryDetailDto>> GetCategoryBySlugAsync(string slug, CancellationToken ct = default)
    {
        var category = await _context.Categories
            .Include(c => c.SpecTemplate)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive, ct);

        if (category == null)
        {
            return Result<CategoryDetailDto>.Failure("Không tìm thấy danh mục");
        }

        var dto = new CategoryDetailDto
        {
            Id = category.Id,
            ParentId = category.ParentId,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            IconUrl = category.IconUrl,
            DisplayOrder = category.DisplayOrder,
            SchemaDefinition = category.SpecTemplate?.SchemaDefinition
        };

        return Result<CategoryDetailDto>.Success(dto);
    }

    public async Task<Result<CategoryFiltersDto>> GetCategoryFiltersAsync(string slug, CancellationToken ct = default)
    {
        var category = await _context.Categories
            .Include(c => c.SpecTemplate)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive, ct);

        if (category == null)
        {
            return Result<CategoryFiltersDto>.Failure("Không tìm thấy danh mục");
        }

        var categoryIds = await _context.Categories
            .Where(c => c.Id == category.Id || c.ParentId == category.Id)
            .Select(c => c.Id)
            .ToListAsync(ct);

        // 1. Available brands with product count
        var brands = await _context.Products
            .Where(p => categoryIds.Contains(p.CategoryId) && p.IsActive)
            .GroupBy(p => new { p.Brand.Id, p.Brand.Name, p.Brand.Slug, p.Brand.LogoUrl })
            .Select(g => new BrandFilterDto
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                Slug = g.Key.Slug,
                LogoUrl = g.Key.LogoUrl,
                ProductCount = g.Count()
            })
            .OrderBy(b => b.Name)
            .AsNoTracking()
            .ToListAsync(ct);

        // 2. Price range
        var prices = await _context.Products
            .Where(p => categoryIds.Contains(p.CategoryId) && p.IsActive)
            .Select(p => p.BasePrice)
            .ToListAsync(ct);

        var minPrice = prices.Count > 0 ? prices.Min() : 0m;
        var maxPrice = prices.Count > 0 ? prices.Max() : 0m;

        // 3. Dynamic spec filters from CategorySpecTemplate JSON Schema
        var specFilters = new List<SpecFilterDto>();
        if (category.SpecTemplate != null && !string.IsNullOrWhiteSpace(category.SpecTemplate.SchemaDefinition))
        {
            try
            {
                using var doc = JsonDocument.Parse(category.SpecTemplate.SchemaDefinition);
                if (doc.RootElement.TryGetProperty("properties", out var properties))
                {
                    foreach (var prop in properties.EnumerateObject())
                    {
                        var key = prop.Name;
                        var label = prop.Value.TryGetProperty("title", out var titleProp)
                            ? titleProp.GetString() ?? key
                            : key;

                        var options = new List<string>();
                        if (prop.Value.TryGetProperty("enum", out var enumProp) && enumProp.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var opt in enumProp.EnumerateArray())
                            {
                                var optVal = opt.GetString();
                                if (!string.IsNullOrWhiteSpace(optVal))
                                {
                                    options.Add(optVal);
                                }
                            }
                        }

                        specFilters.Add(new SpecFilterDto
                        {
                            Key = key,
                            Label = label,
                            Options = options
                        });
                    }
                }
            }
            catch
            {
                // Fallback gracefully if schema JSON is not in expected format
            }
        }

        var result = new CategoryFiltersDto
        {
            CategoryId = category.Id,
            CategoryName = category.Name,
            CategorySlug = category.Slug,
            Brands = brands,
            PriceRange = new PriceRangeDto
            {
                MinPrice = minPrice,
                MaxPrice = maxPrice
            },
            SpecFilters = specFilters
        };

        return Result<CategoryFiltersDto>.Success(result);
    }

    public async Task<Result<IReadOnlyList<BrandDto>>> GetBrandsAsync(bool activeOnly = true, CancellationToken ct = default)
    {
        var query = _context.Brands.AsNoTracking();

        if (activeOnly)
        {
            query = query.Where(b => b.IsActive);
        }

        var brands = await query
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto
            {
                Id = b.Id,
                Name = b.Name,
                Slug = b.Slug,
                LogoUrl = b.LogoUrl,
                Description = b.Description,
                IsActive = b.IsActive
            })
            .ToListAsync(ct);

        return Result<IReadOnlyList<BrandDto>>.Success(brands);
    }

    public async Task<Result<PagedResult<ProductListDto>>> GetProductsAsync(ProductQueryParams queryParams, CancellationToken ct = default)
    {
        var query = _context.Products.Where(p => p.IsActive).AsNoTracking();

        // Filter by category (including subcategories)
        if (!string.IsNullOrWhiteSpace(queryParams.CategorySlug))
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == queryParams.CategorySlug, ct);
            if (category != null)
            {
                var categoryIds = await _context.Categories
                    .Where(c => c.Id == category.Id || c.ParentId == category.Id)
                    .Select(c => c.Id)
                    .ToListAsync(ct);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }
            else
            {
                query = query.Where(p => p.Category.Slug == queryParams.CategorySlug);
            }
        }
        else if (queryParams.CategoryId.HasValue)
        {
            var categoryIds = await _context.Categories
                .Where(c => c.Id == queryParams.CategoryId.Value || c.ParentId == queryParams.CategoryId.Value)
                .Select(c => c.Id)
                .ToListAsync(ct);
            query = query.Where(p => categoryIds.Contains(p.CategoryId));
        }

        // Filter by brand
        if (!string.IsNullOrWhiteSpace(queryParams.BrandSlug))
        {
            query = query.Where(p => p.Brand.Slug == queryParams.BrandSlug);
        }
        else if (queryParams.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == queryParams.BrandId.Value);
        }

        // Filter by price range
        if (queryParams.MinPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice >= queryParams.MinPrice.Value);
        }

        if (queryParams.MaxPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice <= queryParams.MaxPrice.Value);
        }

        // Filter by isFeatured
        if (queryParams.IsFeatured.HasValue)
        {
            query = query.Where(p => p.IsFeatured == queryParams.IsFeatured.Value);
        }

        // Full-Text & Multi-Field Search (Diacritic-insensitive, Slug, Category & Brand aware)
        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var rawSearch = queryParams.Search.Trim().ToLower();
            var unaccented = StringUtils.RemoveVietnameseTones(queryParams.Search);
            var slugTerm = unaccented.Replace(' ', '-');
            var tokens = unaccented.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var rawTokens = rawSearch.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (tokens.Length <= 1)
            {
                query = query.Where(p =>
                    EF.Functions.Like(p.Name.ToLower(), $"%{rawSearch}%") ||
                    EF.Functions.Like(p.Name.ToLower(), $"%{unaccented}%") ||
                    EF.Functions.Like(p.Slug.ToLower(), $"%{slugTerm}%") ||
                    EF.Functions.Like(p.Category.Name.ToLower(), $"%{rawSearch}%") ||
                    EF.Functions.Like(p.Category.Name.ToLower(), $"%{unaccented}%") ||
                    EF.Functions.Like(p.Category.Slug.ToLower(), $"%{slugTerm}%") ||
                    EF.Functions.Like(p.Brand.Name.ToLower(), $"%{rawSearch}%") ||
                    EF.Functions.Like(p.Brand.Name.ToLower(), $"%{unaccented}%") ||
                    EF.Functions.Like(p.Brand.Slug.ToLower(), $"%{slugTerm}%"));
            }
            else
            {
                // Multi-token search (e.g. "dien thoai", "dien thoai samsung", "chuot logitech", "ban phim co")
                // All tokens must match across the product's attributes (Name, Slug, Category, Brand)
                for (int i = 0; i < tokens.Length; i++)
                {
                    var uToken = tokens[i];
                    var rToken = i < rawTokens.Length ? rawTokens[i] : uToken;
                    if (uToken.Length < 2 && rToken.Length < 2) continue;

                    query = query.Where(p =>
                        EF.Functions.Like(p.Name.ToLower(), $"%{rToken}%") ||
                        EF.Functions.Like(p.Name.ToLower(), $"%{uToken}%") ||
                        EF.Functions.Like(p.Slug.ToLower(), $"%{uToken}%") ||
                        EF.Functions.Like(p.Category.Name.ToLower(), $"%{rToken}%") ||
                        EF.Functions.Like(p.Category.Name.ToLower(), $"%{uToken}%") ||
                        EF.Functions.Like(p.Category.Slug.ToLower(), $"%{uToken}%") ||
                        EF.Functions.Like(p.Brand.Name.ToLower(), $"%{rToken}%") ||
                        EF.Functions.Like(p.Brand.Name.ToLower(), $"%{uToken}%") ||
                        EF.Functions.Like(p.Brand.Slug.ToLower(), $"%{uToken}%"));
                }
            }
        }

        // JSONB specs filter
        if (queryParams.Specs != null && queryParams.Specs.Count > 0)
        {
            foreach (var (key, value) in queryParams.Specs)
            {
                if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
                {
                    query = query.Where(p =>
                        p.Specifications.Contains($"\"{key}\": \"{value}\"") ||
                        p.Specifications.Contains($"\"{key}\":\"{value}\""));
                }
            }
        }

        // Sorting
        if (!string.IsNullOrWhiteSpace(queryParams.Search) && string.IsNullOrWhiteSpace(queryParams.Sort))
        {
            var rawSearch = queryParams.Search.Trim().ToLower();
            var unaccented = StringUtils.RemoveVietnameseTones(queryParams.Search);
            var slugTerm = unaccented.Replace(' ', '-');

            query = query
                .OrderByDescending(p => EF.Functions.Like(p.Name.ToLower(), $"%{rawSearch}%") || EF.Functions.Like(p.Slug.ToLower(), $"%{slugTerm}%"))
                .ThenByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.CreatedAt);
        }
        else
        {
            query = queryParams.Sort?.ToLowerInvariant() switch
            {
                "price_asc" => query.OrderBy(p => p.BasePrice),
                "price_desc" => query.OrderByDescending(p => p.BasePrice),
                "oldest" => query.OrderBy(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt) // default newest
            };
        }

        // Total count
        var totalItems = await query.CountAsync(ct);

        // Tự động kích hoạt tìm kiếm mờ (Fuzzy / Trigram Similarity) nếu từ khóa gõ sai chính tả và không có kết quả chính xác
        if (totalItems == 0 && !string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var rawSearch = queryParams.Search.Trim().ToLower();
            var unaccented = StringUtils.RemoveVietnameseTones(queryParams.Search);
            bool isRelational = ((DbContext)_context).Database.IsRelational();

            if (isRelational)
            {
                var fuzzyQuery = _context.Products.Where(p => p.IsActive).AsNoTracking();

                if (!string.IsNullOrWhiteSpace(queryParams.CategorySlug))
                {
                    fuzzyQuery = fuzzyQuery.Where(p => p.Category.Slug == queryParams.CategorySlug);
                }
                else if (queryParams.CategoryId.HasValue)
                {
                    fuzzyQuery = fuzzyQuery.Where(p => p.CategoryId == queryParams.CategoryId.Value);
                }

                if (queryParams.MinPrice.HasValue) fuzzyQuery = fuzzyQuery.Where(p => p.BasePrice >= queryParams.MinPrice.Value);
                if (queryParams.MaxPrice.HasValue) fuzzyQuery = fuzzyQuery.Where(p => p.BasePrice <= queryParams.MaxPrice.Value);

                fuzzyQuery = fuzzyQuery.Where(p =>
                    EF.Functions.TrigramsSimilarity(p.Name, rawSearch) > 0.22 ||
                    EF.Functions.TrigramsSimilarity(p.Name, unaccented) > 0.22 ||
                    EF.Functions.TrigramsSimilarity(p.Brand.Name, rawSearch) > 0.35 ||
                    EF.Functions.TrigramsSimilarity(p.Category.Name, unaccented) > 0.35);

                int fuzzyCount = await fuzzyQuery.CountAsync(ct);
                if (fuzzyCount > 0)
                {
                    query = fuzzyQuery
                        .OrderByDescending(p => EF.Functions.TrigramsSimilarity(p.Name, rawSearch))
                        .ThenByDescending(p => p.IsFeatured);
                    totalItems = fuzzyCount;
                }
            }
        }

        // Paged items projection (Direct projection eliminates N+1 queries completely)
        var items = await query
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ShortDescription = p.ShortDescription,
                ThumbnailUrl = p.ThumbnailUrl,
                BasePrice = p.BasePrice,
                MinPrice = p.Variants.Any() ? p.Variants.Min(v => v.SalePrice) : p.BasePrice,
                MaxPrice = p.Variants.Any() ? p.Variants.Max(v => v.SalePrice) : p.BasePrice,
                Model3DUrl = p.Model3DUrl,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                CategorySlug = p.Category.Slug,
                BrandId = p.BrandId,
                BrandName = p.Brand.Name,
                BrandSlug = p.Brand.Slug,
                IsFeatured = p.IsFeatured,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<ProductListDto>(items, queryParams.Page, queryParams.PageSize, totalItems);
        return Result<PagedResult<ProductListDto>>.Success(pagedResult);
    }

    public async Task<Result<ProductDetailDto>> GetProductBySlugAsync(string slug, CancellationToken ct = default)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants.Where(v => v.IsActive))
                .ThenInclude(v => v.Images)
            .Include(p => p.Variants.Where(v => v.IsActive))
                .ThenInclude(v => v.PriceSchedules)
            .Include(p => p.Images)
            .AsNoTracking()
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);

        if (product == null)
        {
            return Result<ProductDetailDto>.Failure("Không tìm thấy sản phẩm");
        }

        var dto = new ProductDetailDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            ShortDescription = product.ShortDescription,
            Description = product.Description,
            Specifications = product.Specifications,
            Model3DUrl = product.Model3DUrl,
            ThumbnailUrl = product.ThumbnailUrl,
            BasePrice = product.BasePrice,
            IsFeatured = product.IsFeatured,
            Category = new CategoryBriefDto
            {
                Id = product.Category.Id,
                Name = product.Category.Name,
                Slug = product.Category.Slug
            },
            Brand = new BrandBriefDto
            {
                Id = product.Brand.Id,
                Name = product.Brand.Name,
                Slug = product.Brand.Slug,
                LogoUrl = product.Brand.LogoUrl
            },
            Variants = product.Variants.Select(v =>
            {
                var priceInfo = _pricingService?.CalculateCurrentPrice(v) ?? new MadK.Application.DTOs.Pricing.CurrentPriceResult
                {
                    VariantId = v.Id,
                    OriginalPrice = v.OriginalPrice,
                    CurrentPrice = v.SalePrice,
                    IsOnSale = false
                };
                return new ProductVariantDto
                {
                    Id = v.Id,
                    Sku = v.Sku,
                    Name = v.Name,
                    Attributes = v.Attributes,
                    OriginalPrice = priceInfo.OriginalPrice,
                    SalePrice = priceInfo.CurrentPrice,
                    CostPrice = v.CostPrice,
                    IsActive = v.IsActive,
                    IsOnSale = priceInfo.IsOnSale,
                    PromotionName = priceInfo.PromotionName,
                    PromotionEndDate = priceInfo.PromotionEndDate,
                    DiscountPercent = priceInfo.DiscountPercent,
                    Images = v.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
                    {
                        Id = i.Id,
                        VariantId = i.VariantId,
                        ImageUrl = i.ImageUrl,
                        AltText = i.AltText,
                        DisplayOrder = i.DisplayOrder,
                        IsPrimary = i.IsPrimary
                    }).ToList()
                };
            }).ToList(),
            Images = product.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
            {
                Id = i.Id,
                VariantId = i.VariantId,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary
            }).ToList()
        };

        return Result<ProductDetailDto>.Success(dto);
    }

    public async Task<Result<SearchSuggestionsDto>> GetSearchSuggestionsAsync(string query, int limit = 6, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Result<SearchSuggestionsDto>.Success(new SearchSuggestionsDto(
                Array.Empty<ProductSuggestionDto>(),
                Array.Empty<CategorySuggestionDto>(),
                Array.Empty<BrandSuggestionDto>(),
                string.Empty));
        }

        var raw = query.Trim().ToLower();
        var unaccented = StringUtils.RemoveVietnameseTones(query);
        var slugTerm = unaccented.Replace(' ', '-');
        bool isRelational = ((DbContext)_context).Database.IsRelational();

        // 1. Gợi ý sản phẩm phù hợp (chính xác + mờ)
        var prodQuery = _context.Products
            .Where(p => p.IsActive)
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .AsNoTracking();

        List<ProductSuggestionDto> products;
        if (isRelational)
        {
            products = await prodQuery
                .Where(p =>
                    EF.Functions.Like(p.Name.ToLower(), $"%{raw}%") ||
                    EF.Functions.Like(p.Name.ToLower(), $"%{unaccented}%") ||
                    EF.Functions.Like(p.Slug.ToLower(), $"%{slugTerm}%") ||
                    EF.Functions.TrigramsSimilarity(p.Name, raw) > 0.22 ||
                    EF.Functions.TrigramsSimilarity(p.Name, unaccented) > 0.22)
                .OrderByDescending(p => EF.Functions.Like(p.Name.ToLower(), $"%{raw}%"))
                .ThenByDescending(p => EF.Functions.TrigramsSimilarity(p.Name, raw))
                .Take(limit)
                .Select(p => new ProductSuggestionDto(
                    p.Id,
                    p.Name,
                    p.Slug,
                    p.ThumbnailUrl,
                    p.BasePrice,
                    p.Brand.Name,
                    p.Category.Name))
                .ToListAsync(ct);
        }
        else
        {
            products = await prodQuery
                .Where(p => p.Name.ToLower().Contains(raw) || p.Name.ToLower().Contains(unaccented))
                .Take(limit)
                .Select(p => new ProductSuggestionDto(
                    p.Id,
                    p.Name,
                    p.Slug,
                    p.ThumbnailUrl,
                    p.BasePrice,
                    p.Brand.Name,
                    p.Category.Name))
                .ToListAsync(ct);
        }

        // 2. Gợi ý danh mục liên quan
        var catQuery = _context.Categories.Where(c => c.IsActive).AsNoTracking();
        var categories = await catQuery
            .Where(c =>
                c.Name.ToLower().Contains(raw) ||
                c.Name.ToLower().Contains(unaccented) ||
                c.Slug.Contains(slugTerm))
            .Take(3)
            .Select(c => new CategorySuggestionDto(c.Id, c.Name, c.Slug))
            .ToListAsync(ct);

        // 3. Gợi ý thương hiệu liên quan
        var brandQuery = _context.Brands.Where(b => b.IsActive).AsNoTracking();
        var brands = await brandQuery
            .Where(b =>
                b.Name.ToLower().Contains(raw) ||
                b.Name.ToLower().Contains(unaccented) ||
                b.Slug.Contains(slugTerm))
            .Take(3)
            .Select(b => new BrandSuggestionDto(b.Id, b.Name, b.Slug, b.LogoUrl))
            .ToListAsync(ct);

        return Result<SearchSuggestionsDto>.Success(new SearchSuggestionsDto(products, categories, brands, query));
    }
}
