namespace MadK.Domain.Constants;

public static class Permissions
{
    // Catalog & Pricing
    public const string CatalogView = "catalog.view";
    public const string CatalogManage = "catalog.manage";
    public const string PricingManage = "pricing.manage";

    // Order
    public const string OrderView = "order.view";
    public const string OrderManage = "order.manage";
    public const string OrderRefund = "order.refund";

    // Discount
    public const string DiscountManage = "discount.manage";

    // Inventory
    public const string InventoryView = "inventory.view";
    public const string InventoryManage = "inventory.manage";

    // User & Identity
    public const string UserView = "user.view";
    public const string UserManage = "user.manage";

    // Audit Log
    public const string AuditView = "audit.view";

    // Reports
    public const string ReportRevenue = "report.revenue";
    public const string ReportInventory = "report.inventory";
    public const string ReportAll = "report.all";

    public static readonly IReadOnlyList<string> All = new[]
    {
        CatalogView,
        CatalogManage,
        PricingManage,
        OrderView,
        OrderManage,
        OrderRefund,
        DiscountManage,
        InventoryView,
        InventoryManage,
        UserView,
        UserManage,
        AuditView,
        ReportRevenue,
        ReportInventory,
        ReportAll
    };
}
