using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MadK.Application.Common;
using MadK.Application.DTOs.Admin;
using MadK.Application.DTOs.Audit;
using MadK.Application.DTOs.Inventory;
using MadK.Application.DTOs.Order;
using MadK.Domain.Constants;
using MadK.Domain.Entities;
using MadK.Domain.Enums;
using MadK.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace MadK.Infrastructure.Tests;

public class AuthMatrixTestFixture : WebApplicationFactory<Program>
{
    public string DbName { get; } = "AuthMatrixDb_" + Guid.NewGuid();
    private bool _initialized;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public string AdminToken { get; private set; } = string.Empty;
    public string SalesToken { get; private set; } = string.Empty;
    public string WarehouseToken { get; private set; } = string.Empty;
    public string CustomerToken { get; private set; } = string.Empty;
    public Guid CustomerId { get; private set; }
    public Guid AdminId { get; private set; }
    public Guid VariantId { get; private set; }
    public string OrderNumber { get; } = "ORD-TEST-001";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType == typeof(Application.Interfaces.IAppDbContext)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(DbName);
            });
            services.AddScoped<Application.Interfaces.IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        });
    }

    public async Task EnsureInitializedAsync()
    {
        if (_initialized) return;
        await _lock.WaitAsync();
        try
        {
            if (_initialized) return;

            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var jwt = scope.ServiceProvider.GetRequiredService<Application.Interfaces.IJwtTokenGenerator>();

            await context.Database.EnsureCreatedAsync();
            await DatabaseSeeder.SeedAsync(context);

            var users = await context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .ToListAsync();

            var admin = users.First(u => u.Email == "admin@madkstore.vn");
            var sales = users.First(u => u.Email == "sales@madkstore.vn");
            var warehouse = users.First(u => u.Email == "warehouse@madkstore.vn");
            var customer = users.First(u => u.Email == "customer@madkstore.vn");

            AdminId = admin.Id;
            CustomerId = customer.Id;

            AdminToken = jwt.GenerateAccessToken(
                admin,
                admin.UserRoles.Select(ur => ur.Role.Name),
                Permissions.All);

            SalesToken = jwt.GenerateAccessToken(
                sales,
                sales.UserRoles.Select(ur => ur.Role.Name),
                sales.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.Code).Distinct());

            WarehouseToken = jwt.GenerateAccessToken(
                warehouse,
                warehouse.UserRoles.Select(ur => ur.Role.Name),
                warehouse.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.Code).Distinct());

            CustomerToken = jwt.GenerateAccessToken(
                customer,
                customer.UserRoles.Select(ur => ur.Role.Name),
                customer.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.Code).Distinct());

            // Create test variant
            var variant = await context.ProductVariants.FirstOrDefaultAsync();
            if (variant == null)
            {
                var brand = new Brand { Id = Guid.NewGuid(), Name = "Apple", Slug = "apple-" + Guid.NewGuid() };
                var cat = new Category { Id = Guid.NewGuid(), Name = "Phone", Slug = "phone-" + Guid.NewGuid() };
                var prod = new Product { Id = Guid.NewGuid(), Name = "iPhone 15", Slug = "iphone-15-" + Guid.NewGuid(), Brand = brand, Category = cat };
                variant = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = prod.Id,
                    Product = prod,
                    Sku = "IP15-128",
                    Name = "iPhone 15 128GB",
                    SalePrice = 22000000m,
                    OriginalPrice = 25000000m
                };
                context.Brands.Add(brand);
                context.Categories.Add(cat);
                context.Products.Add(prod);
                context.ProductVariants.Add(variant);
                context.Inventories.Add(new Inventory
                {
                    Id = Guid.NewGuid(),
                    VariantId = variant.Id,
                    OnHandQuantity = 10,
                    ReservedQuantity = 0
                });
                await context.SaveChangesAsync();
            }
            VariantId = variant.Id;

            if (!await context.Orders.AnyAsync(o => o.OrderNumber == OrderNumber))
            {
                context.Orders.Add(new Order
                {
                    Id = Guid.NewGuid(),
                    OrderNumber = OrderNumber,
                    UserId = customer.Id,
                    CustomerEmail = customer.Email,
                    CustomerPhone = "0987654321",
                    ShippingAddressSnapshot = "123 Đường Test, Quận 1, TP.HCM",
                    Status = OrderStatus.Pending,
                    PaymentMethod = PaymentMethod.COD,
                    PaymentStatus = PaymentStatus.Pending,
                    SubtotalAmount = 22000000m,
                    TotalAmount = 22000000m,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            _initialized = true;
        }
        finally
        {
            _lock.Release();
        }
    }
}

