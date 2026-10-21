namespace MadK.Domain.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Sales = "Sales";
    public const string Warehouse = "Warehouse";
    public const string Customer = "Customer";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Admin,
        Sales,
        Warehouse,
        Customer
    };
}
