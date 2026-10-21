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

        // 1. Available brands with product count
        var brands = await _context.Products
            .Where(p => p.CategoryId == category.Id && p.IsActive)
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
            .Where(p => p.CategoryId == category.Id && p.IsActive)
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

        // Filter by category
        if (!string.IsNullOrWhiteSpace(queryParams.CategorySlug))
        {
            query = query.Where(p => p.Category.Slug == queryParams.CategorySlug);
        }
        else if (queryParams.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == queryParams.CategoryId.Value);
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

        // Full-Text Search
        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(p =>
                EF.Functions.Like(p.Name.ToLower(), $"%{search}%") ||
                (p.Description != null && EF.Functions.Like(p.Description.ToLower(), $"%{search}%")));
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
        query = queryParams.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "oldest" => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt) // default newest
        };

        // Total count
        var totalItems = await query.CountAsync(ct);

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
}
