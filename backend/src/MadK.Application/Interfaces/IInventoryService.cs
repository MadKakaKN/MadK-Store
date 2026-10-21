using MadK.Application.Common;
using MadK.Application.DTOs.Inventory;

namespace MadK.Application.Interfaces;

public interface IInventoryService
{
    /// <summary>
    /// Lấy trạng thái tồn kho hiện tại của một biến thể sản phẩm.
    /// </summary>
    Task<Result<InventoryDto>> GetStockAsync(Guid variantId, CancellationToken ct = default);

    /// <summary>
    /// Nhập thêm hàng thực tế vào kho (tăng OnHandQuantity).
    /// Thao tác nguyên tử, tự động khởi tạo Inventory nếu chưa có.
    /// </summary>
    Task<Result<InventoryDto>> RestockAsync(Guid variantId, int quantity, string? reason = null, CancellationToken ct = default);

    Task<Result<InventoryDto>> RestockAsync(
        Guid variantId,
        int quantity,
        string? reason,
        string? referenceType,
        string? referenceId,
        CancellationToken ct = default);

    /// <summary>
    /// Điều chỉnh tồn kho có lý do (tăng hoặc giảm OnHandQuantity).
    /// QUY TẮC BẢO TOÀN TỒN KHẢ DỤNG: Nếu quantityChange < 0 thì không được phép vượt quá tồn khả dụng (OnHand - Reserved).
    /// </summary>
    Task<Result<InventoryDto>> AdjustStockAsync(
        Guid variantId,
        int quantityChange,
        string reason,
        string? referenceType = null,
        string? referenceId = null,
        CancellationToken ct = default);

    /// <summary>
    /// Đặt trước / giữ hàng tạm thời cho phiên thanh toán / đơn hàng (tăng ReservedQuantity).
    /// THAO TÁC NGUYÊN TỬ: Không bao giờ kiểm tra rồi mới trừ; sử dụng điều kiện nguyên tử trên DB.
    /// Đảm bảo không bao giờ để tồn khả dụng (OnHand - Reserved) bị âm dưới bất kỳ tình huống đồng thời nào.
    /// </summary>
    Task<Result<InventoryDto>> ReserveAsync(
        Guid variantId,
        int quantity,
        string referenceType,
        string referenceId,
        string? reason = null,
        CancellationToken ct = default);

    /// <summary>
    /// Giải phóng hàng đang giữ khi đơn bị hủy hoặc phiên giữ hàng hết hạn (giảm ReservedQuantity).
    /// Đảm bảo Idempotency: Giải phóng lặp lại không làm sai số liệu.
    /// </summary>
    Task<Result<InventoryDto>> ReleaseAsync(
        Guid variantId,
        int quantity,
        string referenceType,
        string referenceId,
        string? reason = null,
        CancellationToken ct = default);

    /// <summary>
    /// Xuất kho / trừ thật: Giảm cả OnHandQuantity và ReservedQuantity khi thanh toán hoàn tất.
    /// Đảm bảo Idempotency: Commit lặp lại không làm trừ đúp hoặc sai số liệu.
    /// </summary>
    Task<Result<InventoryDto>> CommitAsync(
        Guid variantId,
        int quantity,
        string referenceType,
        string referenceId,
        string? reason = null,
        CancellationToken ct = default);

    /// <summary>
    /// Lấy lịch sử sổ cái các biến động tồn kho (Stock Movements) của một biến thể cụ thể.
    /// </summary>
    Task<Result<IReadOnlyList<StockMovementDto>>> GetMovementsAsync(Guid variantId, int limit = 50, CancellationToken ct = default);

    /// <summary>
    /// Lấy và lọc sổ cái biến động kho toàn hệ thống hoặc theo điều kiện.
    /// </summary>
    Task<Result<IReadOnlyList<StockMovementDto>>> GetMovementsFilteredAsync(StockMovementQueryFilter filter, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách cảnh báo tồn kho thấp hoặc hết hàng.
    /// </summary>
    Task<Result<IReadOnlyList<LowStockAlertDto>>> GetLowStockAlertsAsync(int threshold = 10, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách tồn kho chi tiết tất cả biến thể sản phẩm cho quản trị kho.
    /// </summary>
    Task<Result<IReadOnlyList<VariantInventoryItemDto>>> GetVariantInventoriesAsync(string? search = null, CancellationToken ct = default);
}
