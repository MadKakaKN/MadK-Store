using MadK.Application.Interfaces;
using MadK.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace MadK.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IAddressService, AddressService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IInventoryService, InventoryService>();
        return services;
    }
}
