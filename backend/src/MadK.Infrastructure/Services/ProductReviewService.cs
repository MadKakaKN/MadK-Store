using System.Text.Json;
using MadK.Application.Common;
using MadK.Application.DTOs.Reviews;
using MadK.Application.Interfaces;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Services;

public class ProductReviewService : IProductReviewService
{
    private readonly IAppDbContext _db;
    private readonly ILogger<ProductReviewService> _logger;

    public ProductReviewService(IAppDbContext db, ILogger<ProductReviewService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Result<ProductReviewsPagedResultDto>> GetProductReviewsAsync(
        Guid productId,
        int page = 1,
        int pageSize = 10,
        int? ratingFilter = null,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // 1. Lấy tất cả đánh giá đã duyệt của sản phẩm này để tính tóm tắt sao (Rating Summary)
        var allApprovedReviews = await _db.ProductReviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && !r.IsDeleted && r.Status == ReviewStatus.Approved)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        var totalReviews = allApprovedReviews.Count;
        double averageRating = 5.0;

        var distribution = new Dictionary<int, int>
        {
            [5] = 0,
            [4] = 0,
            [3] = 0,
            [2] = 0,
            [1] = 0
        };

        var percentages = new Dictionary<int, double>
        {
            [5] = 0.0,
            [4] = 0.0,
            [3] = 0.0,
            [2] = 0.0,
            [1] = 0.0
        };

        if (totalReviews > 0)
        {
            averageRating = Math.Round(allApprovedReviews.Average(), 1, MidpointRounding.AwayFromZero);
            foreach (var r in allApprovedReviews)
            {
                if (distribution.ContainsKey(r))
                {
                    distribution[r]++;
                }
            }

            foreach (var star in distribution.Keys)
            {
                percentages[star] = Math.Round((double)distribution[star] / totalReviews * 100, 1, MidpointRounding.AwayFromZero);
            }
        }

        var summary = new ProductReviewSummaryDto(
            AverageRating: averageRating,
            TotalReviews: totalReviews,
            RatingDistribution: distribution,
            RatingPercentages: percentages
        );

        // 2. Query danh sách đánh giá có lọc và phân trang
        var query = _db.ProductReviews
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.ProductId == productId && !r.IsDeleted && r.Status == ReviewStatus.Approved);

        if (ratingFilter.HasValue && ratingFilter.Value >= 1 && ratingFilter.Value <= 5)
        {
            query = query.Where(r => r.Rating == ratingFilter.Value);
        }

        var filteredCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling((double)filteredCount / pageSize);