public class AuthorizationMatrixTests : IClassFixture<AuthMatrixTestFixture>, IAsyncLifetime
{
    private readonly AuthMatrixTestFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuthorizationMatrixTests(AuthMatrixTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        await _fixture.EnsureInitializedAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient CreateRoleClient(string role)
    {
        var client = _fixture.CreateClient();
        var token = role switch
        {
            "Admin" => _fixture.AdminToken,
            "Sales" => _fixture.SalesToken,
            "Warehouse" => _fixture.WarehouseToken,
            "Customer" => _fixture.CustomerToken,
            _ => null
        };

        if (!string.IsNullOrEmpty(token))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    #region Matrix Test 1: UserView (GET /api/v1/admin/users)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_UserView_GetUsers(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/users");
        response.StatusCode.Should().Be(expectedStatus);
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_UserView_GetRolesAndPermissions(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/users/roles-permissions");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 2: UserManage (PUT /api/v1/admin/users/{id}/roles)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_UserManage_UpdateRoles(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var payload = new UpdateUserRolesRequestDto(new List<string> { Roles.Customer });
        var response = await client.PutAsJsonAsync($"/api/v1/admin/users/{_fixture.CustomerId}/roles", payload);
        response.StatusCode.Should().Be(expectedStatus);
    }

    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_UserManage_UpdateStatus(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var payload = new UpdateUserStatusRequestDto(IsActive: true, Reason: "Kiểm tra quyền");
        var response = await client.PutAsJsonAsync($"/api/v1/admin/users/{_fixture.CustomerId}/status", payload);
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 3: AuditView (GET /api/v1/admin/audit-logs)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_AuditView_GetAuditLogs(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/audit-logs");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 4: OrderView (GET /api/v1/admin/orders)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_OrderView_GetAllOrders(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/orders");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 5: OrderManage (PUT /api/v1/admin/orders/{orderNumber}/status)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_OrderManage_UpdateOrderStatus(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var payload = new UpdateOrderStatusRequestDto(OrderStatus.Confirmed, "Duyệt đơn");
        var response = await client.PutAsJsonAsync($"/api/v1/admin/orders/{_fixture.OrderNumber}/status", payload);

        if (expectedStatus == HttpStatusCode.OK)
        {
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
        }
        else
        {
            response.StatusCode.Should().Be(expectedStatus);
        }
    }
    #endregion

    #region Matrix Test 6: InventoryView (GET /api/v1/admin/inventory)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_InventoryView_GetInventory(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/inventory");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 7: InventoryManage (POST /api/v1/admin/inventory/restock)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_InventoryManage_Restock(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var payload = new RestockRequestDto(_fixture.VariantId, 5, "Nhập thêm hàng từ nhà cung cấp");
        var response = await client.PostAsJsonAsync("/api/v1/admin/inventory/restock", payload);
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 8: ReportRevenue (GET /api/v1/admin/reports/revenue)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_ReportRevenue_GetRevenue(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/reports/revenue");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 9: ReportInventory (GET /api/v1/admin/reports/inventory)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.OK)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_ReportInventory_GetInventory(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/reports/inventory");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 10: ReportAll (GET /api/v1/admin/reports/summary)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_ReportAll_GetSummary(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/reports/summary");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 11: CatalogManage (PUT /api/v1/admin/catalog/variants/{id}/price)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.Forbidden)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_CatalogManage_UpdatePrice(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var payload = new { SalePrice = 21500000m, OriginalPrice = (decimal?)24000000m };
        var response = await client.PutAsJsonAsync($"/api/v1/admin/catalog/variants/{_fixture.VariantId}/price", payload);
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region Matrix Test 12: DiscountManage (GET /api/v1/admin/discounts)
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Sales", HttpStatusCode.OK)]
    [InlineData("Warehouse", HttpStatusCode.Forbidden)]
    [InlineData("Customer", HttpStatusCode.Forbidden)]
    [InlineData("Anonymous", HttpStatusCode.Unauthorized)]
    public async Task Matrix_DiscountManage_GetDiscounts(string role, HttpStatusCode expectedStatus)
    {
        using var client = CreateRoleClient(role);
        var response = await client.GetAsync("/api/v1/admin/discounts");
        response.StatusCode.Should().Be(expectedStatus);
    }
    #endregion

    #region AuditLog Feature Verification
    [Fact]
    public async Task AuditLog_ShouldRecord_WhenAdminUpdatesUserRoles()
    {
        using var client = CreateRoleClient("Admin");

        // Gán role Sales cho khách hàng test
        var payload = new UpdateUserRolesRequestDto(new List<string> { Roles.Sales });
        var updateRes = await client.PutAsJsonAsync($"/api/v1/admin/users/{_fixture.CustomerId}/roles", payload);
        updateRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // Lấy audit logs
        var auditRes = await client.GetAsync("/api/v1/admin/audit-logs?entityName=User&action=USER_ROLE_ASSIGNED");
        auditRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await auditRes.Content.ReadFromJsonAsync<Result<PagedResult<AuditLogDto>>>(_jsonOptions);
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data!.Items.Should().NotBeEmpty();

        var log = content.Data.Items.First(l => l.EntityId == _fixture.CustomerId.ToString());
        log.Action.Should().Be("USER_ROLE_ASSIGNED");
        log.EntityName.Should().Be("User");
        log.UserEmail.Should().Be("admin@madkstore.vn");
        log.UserRole.Should().Be("Admin");
        log.NewValues.Should().Contain("Sales");
    }

    [Fact]
    public async Task Admin_CannotRemoveOwnAdminRole_SelfLockoutProtection()
    {
        using var client = CreateRoleClient("Admin");

        // Thử bỏ role Admin của chính mình
        var payload = new UpdateUserRolesRequestDto(new List<string> { Roles.Customer });
        var updateRes = await client.PutAsJsonAsync($"/api/v1/admin/users/{_fixture.AdminId}/roles", payload);
        updateRes.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var errContent = await updateRes.Content.ReadFromJsonAsync<Result<AdminUserDetailDto>>(_jsonOptions);
        errContent.Should().NotBeNull();
        errContent!.IsSuccess.Should().BeFalse();
        errContent.Error.Should().Contain("Không thể tự gỡ vai trò Quản trị viên (Admin)");
    }
    #endregion
}
