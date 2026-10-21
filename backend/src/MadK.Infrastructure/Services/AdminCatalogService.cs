using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MadK.Application.Common;
using MadK.Application.DTOs.Admin;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class AdminCatalogService : IAdminCatalogService
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AdminCatalogService> _logger;

    public AdminCatalogService(
        IAppDbContext context,
        IAuditLogService auditLogService,
        ILogger<AdminCatalogService> logger)
    {
        _context = context;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    #region Helper Methods
    private static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Guid.NewGuid().ToString("N")[..8];

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        var clean = stringBuilder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        clean = Regex.Replace(clean, @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');

        return string.IsNullOrWhiteSpace(clean) ? Guid.NewGuid().ToString("N")[..8] : clean;
    }

    private static bool IsValidJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return true;
        try
        {
            using var doc = JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
    #endregion

    #region Category Management
    public async Task<Result<IReadOnlyList<AdminCategoryListDto>>> GetCategoriesAsync(bool includeDeleted = false, CancellationToken ct = default)
    {
        var query = _context.Categories.AsNoTracking();
        if (includeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        var categories = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new AdminCategoryListDto(
                c.Id,
                c.ParentId,
                c.Parent != null ? c.Parent.Name : null,
                c.Name,
                c.Slug,
                c.Description,
                c.IconUrl,
                c.DisplayOrder,
                c.IsActive,
                c.IsDeleted,
                c.Products.Count(p => !p.IsDeleted),
                c.SpecTemplate != null,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<AdminCategoryListDto>>.Success(categories);
    }

    public async Task<Result<AdminCategoryDetailDto>> GetCategoryByIdAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _context.Categories
            .IgnoreQueryFilters()
            .Include(c => c.SpecTemplate)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
        {
            return Result<AdminCategoryDetailDto>.Failure("Không tìm thấy danh mục.");
        }

        var dto = new AdminCategoryDetailDto(
            category.Id,
            category.ParentId,
            category.Name,
            category.Slug,
            category.Description,
            category.IconUrl,
            category.DisplayOrder,
            category.IsActive,
            category.IsDeleted,
            category.SpecTemplate?.SchemaDefinition
        );

        return Result<AdminCategoryDetailDto>.Success(dto);
    }

    public async Task<Result<AdminCategoryDetailDto>> CreateCategoryAsync(
        CreateCategoryRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<AdminCategoryDetailDto>.Failure("Tên danh mục không được để trống.");
        }

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : GenerateSlug(request.Slug);

        var existingSlug = await _context.Categories.IgnoreQueryFilters().AnyAsync(c => c.Slug == slug, ct);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..4]}";
        }

        if (request.ParentId.HasValue)
        {
            var parentExists = await _context.Categories.AnyAsync(c => c.Id == request.ParentId.Value, ct);
            if (!parentExists)
            {
                return Result<AdminCategoryDetailDto>.Failure("Danh mục cha không tồn tại.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.SchemaDefinition) && !IsValidJson(request.SchemaDefinition))
        {
            return Result<AdminCategoryDetailDto>.Failure("Schema thông số kỹ thuật phải là JSON hợp lệ.");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            ParentId = request.ParentId,
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description,
            IconUrl = request.IconUrl,
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);

        if (!string.IsNullOrWhiteSpace(request.SchemaDefinition))
        {
            var specTemplate = new CategorySpecTemplate
            {
                Id = Guid.NewGuid(),
                CategoryId = category.Id,
                SchemaDefinition = request.SchemaDefinition,
                CreatedAt = DateTime.UtcNow
            };
            _context.CategorySpecTemplates.Add(specTemplate);
        }

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "CATEGORY_CREATED",
            entityName: "Category",
            entityId: category.Id.ToString(),
            oldValues: null,
            newValues: new { category.Id, category.Name, category.Slug, category.ParentId, category.IsActive },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Tạo danh mục mới: {category.Name} ({category.Slug})",
            ct: ct);

        var resultDto = new AdminCategoryDetailDto(
            category.Id,
            category.ParentId,
            category.Name,
            category.Slug,
            category.Description,
            category.IconUrl,
            category.DisplayOrder,
            category.IsActive,
            category.IsDeleted,
            request.SchemaDefinition
        );

        return Result<AdminCategoryDetailDto>.Success(resultDto);
    }

    public async Task<Result<AdminCategoryDetailDto>> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var category = await _context.Categories
            .Include(c => c.SpecTemplate)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
        {
            return Result<AdminCategoryDetailDto>.Failure("Không tìm thấy danh mục cần cập nhật.");
        }

        if (request.ParentId == id)
        {
            return Result<AdminCategoryDetailDto>.Failure("Một danh mục không thể làm cha của chính nó.");
        }

        if (request.ParentId.HasValue)
        {
            var parentExists = await _context.Categories.AnyAsync(c => c.Id == request.ParentId.Value, ct);
            if (!parentExists)
            {
                return Result<AdminCategoryDetailDto>.Failure("Danh mục cha không tồn tại.");
            }
        }

        var oldValues = new
        {
            category.Name,
            category.Slug,
            category.ParentId,
            category.Description,
            category.IconUrl,
            category.DisplayOrder,
            category.IsActive
        };

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : GenerateSlug(request.Slug);
        if (slug != category.Slug)
        {
            var slugExists = await _context.Categories.IgnoreQueryFilters().AnyAsync(c => c.Slug == slug && c.Id != id, ct);
            if (slugExists)
            {
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..4]}";
            }
            category.Slug = slug;
        }

        category.Name = request.Name.Trim();
        category.ParentId = request.ParentId;
        category.Description = request.Description;
        category.IconUrl = request.IconUrl;
        category.DisplayOrder = request.DisplayOrder;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "CATEGORY_UPDATED",
            entityName: "Category",
            entityId: id.ToString(),
            oldValues: oldValues,
            newValues: new
            {
                category.Name,
                category.Slug,
                category.ParentId,
                category.Description,
                category.IconUrl,
                category.DisplayOrder,
                category.IsActive
            },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Cập nhật thông tin danh mục {category.Name}",
            ct: ct);

        var resultDto = new AdminCategoryDetailDto(
            category.Id,
            category.ParentId,
            category.Name,
            category.Slug,
            category.Description,
            category.IconUrl,
            category.DisplayOrder,
            category.IsActive,
            category.IsDeleted,
            category.SpecTemplate?.SchemaDefinition
        );

        return Result<AdminCategoryDetailDto>.Success(resultDto);
    }

    public async Task<Result<bool>> DeleteCategoryAsync(
        Guid id,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
        {
            return Result<bool>.Failure("Không tìm thấy danh mục.");
        }

        if (category.Children.Any(c => !c.IsDeleted))
        {
            return Result<bool>.Failure("Không thể xóa danh mục đang có danh mục con trực thuộc.");
        }

        if (category.Products.Any(p => !p.IsDeleted))
        {
            return Result<bool>.Failure("Không thể xóa danh mục đang có sản phẩm còn hoạt động.");
        }

        category.IsDeleted = true;
        category.DeletedAt = DateTime.UtcNow;
        category.IsActive = false;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "CATEGORY_DELETED",
            entityName: "Category",
            entityId: id.ToString(),
            oldValues: new { category.Name, category.Slug, category.IsDeleted },
            newValues: new { IsDeleted = true, DeletedAt = category.DeletedAt },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Xóa mềm danh mục {category.Name}",
            ct: ct);

        return Result<bool>.Success(true);
    }

    public async Task<Result<string>> UpdateCategorySchemaAsync(
        Guid id,
        string schemaDefinition,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        if (!IsValidJson(schemaDefinition))
        {
            return Result<string>.Failure("Định dạng schema thông số kỹ thuật không hợp lệ (cần JSON hợp lệ).");
        }

        var category = await _context.Categories
            .Include(c => c.SpecTemplate)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
        {
            return Result<string>.Failure("Không tìm thấy danh mục.");
        }

        string? oldSchema = category.SpecTemplate?.SchemaDefinition;

        if (category.SpecTemplate == null)
        {
            category.SpecTemplate = new CategorySpecTemplate
            {
                Id = Guid.NewGuid(),
                CategoryId = id,
                SchemaDefinition = schemaDefinition,
                CreatedAt = DateTime.UtcNow
            };
            _context.CategorySpecTemplates.Add(category.SpecTemplate);
        }
        else
        {
            category.SpecTemplate.SchemaDefinition = schemaDefinition;
            category.SpecTemplate.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "CATEGORY_SCHEMA_UPDATED",
            entityName: "CategorySpecTemplate",
            entityId: category.SpecTemplate.Id.ToString(),
            oldValues: new { SchemaDefinition = oldSchema },
            newValues: new { SchemaDefinition = schemaDefinition },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Cập nhật JSON schema thông số cho danh mục {category.Name}",
            ct: ct);

        return Result<string>.Success(schemaDefinition);
    }
    #endregion

    #region Brand Management
    public async Task<Result<IReadOnlyList<AdminBrandListDto>>> GetBrandsAsync(bool includeDeleted = false, CancellationToken ct = default)
    {
        var query = _context.Brands.AsNoTracking();
        if (includeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        var brands = await query
            .OrderBy(b => b.Name)
            .Select(b => new AdminBrandListDto(
                b.Id,
                b.Name,
                b.Slug,
                b.LogoUrl,
                b.Description,
                b.IsActive,
                b.IsDeleted,
                b.Products.Count(p => !p.IsDeleted),
                b.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<IReadOnlyList<AdminBrandListDto>>.Success(brands);
    }

    public async Task<Result<AdminBrandDetailDto>> GetBrandByIdAsync(Guid id, CancellationToken ct = default)
    {
        var brand = await _context.Brands
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        if (brand == null)
        {
            return Result<AdminBrandDetailDto>.Failure("Không tìm thấy thương hiệu.");
        }

        var dto = new AdminBrandDetailDto(
            brand.Id,
            brand.Name,
            brand.Slug,
            brand.LogoUrl,
            brand.Description,
            brand.IsActive,
            brand.IsDeleted
        );

        return Result<AdminBrandDetailDto>.Success(dto);
    }

    public async Task<Result<AdminBrandDetailDto>> CreateBrandAsync(
        CreateBrandRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<AdminBrandDetailDto>.Failure("Tên thương hiệu không được để trống.");
        }

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : GenerateSlug(request.Slug);
        var existingSlug = await _context.Brands.IgnoreQueryFilters().AnyAsync(b => b.Slug == slug, ct);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..4]}";
        }

        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            LogoUrl = request.LogoUrl,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Brands.Add(brand);
        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "BRAND_CREATED",
            entityName: "Brand",
            entityId: brand.Id.ToString(),
            oldValues: null,
            newValues: new { brand.Id, brand.Name, brand.Slug, brand.IsActive },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Tạo thương hiệu mới: {brand.Name}",
            ct: ct);

        var dto = new AdminBrandDetailDto(
            brand.Id,
            brand.Name,
            brand.Slug,
            brand.LogoUrl,
            brand.Description,
            brand.IsActive,
            brand.IsDeleted
        );

        return Result<AdminBrandDetailDto>.Success(dto);
    }

    public async Task<Result<AdminBrandDetailDto>> UpdateBrandAsync(
        Guid id,
        UpdateBrandRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (brand == null)
        {
            return Result<AdminBrandDetailDto>.Failure("Không tìm thấy thương hiệu.");
        }

        var oldValues = new { brand.Name, brand.Slug, brand.LogoUrl, brand.Description, brand.IsActive };

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : GenerateSlug(request.Slug);
        if (slug != brand.Slug)
        {
            var slugExists = await _context.Brands.IgnoreQueryFilters().AnyAsync(b => b.Slug == slug && b.Id != id, ct);
            if (slugExists)
            {
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..4]}";
            }
            brand.Slug = slug;
        }

        brand.Name = request.Name.Trim();
        brand.LogoUrl = request.LogoUrl;
        brand.Description = request.Description;
        brand.IsActive = request.IsActive;
        brand.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "BRAND_UPDATED",
            entityName: "Brand",
            entityId: id.ToString(),
            oldValues: oldValues,
            newValues: new { brand.Name, brand.Slug, brand.LogoUrl, brand.Description, brand.IsActive },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Cập nhật thương hiệu {brand.Name}",
            ct: ct);

        var dto = new AdminBrandDetailDto(
            brand.Id,
            brand.Name,
            brand.Slug,
            brand.LogoUrl,
            brand.Description,
            brand.IsActive,
            brand.IsDeleted
        );

        return Result<AdminBrandDetailDto>.Success(dto);
    }

    public async Task<Result<bool>> DeleteBrandAsync(
        Guid id,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var brand = await _context.Brands
            .Include(b => b.Products)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        if (brand == null)
        {
            return Result<bool>.Failure("Không tìm thấy thương hiệu.");
        }

        if (brand.Products.Any(p => !p.IsDeleted))
        {
            return Result<bool>.Failure("Không thể xóa thương hiệu đang có sản phẩm còn hoạt động.");
        }

        brand.IsDeleted = true;
        brand.DeletedAt = DateTime.UtcNow;
        brand.IsActive = false;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "BRAND_DELETED",
            entityName: "Brand",
            entityId: id.ToString(),
            oldValues: new { brand.Name, brand.Slug, brand.IsDeleted },
            newValues: new { IsDeleted = true, DeletedAt = brand.DeletedAt },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Xóa mềm thương hiệu {brand.Name}",
            ct: ct);

        return Result<bool>.Success(true);
    }
    #endregion

    #region Product Management
    public async Task<Result<PagedResult<AdminProductListDto>>> GetProductsAsync(AdminProductQueryFilter filter, CancellationToken ct = default)
    {
        var query = _context.Products.AsNoTracking();

        if (filter.IsDeleted == true)
        {
            query = query.IgnoreQueryFilters().Where(p => p.IsDeleted);
        }
        else if (filter.IsDeleted == false)
        {
            query = query.Where(p => !p.IsDeleted);
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        if (filter.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == filter.BrandId.Value);
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(p => p.IsActive == filter.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.Slug.ToLower().Contains(search) ||
                p.Variants.Any(v => v.Sku.ToLower().Contains(search)));
        }

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "price_asc" => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "name_asc" => query.OrderBy(p => p.Name),
            "name_desc" => query.OrderByDescending(p => p.Name),
            "oldest" => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var totalItems = await query.CountAsync(ct);

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminProductListDto(
                p.Id,
                p.Name,
                p.Slug,
                p.CategoryId,
                p.Category.Name,
                p.BrandId,
                p.Brand.Name,
                p.BasePrice,
                p.Variants.Any() ? p.Variants.Min(v => v.SalePrice) : p.BasePrice,
                p.Variants.Any() ? p.Variants.Max(v => v.SalePrice) : p.BasePrice,
                p.ThumbnailUrl,
                p.Model3DUrl,
                p.IsFeatured,
                p.IsActive,
                p.IsDeleted,
                p.Variants.Count(v => !v.IsDeleted),
                p.Variants.Where(v => !v.IsDeleted).Sum(v => v.Inventory != null ? v.Inventory.OnHandQuantity : v.StockQuantity),
                p.CreatedAt,
                p.UpdatedAt
            ))
            .ToListAsync(ct);

        var pagedResult = new PagedResult<AdminProductListDto>(items, page, pageSize, totalItems);
        return Result<PagedResult<AdminProductListDto>>.Success(pagedResult);
    }

    public async Task<Result<AdminProductDetailDto>> GetProductByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _context.Products
            .IgnoreQueryFilters()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Inventory)
            .Include(p => p.Images)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product == null)
        {
            return Result<AdminProductDetailDto>.Failure("Không tìm thấy sản phẩm.");
        }

        var variantsDto = product.Variants
            .OrderBy(v => v.Name)
            .Select(v => new AdminProductVariantDto(
                v.Id,
                v.ProductId,
                v.Sku,
                v.Name,
                v.Attributes,
                v.OriginalPrice,
                v.SalePrice,
                v.CostPrice,
                v.IsActive,
                v.IsDeleted,
                v.Inventory?.OnHandQuantity ?? v.StockQuantity,
                v.Inventory?.ReservedQuantity ?? 0,
                v.Inventory?.AvailableQuantity ?? v.StockQuantity
            ))
            .ToList();

        var imagesDto = product.Images
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new AdminProductImageDto(
                i.Id,
                i.ProductId,
                i.VariantId,
                i.ImageUrl,
                i.AltText,
                i.DisplayOrder,
                i.IsPrimary
            ))
            .ToList();

        var detail = new AdminProductDetailDto(
            product.Id,
            product.Name,
            product.Slug,
            product.ShortDescription,
            product.Description,
            product.CategoryId,
            product.Category.Name,
            product.BrandId,
            product.Brand.Name,
            product.BasePrice,
            product.Specifications,
            product.Model3DUrl,
            product.ThumbnailUrl,
            product.IsFeatured,
            product.IsActive,
            product.IsDeleted,
            variantsDto,
            imagesDto,
            product.CreatedAt,
            product.UpdatedAt
        );

        return Result<AdminProductDetailDto>.Success(detail);
    }

    public async Task<Result<AdminProductDetailDto>> CreateProductAsync(
        CreateProductRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<AdminProductDetailDto>.Failure("Tên sản phẩm không được để trống.");
        }

        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct);
        if (category == null)
        {
            return Result<AdminProductDetailDto>.Failure("Danh mục đã chọn không tồn tại.");
        }

        var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Id == request.BrandId, ct);
        if (brand == null)
        {
            return Result<AdminProductDetailDto>.Failure("Thương hiệu đã chọn không tồn tại.");
        }

        var specs = string.IsNullOrWhiteSpace(request.Specifications) ? "{}" : request.Specifications;
        if (!IsValidJson(specs))
        {
            return Result<AdminProductDetailDto>.Failure("Thông số kỹ thuật sản phẩm phải là chuỗi JSON hợp lệ.");
        }

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : GenerateSlug(request.Slug);
        var existingSlug = await _context.Products.IgnoreQueryFilters().AnyAsync(p => p.Slug == slug, ct);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..4]}";
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            Name = request.Name.Trim(),
            Slug = slug,
            ShortDescription = request.ShortDescription,
            Description = request.Description,
            BasePrice = request.BasePrice,
            Specifications = specs,
            Model3DUrl = request.Model3DUrl,
            ThumbnailUrl = request.ThumbnailUrl,
            IsFeatured = request.IsFeatured,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);

        // Process initial variants if provided
        var createdVariants = new List<ProductVariant>();
        if (request.Variants != null && request.Variants.Count > 0)
        {
            foreach (var vReq in request.Variants)
            {
                if (string.IsNullOrWhiteSpace(vReq.Sku))
                {
                    return Result<AdminProductDetailDto>.Failure("Mã SKU của biến thể không được rỗng.");
                }

                var skuUpper = vReq.Sku.Trim().ToUpperInvariant();
                var skuExists = await _context.ProductVariants.IgnoreQueryFilters().AnyAsync(v => v.Sku == skuUpper, ct);
                if (skuExists)
                {
                    return Result<AdminProductDetailDto>.Failure($"Mã SKU '{skuUpper}' đã tồn tại trong hệ thống.");
                }

                var variant = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Sku = skuUpper,
                    Name = string.IsNullOrWhiteSpace(vReq.Name) ? product.Name : vReq.Name.Trim(),
                    Attributes = string.IsNullOrWhiteSpace(vReq.Attributes) ? "{}" : vReq.Attributes,
                    OriginalPrice = vReq.OriginalPrice > 0 ? vReq.OriginalPrice : request.BasePrice,
                    SalePrice = vReq.SalePrice > 0 ? vReq.SalePrice : request.BasePrice,
                    CostPrice = vReq.CostPrice,
                    StockQuantity = Math.Max(0, vReq.StockQuantity),
                    IsActive = vReq.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProductVariants.Add(variant);
                createdVariants.Add(variant);

                // Add corresponding inventory
                var inventory = new Inventory
                {
                    Id = Guid.NewGuid(),
                    VariantId = variant.Id,
                    OnHandQuantity = variant.StockQuantity,
                    ReservedQuantity = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Inventories.Add(inventory);
            }
        }
        else
        {
            // Create a default variant if none provided
            var defaultSku = $"{slug.ToUpperInvariant()[..Math.Min(8, slug.Length)]}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";
            var defaultVariant = new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Sku = defaultSku,
                Name = product.Name,
                Attributes = "{}",
                OriginalPrice = product.BasePrice,
                SalePrice = product.BasePrice,
                CostPrice = 0,
                StockQuantity = 10,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.ProductVariants.Add(defaultVariant);
            createdVariants.Add(defaultVariant);

            _context.Inventories.Add(new Inventory
            {
                Id = Guid.NewGuid(),
                VariantId = defaultVariant.Id,
                OnHandQuantity = 10,
                ReservedQuantity = 0,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Process images if provided
        var createdImages = new List<ProductImage>();
        if (request.Images != null && request.Images.Count > 0)
        {
            foreach (var imgReq in request.Images)
            {
                var img = new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    VariantId = imgReq.VariantId,
                    ImageUrl = imgReq.ImageUrl,
                    AltText = imgReq.AltText ?? product.Name,
                    DisplayOrder = imgReq.DisplayOrder,
                    IsPrimary = imgReq.IsPrimary,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ProductImages.Add(img);
                createdImages.Add(img);

                if (img.IsPrimary && string.IsNullOrEmpty(product.ThumbnailUrl))
                {
                    product.ThumbnailUrl = img.ImageUrl;
                }
            }

            if (string.IsNullOrEmpty(product.ThumbnailUrl) && createdImages.Count > 0)
            {
                product.ThumbnailUrl = createdImages[0].ImageUrl;
            }
        }

        await _context.SaveChangesAsync(ct);

        // Audit Log
        await _auditLogService.LogAsync(
            action: "PRODUCT_CREATED",
            entityName: "Product",
            entityId: product.Id.ToString(),
            oldValues: null,
            newValues: new
            {
                product.Id,
                product.Name,
                product.Slug,
                product.CategoryId,
                product.BrandId,
                product.BasePrice,
                product.Model3DUrl,
                VariantsCount = createdVariants.Count
            },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Tạo sản phẩm mới '{product.Name}' ({product.Slug}) kèm {createdVariants.Count} biến thể",
            ct: ct);

        return await GetProductByIdAsync(product.Id, ct);
    }

    public async Task<Result<AdminProductDetailDto>> UpdateProductAsync(
        Guid id,
        UpdateProductRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
        {
            return Result<AdminProductDetailDto>.Failure("Không tìm thấy sản phẩm cần cập nhật.");
        }

        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct);
        if (category == null)
        {
            return Result<AdminProductDetailDto>.Failure("Danh mục đã chọn không tồn tại.");
        }

        var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Id == request.BrandId, ct);
        if (brand == null)
        {
            return Result<AdminProductDetailDto>.Failure("Thương hiệu đã chọn không tồn tại.");
        }

        var specs = string.IsNullOrWhiteSpace(request.Specifications) ? "{}" : request.Specifications;
        if (!IsValidJson(specs))
        {
            return Result<AdminProductDetailDto>.Failure("Thông số kỹ thuật sản phẩm phải là chuỗi JSON hợp lệ.");
        }

        var oldValues = new
        {
            product.Name,
            product.Slug,
            product.CategoryId,
            product.BrandId,
            product.BasePrice,
            product.Specifications,
            product.Model3DUrl,
            product.ThumbnailUrl,
            product.IsFeatured,
            product.IsActive
        };

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : GenerateSlug(request.Slug);
        if (slug != product.Slug)
        {
            var slugExists = await _context.Products.IgnoreQueryFilters().AnyAsync(p => p.Slug == slug && p.Id != id, ct);
            if (slugExists)
            {
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..4]}";
            }
            product.Slug = slug;
        }

        product.Name = request.Name.Trim();
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.ShortDescription = request.ShortDescription;
        product.Description = request.Description;
        product.BasePrice = request.BasePrice;
        product.Specifications = specs;
        product.Model3DUrl = request.Model3DUrl;
        product.ThumbnailUrl = request.ThumbnailUrl;
        product.IsFeatured = request.IsFeatured;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_UPDATED",
            entityName: "Product",
            entityId: id.ToString(),
            oldValues: oldValues,
            newValues: new
            {
                product.Name,
                product.Slug,
                product.CategoryId,
                product.BrandId,
                product.BasePrice,
                product.Specifications,
                product.Model3DUrl,
                product.ThumbnailUrl,
                product.IsFeatured,
                product.IsActive
            },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Cập nhật sản phẩm '{product.Name}'",
            ct: ct);

        return await GetProductByIdAsync(product.Id, ct);
    }

    public async Task<Result<bool>> ToggleProductVisibilityAsync(
        Guid id,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product == null)
        {
            return Result<bool>.Failure("Không tìm thấy sản phẩm.");
        }

        var oldActive = product.IsActive;
        product.IsActive = !product.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_VISIBILITY_TOGGLED",
            entityName: "Product",
            entityId: id.ToString(),
            oldValues: new { IsActive = oldActive },
            newValues: new { IsActive = product.IsActive },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Thay đổi trạng thái hiển thị của sản phẩm '{product.Name}' sang {(product.IsActive ? "Hiển thị" : "Ẩn")}",
            ct: ct);

        return Result<bool>.Success(product.IsActive);
    }

    public async Task<Result<bool>> DeleteProductAsync(
        Guid id,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var product = await _context.Products
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product == null)
        {
            return Result<bool>.Failure("Không tìm thấy sản phẩm.");
        }

        product.IsDeleted = true;
        product.DeletedAt = DateTime.UtcNow;
        product.IsActive = false;

        foreach (var variant in product.Variants)
        {
            variant.IsDeleted = true;
            variant.DeletedAt = DateTime.UtcNow;
            variant.IsActive = false;
        }

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_DELETED",
            entityName: "Product",
            entityId: id.ToString(),
            oldValues: new { product.Name, product.Slug, IsDeleted = false },
            newValues: new { IsDeleted = true, DeletedAt = product.DeletedAt },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Xóa mềm sản phẩm '{product.Name}'",
            ct: ct);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RestoreProductAsync(
        Guid id,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var product = await _context.Products
            .IgnoreQueryFilters()
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product == null)
        {
            return Result<bool>.Failure("Không tìm thấy sản phẩm.");
        }

        product.IsDeleted = false;
        product.DeletedAt = null;
        product.IsActive = true;

        foreach (var variant in product.Variants)
        {
            variant.IsDeleted = false;
            variant.DeletedAt = null;
            variant.IsActive = true;
        }

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_RESTORED",
            entityName: "Product",
            entityId: id.ToString(),
            oldValues: new { IsDeleted = true },
            newValues: new { IsDeleted = false },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Khôi phục sản phẩm '{product.Name}' từ thùng rác",
            ct: ct);

        return Result<bool>.Success(true);
    }
    #endregion

    #region Product Variant Management
    public async Task<Result<AdminProductVariantDto>> CreateVariantAsync(
        Guid productId,
        CreateProductVariantRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product == null)
        {
            return Result<AdminProductVariantDto>.Failure("Không tìm thấy sản phẩm cha.");
        }

        if (string.IsNullOrWhiteSpace(request.Sku))
        {
            return Result<AdminProductVariantDto>.Failure("Mã SKU không được để trống.");
        }

        var skuUpper = request.Sku.Trim().ToUpperInvariant();
        var skuExists = await _context.ProductVariants.IgnoreQueryFilters().AnyAsync(v => v.Sku == skuUpper, ct);
        if (skuExists)
        {
            return Result<AdminProductVariantDto>.Failure($"Mã SKU '{skuUpper}' đã được sử dụng.");
        }

        var attrs = string.IsNullOrWhiteSpace(request.Attributes) ? "{}" : request.Attributes;
        if (!IsValidJson(attrs))
        {
            return Result<AdminProductVariantDto>.Failure("Thuộc tính biến thể phải là chuỗi JSON hợp lệ.");
        }

        var variant = new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            Sku = skuUpper,
            Name = string.IsNullOrWhiteSpace(request.Name) ? product.Name : request.Name.Trim(),
            Attributes = attrs,
            OriginalPrice = request.OriginalPrice,
            SalePrice = request.SalePrice,
            CostPrice = request.CostPrice,
            StockQuantity = Math.Max(0, request.StockQuantity),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductVariants.Add(variant);

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            VariantId = variant.Id,
            OnHandQuantity = variant.StockQuantity,
            ReservedQuantity = 0,
            CreatedAt = DateTime.UtcNow
        };
        _context.Inventories.Add(inventory);

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_VARIANT_CREATED",
            entityName: "ProductVariant",
            entityId: variant.Id.ToString(),
            oldValues: null,
            newValues: new { variant.Id, variant.ProductId, variant.Sku, variant.Name, variant.SalePrice, variant.StockQuantity },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Tạo biến thể mới SKU: {variant.Sku} cho sản phẩm '{product.Name}'",
            ct: ct);

        var dto = new AdminProductVariantDto(
            variant.Id,
            variant.ProductId,
            variant.Sku,
            variant.Name,
            variant.Attributes,
            variant.OriginalPrice,
            variant.SalePrice,
            variant.CostPrice,
            variant.IsActive,
            variant.IsDeleted,
            variant.StockQuantity,
            0,
            variant.StockQuantity
        );

        return Result<AdminProductVariantDto>.Success(dto);
    }

    public async Task<Result<AdminProductVariantDto>> UpdateVariantAsync(
        Guid variantId,
        UpdateProductVariantRequestDto request,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.Inventory)
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId, ct);

        if (variant == null)
        {
            return Result<AdminProductVariantDto>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        if (!string.IsNullOrWhiteSpace(request.Sku))
        {
            var skuUpper = request.Sku.Trim().ToUpperInvariant();
            if (skuUpper != variant.Sku)
            {
                var skuExists = await _context.ProductVariants.IgnoreQueryFilters().AnyAsync(v => v.Sku == skuUpper && v.Id != variantId, ct);
                if (skuExists)
                {
                    return Result<AdminProductVariantDto>.Failure($"Mã SKU '{skuUpper}' đã tồn tại.");
                }
                variant.Sku = skuUpper;
            }
        }

        var attrs = string.IsNullOrWhiteSpace(request.Attributes) || request.Attributes == "{}" ? variant.Attributes : request.Attributes;
        if (!IsValidJson(attrs))
        {
            return Result<AdminProductVariantDto>.Failure("Thuộc tính biến thể phải là chuỗi JSON hợp lệ.");
        }

        var oldValues = new
        {
            variant.Sku,
            variant.Name,
            variant.SalePrice,
            variant.OriginalPrice,
            variant.CostPrice,
            variant.StockQuantity,
            variant.IsActive
        };

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            variant.Name = request.Name.Trim();
        }
        variant.Attributes = attrs;
        variant.OriginalPrice = request.OriginalPrice;
        variant.SalePrice = request.SalePrice;
        variant.CostPrice = request.CostPrice;
        variant.IsActive = request.IsActive;

        if (request.StockQuantity != variant.StockQuantity)
        {
            variant.StockQuantity = Math.Max(0, request.StockQuantity);
            if (variant.Inventory != null)
            {
                variant.Inventory.OnHandQuantity = variant.StockQuantity;
            }
        }

        variant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_VARIANT_UPDATED",
            entityName: "ProductVariant",
            entityId: variantId.ToString(),
            oldValues: oldValues,
            newValues: new
            {
                variant.Sku,
                variant.Name,
                variant.SalePrice,
                variant.OriginalPrice,
                variant.CostPrice,
                variant.StockQuantity,
                variant.IsActive
            },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Cập nhật biến thể SKU {variant.Sku}",
            ct: ct);

        var dto = new AdminProductVariantDto(
            variant.Id,
            variant.ProductId,
            variant.Sku,
            variant.Name,
            variant.Attributes,
            variant.OriginalPrice,
            variant.SalePrice,
            variant.CostPrice,
            variant.IsActive,
            variant.IsDeleted,
            variant.Inventory?.OnHandQuantity ?? variant.StockQuantity,
            variant.Inventory?.ReservedQuantity ?? 0,
            variant.Inventory?.AvailableQuantity ?? variant.StockQuantity
        );

        return Result<AdminProductVariantDto>.Success(dto);
    }

    public async Task<Result<bool>> DeleteVariantAsync(
        Guid variantId,
        Guid staffId,
        string staffEmail,
        string staffRole,
        string? ip = null,
        string? ua = null,
        CancellationToken ct = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId, ct);

        if (variant == null)
        {
            return Result<bool>.Failure("Không tìm thấy biến thể sản phẩm.");
        }

        // Cannot delete if this is the only non-deleted variant of the product
        var remainingVariantsCount = await _context.ProductVariants
            .CountAsync(v => v.ProductId == variant.ProductId && v.Id != variantId && !v.IsDeleted, ct);

        if (remainingVariantsCount == 0)
        {
            return Result<bool>.Failure("Không thể xóa biến thể duy nhất của sản phẩm. Một sản phẩm phải có ít nhất 1 biến thể.");
        }

        variant.IsDeleted = true;
        variant.DeletedAt = DateTime.UtcNow;
        variant.IsActive = false;

        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            action: "PRODUCT_VARIANT_DELETED",
            entityName: "ProductVariant",
            entityId: variantId.ToString(),
            oldValues: new { variant.Sku, variant.Name, IsDeleted = false },
            newValues: new { IsDeleted = true, DeletedAt = variant.DeletedAt },
            userId: staffId,
            userEmail: staffEmail,
            userRole: staffRole,
            ipAddress: ip,
            userAgent: ua,
            note: $"Xóa mềm biến thể SKU {variant.Sku} của sản phẩm '{variant.Product?.Name}'",
            ct: ct);

        return Result<bool>.Success(true);
    }
    #endregion
}