        var items = await query
            .OrderByDescending(r => r.IsVerifiedPurchase)
            .ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.ProductId,
                r.UserId,
                UserName = !string.IsNullOrWhiteSpace(r.User.FullName) ? r.User.FullName : MaskEmail(r.User.Email),
                r.User.AvatarUrl,
                r.OrderId,
                r.Rating,
                r.Title,
                r.Comment,
                r.ImagesJson,
                r.IsVerifiedPurchase,
                r.Status,
                r.AdminReply,
                r.AdminRepliedAt,
                r.HelpfulCount,
                r.CreatedAt
            })
            .ToListAsync(ct);

        var reviewDtos = items.Select(r => new ProductReviewDto(
            Id: r.Id,
            ProductId: r.ProductId,
            UserId: r.UserId,
            UserName: r.UserName,
            UserAvatar: r.AvatarUrl,
            OrderId: r.OrderId,
            Rating: r.Rating,
            Title: r.Title,
            Comment: r.Comment,
            Images: ParseImages(r.ImagesJson),
            IsVerifiedPurchase: r.IsVerifiedPurchase,
            Status: r.Status,
            AdminReply: r.AdminReply,
            AdminRepliedAt: r.AdminRepliedAt,
            HelpfulCount: r.HelpfulCount,
            CreatedAt: r.CreatedAt
        )).ToList();

        var pagedResult = new ProductReviewsPagedResultDto(
            Summary: summary,
            Items: reviewDtos,
            Page: page,
            PageSize: pageSize,
            TotalCount: filteredCount,
            TotalPages: totalPages
        );

        return Result<ProductReviewsPagedResultDto>.Success(pagedResult);
    }

    public async Task<Result<CanReviewProductResultDto>> CanUserReviewProductAsync(
        Guid userId,
        Guid productId,
        CancellationToken ct = default)
    {
        // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
        var alreadyReviewed = await _db.ProductReviews
            .AsNoTracking()
            .AnyAsync(r => r.UserId == userId && r.ProductId == productId && !r.IsDeleted, ct);

        if (alreadyReviewed)
        {
            return Result<CanReviewProductResultDto>.Success(new CanReviewProductResultDto(
                CanReview: false,
                HasPurchased: true,
                AlreadyReviewed: true,
                Reason: "Bạn đã đánh giá sản phẩm này rồi.",
                EligibleOrderId: null
            ));
        }

        // Kiểm tra đơn hàng hoàn tất chứa sản phẩm này
        var completedOrder = await _db.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId && o.Status == OrderStatus.Completed)
            .Where(o => _db.OrderItems.Any(oi => oi.OrderId == o.Id && (oi.ProductId == productId || (oi.Variant != null && oi.Variant.ProductId == productId))))
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var hasPurchased = completedOrder != null;

        return Result<CanReviewProductResultDto>.Success(new CanReviewProductResultDto(
            CanReview: true,
            HasPurchased: hasPurchased,
            AlreadyReviewed: false,
            Reason: hasPurchased
                ? "Bạn đã mua sản phẩm này và đủ điều kiện đánh giá xác thực."
                : "Bạn có thể đánh giá trải nghiệm về sản phẩm.",
            EligibleOrderId: completedOrder?.Id
        ));
    }

    public async Task<Result<ProductReviewDto>> CreateReviewAsync(
        Guid userId,
        Guid productId,
        CreateProductReviewDto dto,
        CancellationToken ct = default)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
        {
            return Result<ProductReviewDto>.Failure("Số sao đánh giá phải từ 1 đến 5 sao.");
        }

        if (string.IsNullOrWhiteSpace(dto.Comment) || dto.Comment.Trim().Length < 5)
        {
            return Result<ProductReviewDto>.Failure("Nội dung đánh giá phải có tối thiểu 5 ký tự.");
        }

        // Kiểm tra sản phẩm tồn tại
        var product = await _db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted, ct);

        if (product == null)
        {
            return Result<ProductReviewDto>.Failure("Không tìm thấy sản phẩm cần đánh giá.");
        }

        // Kiểm tra người dùng
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct);

        if (user == null)
        {
            return Result<ProductReviewDto>.Failure("Người dùng không hợp lệ hoặc đã bị khóa.");
        }

        // Kiểm tra đã review chưa
        var alreadyReviewed = await _db.ProductReviews
            .AnyAsync(r => r.UserId == userId && r.ProductId == productId && !r.IsDeleted, ct);

        if (alreadyReviewed)
        {
            return Result<ProductReviewDto>.Failure("Bạn đã gửi đánh giá cho sản phẩm này rồi.");
        }

        // Kiểm tra lịch sử mua hàng hoàn tất để cấp tick xanh Verified Purchase
        var completedOrder = await _db.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId && o.Status == OrderStatus.Completed)
            .Where(o => _db.OrderItems.Any(oi => oi.OrderId == o.Id && (oi.ProductId == productId || (oi.Variant != null && oi.Variant.ProductId == productId))))
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var isVerified = completedOrder != null;
        var orderId = dto.OrderId ?? completedOrder?.Id;

        var imagesJson = dto.Images != null && dto.Images.Count > 0
            ? JsonSerializer.Serialize(dto.Images.Take(5).ToList())
            : "[]";

        var review = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            UserId = userId,
            OrderId = orderId,
            Rating = dto.Rating,
            Title = dto.Title?.Trim(),
            Comment = dto.Comment.Trim(),
            ImagesJson = imagesJson,
            IsVerifiedPurchase = isVerified,
            Status = ReviewStatus.Approved, // Mặc định tự động duyệt hiển thị
            CreatedAt = DateTime.UtcNow
        };

        _db.ProductReviews.Add(review);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Người dùng {UserId} ({UserName}) đã đánh giá {Rating} sao cho sản phẩm {ProductId}. Verified: {IsVerified}",
            userId, user.FullName, dto.Rating, productId, isVerified);

        var resultDto = new ProductReviewDto(
            Id: review.Id,
            ProductId: review.ProductId,
            UserId: review.UserId,
            UserName: !string.IsNullOrWhiteSpace(user.FullName) ? user.FullName : MaskEmail(user.Email),
            UserAvatar: user.AvatarUrl,
            OrderId: review.OrderId,
            Rating: review.Rating,
            Title: review.Title,
            Comment: review.Comment,
            Images: ParseImages(review.ImagesJson),
            IsVerifiedPurchase: review.IsVerifiedPurchase,
            Status: review.Status,
            AdminReply: null,
            AdminRepliedAt: null,
            HelpfulCount: 0,
            CreatedAt: review.CreatedAt
        );

        return Result<ProductReviewDto>.Success(resultDto, "Cảm ơn bạn đã gửi đánh giá sản phẩm!");
    }

    public async Task<Result<PagedResult<AdminReviewDto>>> AdminGetReviewsAsync(
        int page = 1,
        int pageSize = 20,
        ReviewStatus? status = null,
        Guid? productId = null,
        string? search = null,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.ProductReviews
            .AsNoTracking()
            .Include(r => r.Product)
            .Include(r => r.User)
            .Include(r => r.Order)
            .Where(r => !r.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        if (productId.HasValue)
        {
            query = query.Where(r => r.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r =>
                r.Product.Name.ToLower().Contains(s) ||
                r.User.FullName.ToLower().Contains(s) ||
                r.User.Email.ToLower().Contains(s) ||
                (r.Title != null && r.Title.ToLower().Contains(s)) ||
                r.Comment.ToLower().Contains(s) ||
                (r.Order != null && r.Order.OrderNumber.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AdminReviewDto(
                r.Id,
                r.ProductId,
                r.Product.Name,
                r.Product.Slug,
                r.Product.ThumbnailUrl,
                r.UserId,
                !string.IsNullOrWhiteSpace(r.User.FullName) ? r.User.FullName : r.User.Email,
                r.User.Email,
                r.OrderId,
                r.Order != null ? r.Order.OrderNumber : null,
                r.Rating,
                r.Title,
                r.Comment,
                ParseImages(r.ImagesJson),
                r.IsVerifiedPurchase,
                r.Status,
                r.AdminReply,
                r.AdminRepliedAt,
                r.HelpfulCount,
                r.CreatedAt
            ))
            .ToListAsync(ct);

        var result = new PagedResult<AdminReviewDto>(items, page, pageSize, totalCount);
        return Result<PagedResult<AdminReviewDto>>.Success(result);
    }

    public async Task<Result<AdminReviewDto>> AdminUpdateReviewStatusAsync(
        Guid reviewId,
        AdminReviewStatusUpdateDto dto,
        CancellationToken ct = default)
    {
        var review = await _db.ProductReviews
            .Include(r => r.Product)
            .Include(r => r.User)
            .Include(r => r.Order)
            .FirstOrDefaultAsync(r => r.Id == reviewId && !r.IsDeleted, ct);

        if (review == null)
        {
            return Result<AdminReviewDto>.Failure("Không tìm thấy đánh giá cần cập nhật.");
        }

        review.Status = dto.Status;

        if (dto.AdminReply != null)
        {
            review.AdminReply = string.IsNullOrWhiteSpace(dto.AdminReply) ? null : dto.AdminReply.Trim();
            review.AdminRepliedAt = string.IsNullOrWhiteSpace(dto.AdminReply) ? null : DateTime.UtcNow;
        }

        review.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var adminDto = new AdminReviewDto(
            review.Id,
            review.ProductId,
            review.Product.Name,
            review.Product.Slug,
            review.Product.ThumbnailUrl,
            review.UserId,
            !string.IsNullOrWhiteSpace(review.User.FullName) ? review.User.FullName : review.User.Email,
            review.User.Email,
            review.OrderId,
            review.Order != null ? review.Order.OrderNumber : null,
            review.Rating,
            review.Title,
            review.Comment,
            ParseImages(review.ImagesJson),
            review.IsVerifiedPurchase,
            review.Status,
            review.AdminReply,
            review.AdminRepliedAt,
            review.HelpfulCount,
            review.CreatedAt
        );

        return Result<AdminReviewDto>.Success(adminDto, "Cập nhật trạng thái đánh giá thành công.");
    }

    public async Task<Result<bool>> AdminDeleteReviewAsync(
        Guid reviewId,
        CancellationToken ct = default)
    {
        var review = await _db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && !r.IsDeleted, ct);

        if (review == null)
        {
            return Result<bool>.Failure("Không tìm thấy đánh giá cần xóa.");
        }

        review.IsDeleted = true;
        review.DeletedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Result<bool>.Success(true, "Đã xóa đánh giá thành công.");
    }

    public async Task<Result<int>> VoteHelpfulAsync(
        Guid reviewId,
        CancellationToken ct = default)
    {
        var review = await _db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && !r.IsDeleted, ct);

        if (review == null)
        {
            return Result<int>.Failure("Không tìm thấy đánh giá.");
        }

        review.HelpfulCount += 1;
        await _db.SaveChangesAsync(ct);

        return Result<int>.Success(review.HelpfulCount);
    }

    private static IReadOnlyList<string> ParseImages(string? imagesJson)
    {
        if (string.IsNullOrWhiteSpace(imagesJson) || imagesJson == "[]")
        {
            return Array.Empty<string>();
        }

        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(imagesJson);
            return list ?? (IReadOnlyList<string>)Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "Khách hàng";
        var atIndex = email.IndexOf('@');
        if (atIndex <= 2) return email;
        return email[..2] + "***" + email[atIndex..];
    }
}
