using System.Text.Json;
using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Data;

/// <summary>
/// Idempotent database seeder for development environment.
/// Seeds diverse categories, brands, spec templates, products, variants, and images.
/// </summary>
public static class DatabaseSeeder
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public static async Task SeedAsync(AppDbContext context, ILogger? logger = null)
    {
        logger?.LogInformation("Starting database seeding...");

        // 1. Seed Categories & Spec Templates
        var categoryMap = await SeedCategoriesAndTemplatesAsync(context, logger);

        // 2. Seed Brands
        var brandMap = await SeedBrandsAsync(context, logger);

        // 3. Seed Products, Variants & Images
        await SeedProductsAsync(context, categoryMap, brandMap, logger);

        // 4. Seed Roles & Permissions
        var roleMap = await SeedRolesAndPermissionsAsync(context, logger);

        // 5. Seed Default Users
        await SeedUsersAsync(context, roleMap, logger);

        // 6. Seed Vietnam Administrative Divisions & Sample Addresses
        await AddressSeeder.SeedAsync(context, logger);

        logger?.LogInformation("Database seeding completed successfully.");
    }

    private static async Task<Dictionary<string, Category>> SeedCategoriesAndTemplatesAsync(AppDbContext context, ILogger? logger)
    {
        var existingCategories = await context.Categories.ToDictionaryAsync(c => c.Slug);

        // Root Categories
        var rootCategoryDefs = new[]
        {
            new { Slug = "dien-thoai", Name = "Điện thoại & Tablet", Description = "Điện thoại thông minh, máy tính bảng và phụ kiện di động", IconUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80", Order = 1 },
            new { Slug = "laptop", Name = "Laptop & Máy tính xách tay", Description = "Laptop gaming, văn phòng, đồ họa chính hãng", IconUrl = "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&q=80", Order = 2 },
            new { Slug = "phu-kien", Name = "Phụ kiện & Gaming Gear", Description = "Bàn phím cơ, chuột gaming, tai nghe và phụ kiện công nghệ", IconUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&q=80", Order = 3 },
            new { Slug = "linh-kien", Name = "Linh kiện PC", Description = "CPU, VGA, RAM, SSD và linh kiện máy tính chất lượng cao", IconUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100&q=80", Order = 4 }
        };

        foreach (var def in rootCategoryDefs)
        {
            if (!existingCategories.ContainsKey(def.Slug))
            {
                var cat = new Category
                {
                    Id = Guid.NewGuid(),
                    Name = def.Name,
                    Slug = def.Slug,
                    Description = def.Description,
                    IconUrl = def.IconUrl,
                    DisplayOrder = def.Order,
                    IsActive = true
                };
                context.Categories.Add(cat);
                existingCategories[def.Slug] = cat;
            }
        }
        await context.SaveChangesAsync();

        // Subcategories & Schema Definitions
        var subcategoryDefs = new[]
        {
            // Điện thoại
            new
            {
                ParentSlug = "dien-thoai",
                Slug = "dien-thoai-thong-minh",
                Name = "Điện thoại thông minh",
                Description = "Smartphone cao cấp, tầm trung từ Apple, Samsung",
                IconUrl = "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&q=80",
                Order = 1,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        os = new { title = "Hệ điều hành", @enum = new[] { "iOS", "Android" } },
                        screen_size = new { title = "Kích thước màn hình", @enum = new[] { "6.1 inch", "6.7 inch", "6.8 inch" } },
                        refresh_rate = new { title = "Tần số quét", @enum = new[] { "60Hz", "120Hz" } },
                        ram = new { title = "RAM", @enum = new[] { "8GB", "12GB", "16GB" } },
                        storage = new { title = "Bộ nhớ trong", @enum = new[] { "128GB", "256GB", "512GB", "1TB" } },
                        network = new { title = "Mạng hỗ trợ", @enum = new[] { "5G", "4G" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "dien-thoai",
                Slug = "may-tinh-bang",
                Name = "Máy tính bảng",
                Description = "iPad, Galaxy Tab phục vụ học tập và sáng tạo",
                IconUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80",
                Order = 2,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        os = new { title = "Hệ điều hành", @enum = new[] { "iPadOS", "Android" } },
                        screen_size = new { title = "Kích thước màn hình", @enum = new[] { "8.3 inch", "10.9 inch", "11 inch", "12.9 inch" } },
                        chip = new { title = "Vi xử lý", @enum = new[] { "Apple M2", "Apple M4", "Snapdragon 8 Gen 2" } },
                        storage = new { title = "Bộ nhớ", @enum = new[] { "128GB", "256GB", "512GB" } }
                    }
                }, JsonOpts)
            },

            // Laptop
            new
            {
                ParentSlug = "laptop",
                Slug = "laptop-gaming",
                Name = "Laptop Gaming",
                Description = "Máy tính xách tay cấu hình cao chuyên chơi game",
                IconUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&q=80",
                Order = 1,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        cpu = new { title = "CPU", @enum = new[] { "Intel Core i7", "Intel Core i9", "AMD Ryzen 7", "AMD Ryzen 9" } },
                        gpu = new { title = "GPU", @enum = new[] { "RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090" } },
                        ram = new { title = "RAM", @enum = new[] { "16GB", "32GB", "64GB" } },
                        storage = new { title = "Ổ cứng", @enum = new[] { "512GB SSD", "1TB SSD", "2TB SSD" } },
                        screen = new { title = "Màn hình", @enum = new[] { "15.6 inch 144Hz", "16 inch 165Hz", "16 inch 240Hz", "18 inch 240Hz" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "laptop",
                Slug = "laptop-van-phong",
                Name = "Laptop Văn phòng & Doanh nhân",
                Description = "Thiết kế mỏng nhẹ, pin lâu, màn hình chuẩn màu sắc",
                IconUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&q=80",
                Order = 2,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        cpu = new { title = "CPU", @enum = new[] { "Intel Core i5", "Intel Core i7", "Apple M3", "Apple M3 Pro", "AMD Ryzen 7" } },
                        ram = new { title = "RAM", @enum = new[] { "8GB", "16GB", "24GB", "32GB" } },
                        storage = new { title = "Ổ cứng", @enum = new[] { "256GB SSD", "512GB SSD", "1TB SSD" } },
                        weight = new { title = "Trọng lượng", @enum = new[] { "Dưới 1.2kg", "1.2kg - 1.5kg", "Trên 1.5kg" } }
                    }
                }, JsonOpts)
            },

            // Phụ kiện & Gaming Gear
            new
            {
                ParentSlug = "phu-kien",
                Slug = "ban-phim-co",
                Name = "Bàn phím cơ",
                Description = "Bàn phím cơ Custom và Prebuilt cho gamer và lập trình viên",
                IconUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&q=80",
                Order = 1,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        @switch = new { title = "Loại Switch", @enum = new[] { "Linear", "Tactile", "Clicky" } },
                        layout = new { title = "Layout", @enum = new[] { "Fullsize", "TKL", "75%", "65%", "60%" } },
                        connectivity = new { title = "Kết nối", @enum = new[] { "Có dây", "Không dây (Bluetooth/2.4G)" } },
                        hotswap = new { title = "Hotswap", @enum = new[] { "Có", "Không" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "phu-kien",
                Slug = "chuot-gaming",
                Name = "Chuột Gaming",
                Description = "Chuột siêu nhẹ, mắt đọc chuẩn xác cao",
                IconUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&q=80",
                Order = 2,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        sensor = new { title = "Cảm biến", @enum = new[] { "Optical HERO", "Focus Pro", "PixArt 3395" } },
                        weight = new { title = "Trọng lượng", @enum = new[] { "Siêu nhẹ (<63g)", "Tiêu chuẩn (64-85g)", "Nặng (>85g)" } },
                        connectivity = new { title = "Kết nối", @enum = new[] { "Có dây", "Không dây 2.4GHz" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "phu-kien",
                Slug = "tai-nghe",
                Name = "Tai nghe & Audio",
                Description = "Tai nghe không dây chống ồn chủ động và tai nghe gaming",
                IconUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80",
                Order = 3,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        type = new { title = "Kiểu tai nghe", @enum = new[] { "Over-ear", "In-ear (TWS)" } },
                        anc = new { title = "Chống ồn chủ động (ANC)", @enum = new[] { "Có", "Không" } },
                        battery = new { title = "Thời lượng pin", @enum = new[] { "Dưới 10 giờ", "20 - 30 giờ", "Trên 30 giờ" } },
                        connectivity = new { title = "Kết nối", @enum = new[] { "Bluetooth 5.3", "Wireless 2.4GHz", "Jack 3.5mm/Type-C" } }
                    }
                }, JsonOpts)
            },

            // Linh kiện PC
            new
            {
                ParentSlug = "linh-kien",
                Slug = "cpu-vi-xu-ly",
                Name = "CPU - Vi xử lý",
                Description = "Bộ vi xử lý Intel Core thế hệ mới và AMD Ryzen",
                IconUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100&q=80",
                Order = 1,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        socket = new { title = "Socket", @enum = new[] { "LGA1700", "AM5" } },
                        cores_threads = new { title = "Số nhân / luồng", @enum = new[] { "6 nhân 12 luồng", "8 nhân 16 luồng", "14 nhân 20 luồng", "24 nhân 32 luồng" } },
                        boost_clock = new { title = "Xung nhịp Turbo", @enum = new[] { "Lên đến 5.0 GHz", "Lên đến 5.4 GHz", "Lên đến 6.0 GHz" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "linh-kien",
                Slug = "vga-card-man-hinh",
                Name = "VGA - Card màn hình",
                Description = "Card đồ họa NVIDIA GeForce RTX và AMD Radeon",
                IconUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100&q=80",
                Order = 2,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        vram = new { title = "VRAM", @enum = new[] { "8GB GDDR6", "12GB GDDR6X", "16GB GDDR6X", "24GB GDDR6X" } },
                        bus_width = new { title = "Bus bộ nhớ", @enum = new[] { "128-bit", "192-bit", "256-bit", "384-bit" } },
                        power_consumption = new { title = "Công suất nguồn khuyến nghị", @enum = new[] { "550W", "650W", "750W", "850W", "1000W" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "linh-kien",
                Slug = "ram-bo-nho-trong",
                Name = "RAM - Bộ nhớ trong",
                Description = "Bộ nhớ RAM DDR4 và DDR5 hiệu năng cao",
                IconUrl = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=100&q=80",
                Order = 3,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        type = new { title = "Loại RAM", @enum = new[] { "DDR4", "DDR5" } },
                        bus_speed = new { title = "Tốc độ Bus", @enum = new[] { "3200MHz", "5600MHz", "6000MHz", "6400MHz" } },
                        capacity = new { title = "Dung lượng kit", @enum = new[] { "16GB (2x8GB)", "32GB (2x16GB)", "64GB (2x32GB)" } }
                    }
                }, JsonOpts)
            },
            new
            {
                ParentSlug = "linh-kien",
                Slug = "o-cung-ssd",
                Name = "Ổ cứng SSD",
                Description = "Ổ cứng thể rắn M.2 NVMe PCIe 4.0 và 5.0 tốc độ cao",
                IconUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=100&q=80",
                Order = 4,
                Schema = JsonSerializer.Serialize(new
                {
                    properties = new
                    {
                        form_factor = new { title = "Kích thước & Cổng", @enum = new[] { "M.2 NVMe PCIe 4.0", "M.2 NVMe PCIe 5.0", "2.5 inch SATA III" } },
                        capacity = new { title = "Dung lượng", @enum = new[] { "500GB", "1TB", "2TB", "4TB" } },
                        read_speed = new { title = "Tốc độ đọc", @enum = new[] { "Lên đến 3500 MB/s", "Lên đến 7450 MB/s", "Lên đến 12400 MB/s" } }
                    }
                }, JsonOpts)
            }
        };

        foreach (var def in subcategoryDefs)
        {
            var parent = existingCategories[def.ParentSlug];
            Category cat;
            if (!existingCategories.TryGetValue(def.Slug, out cat!))
            {
                cat = new Category
                {
                    Id = Guid.NewGuid(),
                    ParentId = parent.Id,
                    Name = def.Name,
                    Slug = def.Slug,
                    Description = def.Description,
                    IconUrl = def.IconUrl,
                    DisplayOrder = def.Order,
                    IsActive = true
                };
                context.Categories.Add(cat);
                existingCategories[def.Slug] = cat;
            }

            // CategorySpecTemplate
            var hasTemplate = await context.CategorySpecTemplates.AnyAsync(t => t.CategoryId == cat.Id);
            if (!hasTemplate)
            {
                var template = new CategorySpecTemplate
                {
                    Id = Guid.NewGuid(),
                    CategoryId = cat.Id,
                    SchemaDefinition = def.Schema
                };
                context.CategorySpecTemplates.Add(template);
            }
        }

        await context.SaveChangesAsync();
        return existingCategories;
    }

    private static async Task<Dictionary<string, Brand>> SeedBrandsAsync(AppDbContext context, ILogger? logger)
    {
        var existingBrands = await context.Brands.ToDictionaryAsync(b => b.Slug);

        var brandDefs = new[]
        {
            new { Slug = "apple", Name = "Apple", Logo = "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100&q=80", Desc = "Tập đoàn công nghệ hàng đầu thế giới với iPhone, iPad, Mac" },
            new { Slug = "samsung", Name = "Samsung", Logo = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100&q=80", Desc = "Tập đoàn điện tử hàng đầu Hàn Quốc với Galaxy, màn hình, SSD" },
            new { Slug = "asus", Name = "ASUS", Logo = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&q=80", Desc = "Thương hiệu linh kiện PC và laptop gaming ROG số 1" },
            new { Slug = "dell", Name = "Dell", Logo = "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=100&q=80", Desc = "Máy tính xách tay XPS và Alienware hiệu năng bền bỉ" },
            new { Slug = "lenovo", Name = "Lenovo", Logo = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&q=80", Desc = "Laptop ThinkPad và Legion đẳng cấp thế giới" },
            new { Slug = "acer", Name = "Acer", Logo = "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&q=80", Desc = "Thương hiệu Predator và Nitro Gaming nổi tiếng" },
            new { Slug = "logitech", Name = "Logitech", Logo = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&q=80", Desc = "Thiết bị ngoại vi và gaming gear Logitech G đỉnh cao" },
            new { Slug = "razer", Name = "Razer", Logo = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80", Desc = "Thương hiệu phong cách sống dành cho game thủ" },
            new { Slug = "keychron", Name = "Keychron", Logo = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&q=80", Desc = "Chuyên bàn phím cơ không dây cho Mac và Windows" },
            new { Slug = "sony", Name = "Sony", Logo = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80", Desc = "Tập đoàn giải trí và âm thanh tai nghe chống ồn cao cấp" },
            new { Slug = "intel", Name = "Intel", Logo = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100&q=80", Desc = "Hãng sản xuất chip vi xử lý máy tính hàng đầu" },
            new { Slug = "amd", Name = "AMD", Logo = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100&q=80", Desc = "Vi xử lý Ryzen và card đồ họa Radeon tân tiến" },
            new { Slug = "nvidia", Name = "NVIDIA", Logo = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100&q=80", Desc = "Tập đoàn công nghệ chip đồ họa GPU và AI số một thế giới" },
            new { Slug = "corsair", Name = "Corsair", Logo = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=100&q=80", Desc = "Linh kiện PC, RAM, nguồn và phụ kiện chơi game cao cấp" },
            new { Slug = "kingston", Name = "Kingston", Logo = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=100&q=80", Desc = "Thương hiệu bộ nhớ RAM và ổ cứng SSD uy tín toàn cầu" }
        };

        foreach (var def in brandDefs)
        {
            if (!existingBrands.ContainsKey(def.Slug))
            {
                var brand = new Brand
                {
                    Id = Guid.NewGuid(),
                    Name = def.Name,
                    Slug = def.Slug,
                    LogoUrl = def.Logo,
                    Description = def.Desc,
                    IsActive = true
                };
                context.Brands.Add(brand);
                existingBrands[def.Slug] = brand;
            }
        }

        await context.SaveChangesAsync();
        return existingBrands;
    }

    private class ProductSeedModel
    {
        public string CatSlug { get; set; } = string.Empty;
        public string BrandSlug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDesc { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? Model3DUrl { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public Dictionary<string, string> Specs { get; set; } = new();
        public List<(string Sku, string Name, decimal Price, decimal OrigPrice, Dictionary<string, string> Attr)> Variants { get; set; } = new();
    }

    private static async Task SeedProductsAsync(
        AppDbContext context,
        Dictionary<string, Category> catMap,
        Dictionary<string, Brand> brandMap,
        ILogger? logger)
    {
        var existingProductSlugs = (await context.Products.Select(p => p.Slug).ToListAsync()).ToHashSet();
        var productSeeds = GetProductSeedModels();

        int insertedCount = 0;
        foreach (var pDef in productSeeds)
        {
            if (existingProductSlugs.Contains(pDef.Slug))
            {
                continue;
            }

            if (!catMap.TryGetValue(pDef.CatSlug, out var category) ||
                !brandMap.TryGetValue(pDef.BrandSlug, out var brand))
            {
                continue;
            }

            var product = new Product
            {
                Id = Guid.NewGuid(),
                CategoryId = category.Id,
                BrandId = brand.Id,
                Name = pDef.Name,
                Slug = pDef.Slug,
                ShortDescription = pDef.ShortDesc,
                Description = pDef.Desc,
                Specifications = JsonSerializer.Serialize(pDef.Specs, JsonOpts),
                BasePrice = pDef.BasePrice,
                IsFeatured = pDef.IsFeatured,
                Model3DUrl = pDef.Model3DUrl,
                ThumbnailUrl = pDef.ImageUrl,
                IsActive = true
            };

            // Main Product Image
            product.Images.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                ImageUrl = pDef.ImageUrl,
                AltText = $"{pDef.Name} ảnh chính",
                DisplayOrder = 1,
                IsPrimary = true
            });

            // Secondary image
            product.Images.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                ImageUrl = pDef.ImageUrl,
                AltText = $"{pDef.Name} góc cạnh",
                DisplayOrder = 2,
                IsPrimary = false
            });

            // Variants
            foreach (var v in pDef.Variants)
            {
                var variant = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Sku = v.Sku,
                    Name = v.Name,
                    SalePrice = v.Price,
                    OriginalPrice = v.OrigPrice,
                    CostPrice = Math.Round(v.Price * 0.75m),
                    Attributes = JsonSerializer.Serialize(v.Attr, JsonOpts),
                    IsActive = true
                };

                // Variant image
                variant.Images.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    VariantId = variant.Id,
                    ImageUrl = pDef.ImageUrl,
                    AltText = $"{v.Name} chi tiết",
                    DisplayOrder = 1,
                    IsPrimary = false
                });

                product.Variants.Add(variant);
            }

            context.Products.Add(product);
            existingProductSlugs.Add(pDef.Slug);
            insertedCount++;
        }

        if (insertedCount > 0)
        {
            await context.SaveChangesAsync();
            logger?.LogInformation("Seeded {Count} new products.", insertedCount);
        }
        else
        {
            logger?.LogInformation("All products already exist, skipping insert.");
        }
    }

    private static List<ProductSeedModel> GetProductSeedModels()
    {
        var list = new List<ProductSeedModel>();

        // ═══════════════════════════════════════════════════════════════
        // 1. ĐIỆN THOẠI THÔNG MINH (10 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "apple",
            Name = "iPhone 15 Pro Max",
            Slug = "dien-thoai-iphone-15-pro-max",
            ShortDesc = "Khung titan siêu bền, chip Apple A17 Pro mạnh mẽ, camera tiềm vọng 5x.",
            Desc = "iPhone 15 Pro Max là đỉnh cao công nghệ với khung vỏ titan hàng không vũ trụ siêu nhẹ và bền bỉ. Màn hình Super Retina XDR 6.7 inch với ProMotion 120Hz mượt mà.",
            BasePrice = 34990000m,
            IsFeatured = true,
            Model3DUrl = "https://models.madkstore.vn/iphone-15-pro-max.glb",
            ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
            Specs = new() { { "os", "iOS" }, { "screen_size", "6.7 inch" }, { "refresh_rate", "120Hz" }, { "ram", "8GB" }, { "storage", "256GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("IP15PM-256-NAT", "iPhone 15 Pro Max 256GB Titan Tự Nhiên", 34990000m, 36990000m, new() { { "color", "Titan Tự Nhiên" }, { "storage", "256GB" } }),
                ("IP15PM-512-BLU", "iPhone 15 Pro Max 512GB Titan Xanh", 39990000m, 41990000m, new() { { "color", "Titan Xanh" }, { "storage", "512GB" } }),
                ("IP15PM-1TB-BLK", "iPhone 15 Pro Max 1TB Titan Đen", 45990000m, 47990000m, new() { { "color", "Titan Đen" }, { "storage", "1TB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "apple",
            Name = "iPhone 15 Pro",
            Slug = "dien-thoai-iphone-15-pro",
            ShortDesc = "Thiết kế titan nhỏ gọn 6.1 inch, camera chuyên nghiệp, nút Action tiện lợi.",
            Desc = "iPhone 15 Pro sở hữu toàn bộ sức mạnh của chip A17 Pro trong một thân máy nhỏ gọn vừa vặn tay cầm.",
            BasePrice = 28490000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
            Specs = new() { { "os", "iOS" }, { "screen_size", "6.1 inch" }, { "refresh_rate", "120Hz" }, { "ram", "8GB" }, { "storage", "128GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("IP15P-128-NAT", "iPhone 15 Pro 128GB Titan Tự Nhiên", 28490000m, 29990000m, new() { { "color", "Titan Tự Nhiên" }, { "storage", "128GB" } }),
                ("IP15P-256-WHT", "iPhone 15 Pro 256GB Titan Trắng", 31490000m, 32990000m, new() { { "color", "Titan Trắng" }, { "storage", "256GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "apple",
            Name = "iPhone 15",
            Slug = "dien-thoai-iphone-15",
            ShortDesc = "Mặt lưng kính pha màu rực rỡ, Dynamic Island và camera 48MP.",
            Desc = "iPhone 15 mang Dynamic Island xuống dòng tiêu chuẩn cùng camera chính 48MP nâng cấp vượt bậc.",
            BasePrice = 19990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1695048065036-75f8546b14f8?w=600&q=80",
            Specs = new() { { "os", "iOS" }, { "screen_size", "6.1 inch" }, { "refresh_rate", "60Hz" }, { "ram", "8GB" }, { "storage", "128GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("IP15-128-PNK", "iPhone 15 128GB Hồng", 19990000m, 22990000m, new() { { "color", "Hồng" }, { "storage", "128GB" } }),
                ("IP15-128-BLK", "iPhone 15 128GB Đen", 19990000m, 22990000m, new() { { "color", "Đen" }, { "storage", "128GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "apple",
            Name = "iPhone 14",
            Slug = "dien-thoai-iphone-14",
            ShortDesc = "Hiệu năng bền bỉ với chip A15 Bionic, thời lượng pin cả ngày.",
            Desc = "Lựa chọn thực dụng với chất lượng hoàn thiện tuyệt đối và chế độ chụp ban đêm xuất sắc.",
            BasePrice = 16990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=600&q=80",
            Specs = new() { { "os", "iOS" }, { "screen_size", "6.1 inch" }, { "refresh_rate", "60Hz" }, { "ram", "8GB" }, { "storage", "128GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("IP14-128-BLU", "iPhone 14 128GB Xanh Dương", 16990000m, 18990000m, new() { { "color", "Xanh Dương" }, { "storage", "128GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy S24 Ultra",
            Slug = "dien-thoai-samsung-galaxy-s24-ultra",
            ShortDesc = "Galaxy AI quyền năng, bút S-Pen tích hợp, khung titan và camera 200MP zoom 100x.",
            Desc = "Galaxy S24 Ultra mở ra kỷ nguyên mới với trí tuệ nhân tạo Galaxy AI, màn hình phẳng Dynamic AMOLED 2X 120Hz rực rỡ và kính chống chói Corning Gorilla Armor.",
            BasePrice = 31990000m,
            IsFeatured = true,
            Model3DUrl = "https://models.madkstore.vn/galaxy-s24-ultra.glb",
            ImageUrl = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "6.8 inch" }, { "refresh_rate", "120Hz" }, { "ram", "12GB" }, { "storage", "256GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("S24U-256-GRY", "Galaxy S24 Ultra 256GB Xám Titan", 31990000m, 33990000m, new() { { "color", "Xám Titan" }, { "storage", "256GB" } }),
                ("S24U-512-BLK", "Galaxy S24 Ultra 512GB Đen Titan", 35990000m, 37990000m, new() { { "color", "Đen Titan" }, { "storage", "512GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy S24 Plus",
            Slug = "dien-thoai-samsung-galaxy-s24-plus",
            ShortDesc = "Màn hình 6.7 inch QHD+ sắc nét, dung lượng pin 4900mAh cùng Galaxy AI tiện ích.",
            Desc = "Sự cân bằng hoàn hảo giữa kích thước màn hình lớn, dung lượng pin bền bỉ và hiệu năng đỉnh cao.",
            BasePrice = 24990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "6.7 inch" }, { "refresh_rate", "120Hz" }, { "ram", "12GB" }, { "storage", "256GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("S24P-256-VIO", "Galaxy S24 Plus 256GB Tím Cobalt", 24990000m, 26990000m, new() { { "color", "Tím Cobalt" }, { "storage", "256GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy S24",
            Slug = "dien-thoai-samsung-galaxy-s24",
            ShortDesc = "Kích thước 6.2 inch nhỏ gọn, viền siêu mỏng, chip Exynos 2400 mạnh mẽ.",
            Desc = "Flagship nhỏ gọn đỉnh cao trong thế giới Android với đầy đủ tính năng thông minh Galaxy AI.",
            BasePrice = 18990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "6.1 inch" }, { "refresh_rate", "120Hz" }, { "ram", "8GB" }, { "storage", "256GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("S24-256-YEL", "Galaxy S24 256GB Vàng Amber", 18990000m, 20990000m, new() { { "color", "Vàng Amber" }, { "storage", "256GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy Z Fold5",
            Slug = "dien-thoai-samsung-galaxy-z-fold5",
            ShortDesc = "Bản lề Flex gập không kẽ hở, màn hình mở rộng 7.6 inch đa nhiệm mượt mà.",
            Desc = "Siêu phẩm điện thoại gập mở ra thế giới đa nhiệm chuyên nghiệp với giao diện Taskbar thông minh.",
            BasePrice = 35990000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "6.8 inch" }, { "refresh_rate", "120Hz" }, { "ram", "12GB" }, { "storage", "512GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("ZF5-512-ICY", "Galaxy Z Fold5 512GB Xanh Icy", 35990000m, 40990000m, new() { { "color", "Xanh Icy" }, { "storage", "512GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy Z Flip5",
            Slug = "dien-thoai-samsung-galaxy-z-flip5",
            ShortDesc = "Màn hình ngoài Flex Window 3.4 inch độc đáo, thiết kế gập vỏ sò thời thượng.",
            Desc = "Điện thoại gập thời trang với màn hình phụ kích thước lớn cho phép trả lời tin nhắn và chụp ảnh selfie tức thì.",
            BasePrice = 19990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "6.7 inch" }, { "refresh_rate", "120Hz" }, { "ram", "8GB" }, { "storage", "256GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("ZFP5-256-MNT", "Galaxy Z Flip5 256GB Xanh Mint", 19990000m, 22990000m, new() { { "color", "Xanh Mint" }, { "storage", "256GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "dien-thoai-thong-minh",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy A55 5G",
            Slug = "dien-thoai-samsung-galaxy-a55-5g",
            ShortDesc = "Khung kim loại sang trọng, camera chụp đêm sắc nét và bảo mật Samsung Knox.",
            Desc = "Sản phẩm tầm trung đáng mua nhất phân khúc với độ hoàn thiện cao cấp và chuẩn chống nước IP67.",
            BasePrice = 9690000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "6.7 inch" }, { "refresh_rate", "120Hz" }, { "ram", "8GB" }, { "storage", "128GB" }, { "network", "5G" } },
            Variants = new()
            {
                ("A55-128-BLU", "Galaxy A55 128GB Xanh Iceblue", 9690000m, 10490000m, new() { { "color", "Xanh Iceblue" }, { "storage", "128GB" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 2. MÁY TÍNH BẢNG (5 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "may-tinh-bang",
            BrandSlug = "apple",
            Name = "iPad Pro M4 11 inch",
            Slug = "may-tinh-bang-ipad-pro-m4-11-inch",
            ShortDesc = "Màn hình OLED Ultra Retina XDR đột phá, chip Apple M4 siêu mỏng 5.3mm.",
            Desc = "Mẫu iPad mỏng nhất từ trước đến nay của Apple với sức mạnh đồ họa đỉnh cao từ vi xử lý M4 thế hệ mới.",
            BasePrice = 28990000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
            Specs = new() { { "os", "iPadOS" }, { "screen_size", "11 inch" }, { "chip", "Apple M4" }, { "storage", "256GB" } },
            Variants = new()
            {
                ("IPDM4-11-256-SLV", "iPad Pro M4 11 inch 256GB Bạc", 28990000m, 30990000m, new() { { "color", "Bạc" }, { "storage", "256GB" } }),
                ("IPDM4-11-512-BLK", "iPad Pro M4 11 inch 512GB Đen Không Gian", 33990000m, 35990000m, new() { { "color", "Đen Không Gian" }, { "storage", "512GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "may-tinh-bang",
            BrandSlug = "apple",
            Name = "iPad Pro M4 13 inch",
            Slug = "may-tinh-bang-ipad-pro-m4-13-inch",
            ShortDesc = "Không gian hiển thị rộng rãi 13 inch, màn hình Tandem OLED cực đỉnh.",
            Desc = "Công cụ đồ họa chuyên nghiệp cho các nhà thiết kế và họa sĩ số với khả năng tương thích Apple Pencil Pro.",
            BasePrice = 37990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
            Specs = new() { { "os", "iPadOS" }, { "screen_size", "12.9 inch" }, { "chip", "Apple M4" }, { "storage", "512GB" } },
            Variants = new()
            {
                ("IPDM4-13-512-SLV", "iPad Pro M4 13 inch 512GB Bạc", 37990000m, 40990000m, new() { { "color", "Bạc" }, { "storage", "512GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "may-tinh-bang",
            BrandSlug = "apple",
            Name = "iPad Air M2 11 inch",
            Slug = "may-tinh-bang-ipad-air-m2-11-inch",
            ShortDesc = "Trang bị chip Apple M2 vượt trội, thiết kế thanh lịch nhiều sắc màu.",
            Desc = "Dòng máy tính bảng mỏng nhẹ, mạnh mẽ, đáp ứng hoàn hảo từ học tập tới dựng video 4K.",
            BasePrice = 16990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
            Specs = new() { { "os", "iPadOS" }, { "screen_size", "11 inch" }, { "chip", "Apple M2" }, { "storage", "128GB" } },
            Variants = new()
            {
                ("IPDAIR-128-PUR", "iPad Air M2 11 inch 128GB Tím", 16990000m, 18490000m, new() { { "color", "Tím" }, { "storage", "128GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "may-tinh-bang",
            BrandSlug = "apple",
            Name = "iPad Gen 10 10.9 inch",
            Slug = "may-tinh-bang-ipad-gen-10-10-9-inch",
            ShortDesc = "Thiết kế tràn viền mới, cổng sạc Type-C, camera đặt ngang thông minh.",
            Desc = "Sự lựa chọn hoàn hảo cho gia đình và học sinh với màn hình Liquid Retina sắc nét.",
            BasePrice = 9990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
            Specs = new() { { "os", "iPadOS" }, { "screen_size", "10.9 inch" }, { "chip", "Apple M2" }, { "storage", "128GB" } },
            Variants = new()
            {
                ("IPD10-64-BLU", "iPad Gen 10 64GB Xanh", 9990000m, 11490000m, new() { { "color", "Xanh" }, { "storage", "64GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "may-tinh-bang",
            BrandSlug = "samsung",
            Name = "Samsung Galaxy Tab S9 Ultra",
            Slug = "may-tinh-bang-samsung-galaxy-tab-s9-ultra",
            ShortDesc = "Màn hình khổng lồ 14.6 inch Dynamic AMOLED 2X, chuẩn chống nước IP68.",
            Desc = "Chiếc tablet Android đỉnh nhất thế giới với bút S-Pen thế hệ mới và chế độ Samsung DeX biến máy tính bảng thành laptop.",
            BasePrice = 27990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
            Specs = new() { { "os", "Android" }, { "screen_size", "12.9 inch" }, { "chip", "Snapdragon 8 Gen 2" }, { "storage", "256GB" } },
            Variants = new()
            {
                ("TABS9U-256-GRY", "Galaxy Tab S9 Ultra 256GB Xám Graphite", 27990000m, 30990000m, new() { { "color", "Xám Graphite" }, { "storage", "256GB" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 3. LAPTOP GAMING (8 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "asus",
            Name = "ASUS ROG Strix SCAR 16 (2024)",
            Slug = "laptop-asus-rog-strix-scar-16",
            ShortDesc = "Quái thú gaming Intel Core i9-14900HX, RTX 4090, màn hình Mini LED 240Hz Nebula HDR.",
            Desc = "Cỗ máy chiến game tối thượng dành cho game thủ Esports với hệ thống tản nhiệt ba quạt và keo tản nhiệt kim loại lỏng Conductonaut Extreme.",
            BasePrice = 69990000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i9" }, { "gpu", "RTX 4090" }, { "ram", "32GB" }, { "storage", "1TB SSD" }, { "screen", "16 inch 240Hz" } },
            Variants = new()
            {
                ("SCAR16-4090", "ROG Strix SCAR 16 i9/32GB/1TB/RTX4090", 69990000m, 73990000m, new() { { "color", "Off Black" }, { "gpu", "RTX 4090" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "asus",
            Name = "ASUS ROG Zephyrus G16 OLED",
            Slug = "laptop-asus-rog-zephyrus-g16",
            ShortDesc = "Mỏng nhẹ kim loại nguyên khối, màn hình ROG Nebula OLED 240Hz, RTX 4070.",
            Desc = "Sự kết hợp hoàn hảo giữa độ mỏng nhẹ thời trang và sức mạnh đồ họa đỉnh cao cho cả sáng tạo lẫn chơi game.",
            BasePrice = 52990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i9" }, { "gpu", "RTX 4070" }, { "ram", "32GB" }, { "storage", "1TB SSD" }, { "screen", "16 inch 240Hz" } },
            Variants = new()
            {
                ("ZEPH-G16-4070", "ROG Zephyrus G16 i9/32GB/1TB/RTX4070", 52990000m, 55990000m, new() { { "color", "Eclipse Gray" }, { "gpu", "RTX 4070" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "asus",
            Name = "ASUS TUF Gaming A15",
            Slug = "laptop-asus-tuf-gaming-a15",
            ShortDesc = "Độ bền chuẩn quân đội MIL-STD-810H, AMD Ryzen 7 7735HS, RTX 4060 140W.",
            Desc = "Chiếc laptop gaming quốc dân với độ bền bỉ vượt thời gian và tỷ lệ hiệu năng trên giá tiền tốt nhất.",
            BasePrice = 24990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "AMD Ryzen 7" }, { "gpu", "RTX 4060" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "screen", "15.6 inch 144Hz" } },
            Variants = new()
            {
                ("TUF-A15-4060", "ASUS TUF A15 R7/16GB/512GB/RTX4060", 24990000m, 26990000m, new() { { "color", "Mecha Gray" }, { "gpu", "RTX 4060" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "lenovo",
            Name = "Lenovo Legion Pro 7i Gen 9",
            Slug = "laptop-lenovo-legion-pro-7i",
            ShortDesc = "Sức mạnh AI Engine+ thông minh, chip i9-14900HX, card đồ họa RTX 4080.",
            Desc = "Cỗ máy thi đấu gaming được trang bị hệ thống làm mát buồng hơi Legion Coldfront Vapor và bàn phím Legion TrueStrike có LED RGB từng phím.",
            BasePrice = 64990000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i9" }, { "gpu", "RTX 4080" }, { "ram", "32GB" }, { "storage", "1TB SSD" }, { "screen", "16 inch 240Hz" } },
            Variants = new()
            {
                ("LEGION-7I-4080", "Lenovo Legion Pro 7i i9/32GB/1TB/RTX4080", 64990000m, 68990000m, new() { { "color", "Onyx Grey" }, { "gpu", "RTX 4080" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "lenovo",
            Name = "Lenovo Legion 5 Pro",
            Slug = "laptop-lenovo-legion-5-pro",
            ShortDesc = "Màn hình tỉ lệ vàng 16:10 2.5K 165Hz chuẩn màu 100% sRGB, Ryzen 7, RTX 4070.",
            Desc = "Mẫu laptop gaming được đánh giá cao nhất nhờ tản nhiệt mát mẻ và bàn phím gõ êm ái.",
            BasePrice = 36990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "AMD Ryzen 7" }, { "gpu", "RTX 4070" }, { "ram", "16GB" }, { "storage", "1TB SSD" }, { "screen", "16 inch 165Hz" } },
            Variants = new()
            {
                ("LEGION-5P-4070", "Lenovo Legion 5 Pro R7/16GB/1TB/RTX4070", 36990000m, 39990000m, new() { { "color", "Storm Grey" }, { "gpu", "RTX 4070" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "acer",
            Name = "Acer Predator Helios 16",
            Slug = "laptop-acer-predator-helios-16",
            ShortDesc = "Quạt kim loại 3D AeroBlade thế hệ 5, Core i9-14900HX, RTX 4070.",
            Desc = "Hiệu năng bùng nổ cho game thủ hardcore với khả năng ép xung một nút bấm PredatorSense.",
            BasePrice = 48990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i9" }, { "gpu", "RTX 4070" }, { "ram", "16GB" }, { "storage", "1TB SSD" }, { "screen", "16 inch 240Hz" } },
            Variants = new()
            {
                ("PRED-16-4070", "Acer Predator Helios 16 i9/16GB/1TB/RTX4070", 48990000m, 51990000m, new() { { "color", "Abyssal Black" }, { "gpu", "RTX 4070" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "acer",
            Name = "Acer Nitro V 15",
            Slug = "laptop-acer-nitro-v-15",
            ShortDesc = "Gaming thế hệ mới với Core i7-13620H, RTX 4060, màn hình 144Hz IPS.",
            Desc = "Chiếc laptop Nitro thế hệ mới với phong cách thiết kế hiện đại, tinh giản.",
            BasePrice = 19990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i7" }, { "gpu", "RTX 4060" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "screen", "15.6 inch 144Hz" } },
            Variants = new()
            {
                ("NITRO-V15-4060", "Acer Nitro V 15 i7/16GB/512GB/RTX4060", 19990000m, 21990000m, new() { { "color", "Obsidian Black" }, { "gpu", "RTX 4060" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-gaming",
            BrandSlug = "dell",
            Name = "Dell Alienware m18 R2",
            Slug = "laptop-dell-alienware-m18-r2",
            ShortDesc = "Kích thước khổng lồ 18 inch 240Hz QHD+, i9-14900HX, RTX 4090 175W max công suất.",
            Desc = "Biểu tượng gaming vũ trụ Alienware mang sức mạnh thay thế máy tính để bàn hoàn hảo.",
            BasePrice = 89990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i9" }, { "gpu", "RTX 4090" }, { "ram", "64GB" }, { "storage", "2TB SSD" }, { "screen", "18 inch 240Hz" } },
            Variants = new()
            {
                ("ALW-M18-4090", "Dell Alienware m18 R2 i9/64GB/2TB/RTX4090", 89990000m, 94990000m, new() { { "color", "Dark Metallic Moon" }, { "gpu", "RTX 4090" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 4. LAPTOP VĂN PHÒNG & DOANH NHÂN (8 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "apple",
            Name = "MacBook Pro 16 M3 Max",
            Slug = "laptop-apple-macbook-pro-16-m3-max",
            ShortDesc = "Sức mạnh dựng phim 8K và AI đỉnh cao, màn hình Liquid Retina XDR 120Hz, pin 22 giờ.",
            Desc = "Cỗ máy làm việc di động hoàn hảo nhất lịch sử Apple, xử lý các tác vụ render 3D và lập trình máy học nhẹ nhàng với chip M3 Max.",
            BasePrice = 89990000m,
            IsFeatured = true,
            Model3DUrl = "https://models.madkstore.vn/macbook-pro-16.glb",
            ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
            Specs = new() { { "cpu", "Apple M3 Pro" }, { "ram", "32GB" }, { "storage", "1TB SSD" }, { "weight", "Trên 1.5kg" } },
            Variants = new()
            {
                ("MBP16-M3MAX-BLK", "MacBook Pro 16 M3 Max 36GB/1TB Đen Không Gian", 89990000m, 92990000m, new() { { "color", "Đen Không Gian" }, { "storage", "1TB SSD" } }),
                ("MBP16-M3MAX-SLV", "MacBook Pro 16 M3 Max 36GB/1TB Bạc", 89990000m, 92990000m, new() { { "color", "Bạc" }, { "storage", "1TB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "apple",
            Name = "MacBook Pro 14 M3",
            Slug = "laptop-apple-macbook-pro-14-m3",
            ShortDesc = "Màn hình 14.2 inch ProMotion 120Hz, vỏ nhôm tái chế nguyên khối bền bỉ.",
            Desc = "Laptop đồ họa nhỏ gọn cho người sáng tạo nội dung di chuyển liên tục.",
            BasePrice = 39990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
            Specs = new() { { "cpu", "Apple M3" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "weight", "1.2kg - 1.5kg" } },
            Variants = new()
            {
                ("MBP14-M3-512-GRY", "MacBook Pro 14 M3 16GB/512GB Xám Không Gian", 39990000m, 42990000m, new() { { "color", "Xám Không Gian" }, { "storage", "512GB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "apple",
            Name = "MacBook Air 13 M3",
            Slug = "laptop-apple-macbook-air-13-m3",
            ShortDesc = "Siêu mỏng 11.3mm, nhẹ 1.24kg, hỗ trợ xuất 2 màn hình ngoài.",
            Desc = "Chiếc laptop được yêu thích nhất thế giới với khả năng vận hành hoàn toàn không cần quạt tản nhiệt, tĩnh lặng tuyệt đối.",
            BasePrice = 27990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
            Specs = new() { { "cpu", "Apple M3" }, { "ram", "16GB" }, { "storage", "256GB SSD" }, { "weight", "1.2kg - 1.5kg" } },
            Variants = new()
            {
                ("MBA13-M3-MID", "MacBook Air 13 M3 16GB/256GB Nửa Đêm", 27990000m, 29990000m, new() { { "color", "Nửa Đêm" }, { "storage", "256GB SSD" } }),
                ("MBA13-M3-SLR", "MacBook Air 13 M3 16GB/256GB Ánh Sao", 27990000m, 29990000m, new() { { "color", "Ánh Sao" }, { "storage", "256GB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "apple",
            Name = "MacBook Air 15 M3",
            Slug = "laptop-apple-macbook-air-15-m3",
            ShortDesc = "Màn hình 15.3 inch rộng rãi trong thân hình siêu mỏng nhẹ chỉ 1.5kg.",
            Desc = "Trải nghiệm không gian làm việc rộng rãi cùng thời lượng pin 18 giờ liên tục.",
            BasePrice = 32990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
            Specs = new() { { "cpu", "Apple M3" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "weight", "1.2kg - 1.5kg" } },
            Variants = new()
            {
                ("MBA15-M3-MID", "MacBook Air 15 M3 16GB/512GB Nửa Đêm", 32990000m, 35990000m, new() { { "color", "Nửa Đêm" }, { "storage", "512GB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "dell",
            Name = "Dell XPS 13 Plus 9320",
            Slug = "laptop-dell-xps-13-plus-9320",
            ShortDesc = "Bàn di chuột tàng hình bằng kính liền mạch, bàn phím tràn viền không khoảng cách.",
            Desc = "Kiệt tác thiết kế mang phong cách tương lai với màn hình OLED 3.5K cảm ứng tuyệt đẹp.",
            BasePrice = 44990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i7" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "weight", "1.2kg - 1.5kg" } },
            Variants = new()
            {
                ("XPS13P-I7-512", "Dell XPS 13 Plus i7/16GB/512GB Bạch Kim", 44990000m, 48990000m, new() { { "color", "Bạch Kim" }, { "storage", "512GB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "dell",
            Name = "Dell Inspiron 14 5440",
            Slug = "laptop-dell-inspiron-14-5440",
            ShortDesc = "Bền bỉ, pin khỏe, màn hình 14 inch chống chói góc rộng cho dân văn phòng.",
            Desc = "Chiếc máy tính xách tay thực dụng, đáng tin cậy phục vụ nhu cầu xử lý văn bản và kế toán hàng ngày.",
            BasePrice = 17990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i5" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "weight", "1.2kg - 1.5kg" } },
            Variants = new()
            {
                ("INS14-I5-512", "Dell Inspiron 14 i5/16GB/512GB Bạc", 17990000m, 19990000m, new() { { "color", "Bạc" }, { "storage", "512GB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "lenovo",
            Name = "Lenovo ThinkPad X1 Carbon Gen 12",
            Slug = "laptop-lenovo-thinkpad-x1-carbon-gen-12",
            ShortDesc = "Vỏ sợi carbon siêu nhẹ 1.09kg, bàn phím gõ sướng nhất phân khúc, bảo mật doanh nghiệp.",
            Desc = "Huyền thoại laptop doanh nhân tiếp tục hoàn thiện với thanh Communications Bar mới tích hợp camera FHD và mic AI.",
            BasePrice = 56990000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i7" }, { "ram", "32GB" }, { "storage", "1TB SSD" }, { "weight", "Dưới 1.2kg" } },
            Variants = new()
            {
                ("TP-X1C12-I7", "ThinkPad X1 Carbon Gen 12 i7/32GB/1TB Đen", 56990000m, 60990000m, new() { { "color", "Đen Carbon" }, { "storage", "1TB SSD" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "laptop-van-phong",
            BrandSlug = "asus",
            Name = "ASUS Zenbook 14 OLED",
            Slug = "laptop-asus-zenbook-14-oled",
            ShortDesc = "Màn hình OLED 3K 120Hz rực rỡ, chip Intel Core Ultra 7 tích hợp NPU AI.",
            Desc = "Mỏng nhẹ chuẩn thanh lịch với pin dung lượng lớn 75Wh cho cả ngày dài làm việc linh hoạt.",
            BasePrice = 28990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
            Specs = new() { { "cpu", "Intel Core i7" }, { "ram", "16GB" }, { "storage", "512GB SSD" }, { "weight", "1.2kg - 1.5kg" } },
            Variants = new()
            {
                ("ZEN14-U7-512", "ASUS Zenbook 14 OLED U7/16GB/512GB Xanh", 28990000m, 31990000m, new() { { "color", "Xanh Ponder" }, { "storage", "512GB SSD" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 5. BÀN PHÍM CƠ (8 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "keychron",
            Name = "Bàn phím cơ Keychron Q1 Pro Wireless",
            Slug = "ban-phim-co-keychron-q1-pro-wireless",
            ShortDesc = "Vỏ nhôm CNC 75%, gasket mount, kết nối Bluetooth 5.1 và keycap PBT doubleshot.",
            Desc = "Bàn phím cơ custom không dây cao cấp nhất của Keychron hỗ trợ phần mềm QMK/VIA tùy biến từng phím bấm.",
            BasePrice = 4500000m,
            IsFeatured = true,
            Model3DUrl = "https://models.madkstore.vn/keychron-q1-pro.glb",
            ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
            Specs = new() { { "switch", "Tactile" }, { "layout", "75%" }, { "connectivity", "Không dây (Bluetooth/2.4G)" }, { "hotswap", "Có" } },
            Variants = new()
            {
                ("KQ1P-RED", "Keychron Q1 Pro Red Switch", 4500000m, 4800000m, new() { { "switch", "Linear Red" }, { "color", "Carbon Black" } }),
                ("KQ1P-BRN", "Keychron Q1 Pro Brown Switch", 4500000m, 4800000m, new() { { "switch", "Tactile Brown" }, { "color", "Carbon Black" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "keychron",
            Name = "Bàn phím cơ Keychron V1 Max",
            Slug = "ban-phim-co-keychron-v1-max",
            ShortDesc = "Layout 75%, 3 chế độ kết nối (2.4GHz/BT/Type-C), foam tiêu âm dày dặn.",
            Desc = "Chiếc bàn phím cơ hoàn hảo cho người mới bắt đầu bước chân vào bộ môn phím custom.",
            BasePrice = 2190000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
            Specs = new() { { "switch", "Linear" }, { "layout", "75%" }, { "connectivity", "Không dây (Bluetooth/2.4G)" }, { "hotswap", "Có" } },
            Variants = new()
            {
                ("KV1M-RED", "Keychron V1 Max Red Switch", 2190000m, 2490000m, new() { { "switch", "Linear Red" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "keychron",
            Name = "Bàn phím cơ Keychron K2 Pro",
            Slug = "ban-phim-co-keychron-k2-pro",
            ShortDesc = "Bản nâng cấp của K2 huyền thoại với hỗ trợ QMK/VIA và lót foam cách âm.",
            Desc = "Thiết kế nhỏ gọn 84 phím bấm đầy đủ hàng phím F tiện lợi cho cả lập trình và soạn thảo văn bản.",
            BasePrice = 2490000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
            Specs = new() { { "switch", "Tactile" }, { "layout", "75%" }, { "connectivity", "Không dây (Bluetooth/2.4G)" }, { "hotswap", "Có" } },
            Variants = new()
            {
                ("KK2P-BRN", "Keychron K2 Pro Brown Switch", 2490000m, 2790000m, new() { { "switch", "Tactile Brown" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "keychron",
            Name = "Bàn phím cơ Keychron K8 Pro",
            Slug = "ban-phim-co-keychron-k8-pro",
            ShortDesc = "Layout TKL tiêu chuẩn, kết nối Bluetooth đa thiết bị, hotswap 5-pin.",
            Desc = "Sự lựa chọn chuẩn chỉ cho ai quen layout TKL không có cụm số phụ.",
            BasePrice = 2690000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
            Specs = new() { { "switch", "Linear" }, { "layout", "TKL" }, { "connectivity", "Không dây (Bluetooth/2.4G)" }, { "hotswap", "Có" } },
            Variants = new()
            {
                ("KK8P-RED", "Keychron K8 Pro Red Switch", 2690000m, 2990000m, new() { { "switch", "Linear Red" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "razer",
            Name = "Bàn phím cơ Razer BlackWidow V4 Pro",
            Slug = "ban-phim-co-razer-blackwidow-v4-pro",
            ShortDesc = "Switch cơ học Razer Green/Yellow, núm xoay Command Dial, đèn nền Chroma RGB 3 phía.",
            Desc = "Bàn phím gaming đỉnh cao với kê tay da mềm mại có dải LED đồng bộ rực rỡ.",
            BasePrice = 5490000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
            Specs = new() { { "switch", "Linear" }, { "layout", "Fullsize" }, { "connectivity", "Có dây" }, { "hotswap", "Không" } },
            Variants = new()
            {
                ("RZ-BW4P-YEL", "Razer BlackWidow V4 Pro Yellow Switch", 5490000m, 5990000m, new() { { "switch", "Yellow Linear" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "razer",
            Name = "Bàn phím cơ Razer Huntsman V3 Pro TKL",
            Slug = "ban-phim-co-razer-huntsman-v3-pro-tkl",
            ShortDesc = "Switch quang học Analog Gen-2, tính năng Rapid Trigger phản hồi tức thì.",
            Desc = "Vũ khí tối thượng của game thủ Valorant và CS2 với khả năng kích hoạt phím cực nhạy.",
            BasePrice = 5190000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
            Specs = new() { { "switch", "Linear" }, { "layout", "TKL" }, { "connectivity", "Có dây" }, { "hotswap", "Không" } },
            Variants = new()
            {
                ("RZ-HNT3P-TKL", "Razer Huntsman V3 Pro TKL Analog", 5190000m, 5590000m, new() { { "switch", "Analog Optical" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "corsair",
            Name = "Bàn phím cơ Corsair K70 MAX RGB",
            Slug = "ban-phim-co-corsair-k70-max-rgb",
            ShortDesc = "Switch từ tính CORSAIR MGX điều chỉnh điểm nhận lệnh từ 0.4mm đến 3.6mm.",
            Desc = "Bàn phím cơ từ tính cao cấp với công nghệ xử lý siêu nhanh CORSAIR AXON 8000Hz.",
            BasePrice = 4990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
            Specs = new() { { "switch", "Linear" }, { "layout", "Fullsize" }, { "connectivity", "Có dây" }, { "hotswap", "Không" } },
            Variants = new()
            {
                ("COR-K70MAX", "Corsair K70 MAX MGX Magnetic Switch", 4990000m, 5390000m, new() { { "switch", "MGX Magnetic" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ban-phim-co",
            BrandSlug = "corsair",
            Name = "Bàn phím cơ Corsair K65 PLUS WIRELESS",
            Slug = "ban-phim-co-corsair-k65-plus-wireless",
            ShortDesc = "Layout 75%, hotswap, switch Corsair MLX Red bôi trơn sẵn mượt mà.",
            Desc = "Bàn phím không dây 75% thanh lịch với núm xoay đa chức năng và pin lên tới 266 giờ.",
            BasePrice = 3890000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
            Specs = new() { { "switch", "Linear" }, { "layout", "75%" }, { "connectivity", "Không dây (Bluetooth/2.4G)" }, { "hotswap", "Có" } },
            Variants = new()
            {
                ("COR-K65P-RED", "Corsair K65 Plus Wireless Red Switch", 3890000m, 4290000m, new() { { "switch", "Corsair MLX Red" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 6. CHUỘT GAMING (7 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "logitech",
            Name = "Chuột gaming Logitech G Pro X Superlight 2",
            Slug = "chuot-gaming-logitech-g-pro-x-superlight-2",
            ShortDesc = "Siêu nhẹ 60g, cảm biến HERO 2 32000 DPI, switch lai quang học LIGHTFORCE.",
            Desc = "Chuột thi đấu Esports được các tuyển thủ chuyên nghiệp toàn cầu tin dùng nhất.",
            BasePrice = 3890000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "Optical HERO" }, { "weight", "Siêu nhẹ (<63g)" }, { "connectivity", "Không dây 2.4GHz" } },
            Variants = new()
            {
                ("GPX2-WHT", "Logitech G Pro X Superlight 2 Trắng", 3890000m, 4290000m, new() { { "color", "Trắng" } }),
                ("GPX2-BLK", "Logitech G Pro X Superlight 2 Đen", 3890000m, 4290000m, new() { { "color", "Đen" } }),
                ("GPX2-MAG", "Logitech G Pro X Superlight 2 Hồng Magenta", 3890000m, 4290000m, new() { { "color", "Hồng Magenta" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "logitech",
            Name = "Chuột gaming Logitech G502 X PLUS",
            Slug = "chuot-gaming-logitech-g502-x-plus",
            ShortDesc = "Huyền thoại tái sinh với switch lai LIGHTFORCE, LED LIGHTSYNC RGB 8 vùng.",
            Desc = "Mẫu chuột đa năng với 13 nút lập trình, nút cuộn 2 chế độ và pin sạc không dây POWERPLAY.",
            BasePrice = 3290000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "Optical HERO" }, { "weight", "Nặng (>85g)" }, { "connectivity", "Không dây 2.4GHz" } },
            Variants = new()
            {
                ("G502XP-BLK", "Logitech G502 X PLUS Đen", 3290000m, 3590000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "logitech",
            Name = "Chuột gaming Logitech G502 HERO High Performance",
            Slug = "chuot-gaming-logitech-g502-hero",
            ShortDesc = "Cảm biến HERO 25K, 11 nút lập trình, 5 tạ tùy chỉnh trọng lượng.",
            Desc = "Chuột gaming quốc dân bán chạy nhất thế giới với thiết kế công thái học đầm tay.",
            BasePrice = 990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "Optical HERO" }, { "weight", "Nặng (>85g)" }, { "connectivity", "Có dây" } },
            Variants = new()
            {
                ("G502H-BLK", "Logitech G502 HERO Có Dây Đen", 990000m, 1290000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "razer",
            Name = "Chuột gaming Razer DeathAdder V3 Pro",
            Slug = "chuot-gaming-razer-deathadder-v3-pro",
            ShortDesc = "Form công thái học huyền thoại, siêu nhẹ 63g, cảm biến Focus Pro 30K.",
            Desc = "Sự hoàn thiện tinh xảo cho trải nghiệm cầm nắm tay phải thoải mái trong những trận đấu dài.",
            BasePrice = 3690000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "Focus Pro" }, { "weight", "Siêu nhẹ (<63g)" }, { "connectivity", "Không dây 2.4GHz" } },
            Variants = new()
            {
                ("DAV3P-BLK", "Razer DeathAdder V3 Pro Đen", 3690000m, 3990000m, new() { { "color", "Đen" } }),
                ("DAV3P-WHT", "Razer DeathAdder V3 Pro Trắng", 3690000m, 3990000m, new() { { "color", "Trắng" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "razer",
            Name = "Chuột gaming Razer Viper V3 Pro",
            Slug = "chuot-gaming-razer-viper-v3-pro",
            ShortDesc = "Siêu nhẹ 54g, tần số phản hồi không dây True 8000Hz HyperPolling.",
            Desc = "Thiết kế đối xứng hoàn hảo cho game thủ cầm kiểu claw-grip hoặc fingertip-grip.",
            BasePrice = 4190000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "Focus Pro" }, { "weight", "Siêu nhẹ (<63g)" }, { "connectivity", "Không dây 2.4GHz" } },
            Variants = new()
            {
                ("VIP3P-BLK", "Razer Viper V3 Pro Đen", 4190000m, 4490000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "razer",
            Name = "Chuột gaming Razer Basilisk V3 Pro",
            Slug = "chuot-gaming-razer-basilisk-v3-pro",
            ShortDesc = "Con lăn Razer HyperScroll Tilt Wheel, LED Chroma 13 vùng, sạc không dây Qi.",
            Desc = "Chuột công thái học cao cấp với đầy đủ tính năng giải trí và tùy biến sâu.",
            BasePrice = 3890000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "Focus Pro" }, { "weight", "Nặng (>85g)" }, { "connectivity", "Không dây 2.4GHz" } },
            Variants = new()
            {
                ("BAS3P-BLK", "Razer Basilisk V3 Pro Đen", 3890000m, 4290000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "chuot-gaming",
            BrandSlug = "corsair",
            Name = "Chuột gaming Corsair Darkstar Wireless MMO",
            Slug = "chuot-gaming-corsair-darkstar-wireless-mmo",
            ShortDesc = "15 nút lập trình, cụm phím sườn độc đáo, cảm biến Marksman 26000 DPI.",
            Desc = "Chuột không dây tối ưu cho game thủ MOBA và MMO với khả năng gán macro phức tạp.",
            BasePrice = 3590000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
            Specs = new() { { "sensor", "PixArt 3395" }, { "weight", "Nặng (>85g)" }, { "connectivity", "Không dây 2.4GHz" } },
            Variants = new()
            {
                ("COR-DARKSTAR", "Corsair Darkstar Wireless RGB", 3590000m, 3990000m, new() { { "color", "Đen" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 7. TAI NGHE & AUDIO (7 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "sony",
            Name = "Tai nghe chống ồn Sony WH-1000XM5",
            Slug = "tai-nghe-sony-wh-1000xm5-wireless",
            ShortDesc = "Chống ồn đỉnh cao Auto NC Optimizer, 8 microphone, driver carbon fiber 30mm.",
            Desc = "Chuẩn mực tai nghe chống ồn chủ động toàn cầu mang đến không gian tĩnh lặng tuyệt đối cho âm nhạc hi-res.",
            BasePrice = 8490000m,
            IsFeatured = true,
            Model3DUrl = "https://models.madkstore.vn/sony-wh-1000xm5.glb",
            ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
            Specs = new() { { "type", "Over-ear" }, { "anc", "Có" }, { "battery", "20 - 30 giờ" }, { "connectivity", "Bluetooth 5.3" } },
            Variants = new()
            {
                ("WH1000M5-BLK", "Sony WH-1000XM5 Đen", 8490000m, 8990000m, new() { { "color", "Đen" } }),
                ("WH1000M5-SLV", "Sony WH-1000XM5 Bạc", 8490000m, 8990000m, new() { { "color", "Bạc Bạch Kim" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "sony",
            Name = "Tai nghe True Wireless Sony WF-1000XM5",
            Slug = "tai-nghe-sony-wf-1000xm5-tws",
            ShortDesc = "Chống ồn in-ear tốt nhất thị trường, chip V2 và QN2e, âm thanh Hi-Res LDAC.",
            Desc = "Âm trường rộng mở, đàm thoại AI rõ ràng và đệm tai bọt polyurethane cách âm xuất sắc.",
            BasePrice = 5990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
            Specs = new() { { "type", "In-ear (TWS)" }, { "anc", "Có" }, { "battery", "Dưới 10 giờ" }, { "connectivity", "Bluetooth 5.3" } },
            Variants = new()
            {
                ("WF1000M5-BLK", "Sony WF-1000XM5 Đen", 5990000m, 6490000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "apple",
            Name = "Tai nghe Apple AirPods Max",
            Slug = "tai-nghe-apple-airpods-max",
            ShortDesc = "Khung thép không gỉ bọc lưới knit-mesh, Spatial Audio cá nhân hóa, chip H1 kép.",
            Desc = "Tai nghe over-ear cao cấp tích hợp chế độ Transparency Mode tự nhiên nhất phân khúc.",
            BasePrice = 12490000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
            Specs = new() { { "type", "Over-ear" }, { "anc", "Có" }, { "battery", "20 - 30 giờ" }, { "connectivity", "Bluetooth 5.3" } },
            Variants = new()
            {
                ("APM-SLV", "Apple AirPods Max Bạc", 12490000m, 13990000m, new() { { "color", "Bạc" } }),
                ("APM-GRY", "Apple AirPods Max Xám Không Gian", 12490000m, 13990000m, new() { { "color", "Xám Không Gian" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "apple",
            Name = "Tai nghe Apple AirPods Pro 2 USB-C",
            Slug = "tai-nghe-apple-airpods-pro-2-usb-c",
            ShortDesc = "Chip H2, chống ồn chủ động mạnh gấp đôi, kháng nước và bụi bẩn IP54.",
            Desc = "Mẫu tai nghe không dây được trang bị tính năng Adaptive Audio tự động cân bằng âm thanh theo môi trường.",
            BasePrice = 5490000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",
            Specs = new() { { "type", "In-ear (TWS)" }, { "anc", "Có" }, { "battery", "Dưới 10 giờ" }, { "connectivity", "Bluetooth 5.3" } },
            Variants = new()
            {
                ("APP2-WHT", "Apple AirPods Pro 2 USB-C Trắng", 5490000m, 6190000m, new() { { "color", "Trắng" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "logitech",
            Name = "Tai nghe gaming Logitech G PRO X 2 LIGHTSPEED",
            Slug = "tai-nghe-logitech-g-pro-x-2-lightspeed",
            ShortDesc = "Màng loa Graphene 50mm đầu tiên trên thế giới, kết nối LIGHTSPEED, pin 50 giờ.",
            Desc = "Âm thanh định vị chuẩn xác đến từng bước chân cho các tuyển thủ bắn súng góc nhìn thứ nhất.",
            BasePrice = 5890000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
            Specs = new() { { "type", "Over-ear" }, { "anc", "Không" }, { "battery", "Trên 30 giờ" }, { "connectivity", "Wireless 2.4GHz" } },
            Variants = new()
            {
                ("GPX2-HEAD-BLK", "Logitech G PRO X 2 LIGHTSPEED Đen", 5890000m, 6290000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "razer",
            Name = "Tai nghe gaming Razer BlackShark V2 Pro 2023",
            Slug = "tai-nghe-razer-blackshark-v2-pro-2023",
            ShortDesc = "Mic Razer HyperClear Super Wideband, màng loa TriForce Titanium 50mm, pin 70 giờ.",
            Desc = "Khả năng thu âm giọng nói trong trẻo cấp độ phòng thu và cách âm thụ động siêu tốt.",
            BasePrice = 4690000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
            Specs = new() { { "type", "Over-ear" }, { "anc", "Không" }, { "battery", "Trên 30 giờ" }, { "connectivity", "Wireless 2.4GHz" } },
            Variants = new()
            {
                ("BSV2P-BLK", "Razer BlackShark V2 Pro 2023 Đen", 4690000m, 4990000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "tai-nghe",
            BrandSlug = "corsair",
            Name = "Tai nghe Corsair Virtuoso Pro Open Back",
            Slug = "tai-nghe-corsair-virtuoso-pro-open-back",
            ShortDesc = "Thiết kế mở Open-Back, màng loa Graphene 50mm, âm trường tự nhiên rộng lớn.",
            Desc = "Lựa chọn lý tưởng cho các streamer và nhà sáng tạo âm thanh yêu thích chất âm thoáng đãng.",
            BasePrice = 4490000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
            Specs = new() { { "type", "Over-ear" }, { "anc", "Không" }, { "battery", "Dưới 10 giờ" }, { "connectivity", "Jack 3.5mm/Type-C" } },
            Variants = new()
            {
                ("COR-VIRPRO-CARB", "Corsair Virtuoso Pro Carbon", 4490000m, 4890000m, new() { { "color", "Carbon" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 8. CPU - VI XỬ LÝ (6 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "cpu-vi-xu-ly",
            BrandSlug = "intel",
            Name = "CPU Intel Core i9-14900K",
            Slug = "cpu-intel-core-i9-14900k",
            ShortDesc = "24 nhân 32 luồng, xung nhịp Turbo 6.0 GHz, socket LGA1700, hỗ trợ DDR4 & DDR5.",
            Desc = "Bộ vi xử lý máy tính để bàn mạnh nhất của Intel thế hệ Raptor Lake Refresh phục vụ render nặng và chơi game max setting.",
            BasePrice = 14990000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
            Specs = new() { { "socket", "LGA1700" }, { "cores_threads", "24 nhân 32 luồng" }, { "boost_clock", "Lên đến 6.0 GHz" } },
            Variants = new()
            {
                ("INT-14900K-BOX", "Intel Core i9-14900K Box Chính Hãng", 14990000m, 15990000m, new() { { "type", "Box Chính Hãng" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "cpu-vi-xu-ly",
            BrandSlug = "intel",
            Name = "CPU Intel Core i7-14700K",
            Slug = "cpu-intel-core-i7-14700k",
            ShortDesc = "20 nhân 28 luồng (thêm 4 E-core), xung nhịp 5.6 GHz, lựa chọn toàn diện.",
            Desc = "Nâng cấp vượt bậc số lượng nhân xử lý giúp đa nhiệm và render video nhanh hơn 20% so với thế hệ trước.",
            BasePrice = 10890000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
            Specs = new() { { "socket", "LGA1700" }, { "cores_threads", "14 nhân 20 luồng" }, { "boost_clock", "Lên đến 5.4 GHz" } },
            Variants = new()
            {
                ("INT-14700K-BOX", "Intel Core i7-14700K Box Chính Hãng", 10890000m, 11590000m, new() { { "type", "Box Chính Hãng" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "cpu-vi-xu-ly",
            BrandSlug = "intel",
            Name = "CPU Intel Core i5-14600K",
            Slug = "cpu-intel-core-i5-14600k",
            ShortDesc = "14 nhân 20 luồng, xung nhịp 5.3 GHz, vua phân khúc gaming tầm trung.",
            Desc = "Sự lựa chọn chuẩn xác cho dàn PC gaming hiện đại với khả năng ép xung linh hoạt.",
            BasePrice = 7890000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
            Specs = new() { { "socket", "LGA1700" }, { "cores_threads", "14 nhân 20 luồng" }, { "boost_clock", "Lên đến 5.4 GHz" } },
            Variants = new()
            {
                ("INT-14600K-BOX", "Intel Core i5-14600K Box Chính Hãng", 7890000m, 8390000m, new() { { "type", "Box Chính Hãng" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "cpu-vi-xu-ly",
            BrandSlug = "amd",
            Name = "CPU AMD Ryzen 9 7950X3D",
            Slug = "cpu-amd-ryzen-9-7950x3d",
            ShortDesc = "16 nhân 32 luồng, công nghệ 3D V-Cache 144MB bộ nhớ đệm, socket AM5.",
            Desc = "Sức mạnh tối thượng kết hợp hoàn hảo giữa năng lực render công việc đồ họa nặng và hiệu năng gaming số 1.",
            BasePrice = 16490000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
            Specs = new() { { "socket", "AM5" }, { "cores_threads", "24 nhân 32 luồng" }, { "boost_clock", "Lên đến 6.0 GHz" } },
            Variants = new()
            {
                ("AMD-7950X3D", "AMD Ryzen 9 7950X3D Box", 16490000m, 17990000m, new() { { "type", "Box Chính Hãng" } } )
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "cpu-vi-xu-ly",
            BrandSlug = "amd",
            Name = "CPU AMD Ryzen 7 7800X3D",
            Slug = "cpu-amd-ryzen-7-7800x3d",
            ShortDesc = "8 nhân 16 luồng, 3D V-Cache 96MB, CPU chơi game tốt nhất thế giới.",
            Desc = "Mẫu CPU được cộng đồng game thủ thế giới đánh giá là vi xử lý gaming tối ưu nhất với mức ăn điện cực thấp.",
            BasePrice = 10990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
            Specs = new() { { "socket", "AM5" }, { "cores_threads", "8 nhân 16 luồng" }, { "boost_clock", "Lên đến 5.0 GHz" } },
            Variants = new()
            {
                ("AMD-7800X3D", "AMD Ryzen 7 7800X3D Box", 10990000m, 11990000m, new() { { "type", "Box Chính Hãng" } } )
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "cpu-vi-xu-ly",
            BrandSlug = "amd",
            Name = "CPU AMD Ryzen 5 7600X",
            Slug = "cpu-amd-ryzen-5-7600x",
            ShortDesc = "6 nhân 12 luồng, xung nhịp 5.3 GHz, socket AM5 nền tảng DDR5 bền vững.",
            Desc = "Bước khởi đầu hoàn hảo gia nhập hệ sinh thái socket AM5 thế hệ mới của AMD.",
            BasePrice = 5790000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
            Specs = new() { { "socket", "AM5" }, { "cores_threads", "6 nhân 12 luồng" }, { "boost_clock", "Lên đến 5.0 GHz" } },
            Variants = new()
            {
                ("AMD-7600X", "AMD Ryzen 5 7600X Box", 5790000m, 6290000m, new() { { "type", "Box Chính Hãng" } } )
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 9. VGA - CARD MÀN HÌNH (6 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "vga-card-man-hinh",
            BrandSlug = "asus",
            Name = "VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB",
            Slug = "vga-asus-rog-strix-geforce-rtx-4090",
            ShortDesc = "Kiến trúc Ada Lovelace, 24GB GDDR6X, khung kim loại đúc khuôn cứng cáp, buồng hơi tản nhiệt.",
            Desc = "Chiếc card đồ họa mạnh mẽ và hầm hố nhất thế giới, sẵn sàng cân mọi tựa game 4K Ray Tracing và huấn luyện mô hình AI.",
            BasePrice = 58990000m,
            IsFeatured = true,
            Model3DUrl = "https://models.madkstore.vn/rtx-4090.glb",
            ImageUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
            Specs = new() { { "vram", "24GB GDDR6X" }, { "bus_width", "384-bit" }, { "power_consumption", "1000W" } },
            Variants = new()
            {
                ("ROG-4090-24G", "ASUS ROG Strix RTX 4090 OC Edition 24GB", 58990000m, 62990000m, new() { { "color", "Đen RGB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "vga-card-man-hinh",
            BrandSlug = "asus",
            Name = "VGA ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB",
            Slug = "vga-asus-tuf-gaming-geforce-rtx-4080-super",
            ShortDesc = "Độ bền chuẩn quân sự, quạt vòng bi kép Axial-tech, 16GB GDDR6X.",
            Desc = "Hiệu năng chơi game 4K mượt mà với công nghệ DLSS 3 Frame Generation đột phá.",
            BasePrice = 31990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
            Specs = new() { { "vram", "16GB GDDR6X" }, { "bus_width", "256-bit" }, { "power_consumption", "850W" } },
            Variants = new()
            {
                ("TUF-4080S-16G", "ASUS TUF RTX 4080 SUPER 16GB", 31990000m, 33990000m, new() { { "color", "Xám Gunmetal" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "vga-card-man-hinh",
            BrandSlug = "nvidia",
            Name = "VGA MSI GeForce RTX 4070 Ti SUPER Gaming X Slim",
            Slug = "vga-msi-geforce-rtx-4070-ti-super",
            ShortDesc = "Thiết kế mỏng nhẹ Slim, 16GB VRAM 256-bit, tản nhiệt TRI FROZR 3.",
            Desc = "Chiếc card hoàn hảo cho độ phân giải 2K và 4K với bộ nhớ VRAM 16GB rộng rãi.",
            BasePrice = 23990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
            Specs = new() { { "vram", "16GB GDDR6X" }, { "bus_width", "256-bit" }, { "power_consumption", "750W" } },
            Variants = new()
            {
                ("MSI-4070TIS", "MSI RTX 4070 Ti SUPER Gaming X Slim 16G", 23990000m, 25990000m, new() { { "color", "Đen RGB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "vga-card-man-hinh",
            BrandSlug = "nvidia",
            Name = "VGA Gigabyte GeForce RTX 4060 Ti Gaming OC 8GB",
            Slug = "vga-gigabyte-geforce-rtx-4060-ti",
            ShortDesc = "Hệ thống 3 quạt tản nhiệt WINDFORCE, ống đồng tiếp xúc trực tiếp, DLSS 3.",
            Desc = "Card đồ họa chuyên trị các tựa game AAA ở độ phân giải Full HD max setting.",
            BasePrice = 11490000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
            Specs = new() { { "vram", "8GB GDDR6" }, { "bus_width", "128-bit" }, { "power_consumption", "650W" } },
            Variants = new()
            {
                ("GIGA-4060TI-8G", "Gigabyte RTX 4060 Ti Gaming OC 8GB", 11490000m, 12490000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "vga-card-man-hinh",
            BrandSlug = "nvidia",
            Name = "VGA ASUS Dual GeForce RTX 4060 OC Edition 8GB",
            Slug = "vga-asus-dual-geforce-rtx-4060",
            ShortDesc = "Thiết kế nhỏ gọn 2 quạt, công nghệ 0dB tĩnh lặng, hiệu suất tiết kiệm điện.",
            Desc = "Lựa chọn quốc dân cho các dàn máy tính gaming nhỏ gọn hoặc thùng máy Micro-ATX.",
            BasePrice = 8490000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
            Specs = new() { { "vram", "8GB GDDR6" }, { "bus_width", "128-bit" }, { "power_consumption", "550W" } },
            Variants = new()
            {
                ("ASUS-DUAL-4060", "ASUS Dual RTX 4060 OC 8GB", 8490000m, 8990000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "vga-card-man-hinh",
            BrandSlug = "amd",
            Name = "VGA PowerColor Hellhound AMD Radeon RX 7900 XTX 24GB",
            Slug = "vga-powercolor-hellhound-radeon-rx-7900-xtx",
            ShortDesc = "Kiến trúc RDNA 3 chiplet, 24GB GDDR6, đèn LED thạch anh xanh băng độc đáo.",
            Desc = "Sức mạnh rasterization hàng đầu cho trải nghiệm gaming 4K với dung lượng bộ nhớ VRAM khổng lồ.",
            BasePrice = 27990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
            Specs = new() { { "vram", "24GB GDDR6X" }, { "bus_width", "384-bit" }, { "power_consumption", "850W" } },
            Variants = new()
            {
                ("AMD-7900XTX-24G", "PowerColor Radeon RX 7900 XTX 24GB", 27990000m, 29990000m, new() { { "color", "Xanh Ice Blue" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 10. RAM - BỘ NHỚ TRONG (5 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "ram-bo-nho-trong",
            BrandSlug = "corsair",
            Name = "RAM Corsair Dominator Titanium RGB 32GB (2x16GB) DDR5 6000MHz",
            Slug = "ram-corsair-dominator-titanium-rgb-32gb-ddr5",
            ShortDesc = "Thiết kế đỉnh cao có thể tháo rời thanh trên, LED CAPELLIX rực rỡ, chip nhớ tuyển chọn.",
            Desc = "Dòng RAM cao cấp bậc nhất của Corsair với khả năng tản nhiệt bằng công nghệ DHX độc quyền.",
            BasePrice = 4490000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
            Specs = new() { { "type", "DDR5" }, { "bus_speed", "6000MHz" }, { "capacity", "32GB (2x16GB)" } },
            Variants = new()
            {
                ("COR-DOM-32G-BLK", "Corsair Dominator Titanium 32GB 6000MHz Đen", 4490000m, 4890000m, new() { { "color", "Đen" } }),
                ("COR-DOM-32G-WHT", "Corsair Dominator Titanium 32GB 6000MHz Trắng", 4490000m, 4890000m, new() { { "color", "Trắng" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ram-bo-nho-trong",
            BrandSlug = "corsair",
            Name = "RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 5600MHz",
            Slug = "ram-corsair-vengeance-rgb-32gb-ddr5",
            ShortDesc = "Dải LED RGB 10 vùng dynamic, tối ưu cho bo mạch chủ Intel XMP 3.0 và AMD EXPO.",
            Desc = "Thanh RAM hiệu năng cao tương thích rộng rãi với hầu hết các tản nhiệt khí hiện nay.",
            BasePrice = 3290000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
            Specs = new() { { "type", "DDR5" }, { "bus_speed", "5600MHz" }, { "capacity", "32GB (2x16GB)" } },
            Variants = new()
            {
                ("COR-VEN-32G-BLK", "Corsair Vengeance RGB 32GB 5600MHz Đen", 3290000m, 3590000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ram-bo-nho-trong",
            BrandSlug = "kingston",
            Name = "RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz",
            Slug = "ram-kingston-fury-beast-rgb-32gb-ddr5",
            ShortDesc = "Tản nhiệt nhôm cá tính, công nghệ đồng bộ hồng ngoại Kingston FURY Infrared Sync.",
            Desc = "Sự ổn định đáng tin cậy đã được kiểm tra 100% tốc độ thực tế tại nhà máy.",
            BasePrice = 3190000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
            Specs = new() { { "type", "DDR5" }, { "bus_speed", "5600MHz" }, { "capacity", "32GB (2x16GB)" } },
            Variants = new()
            {
                ("KNG-BEAST-32G", "Kingston FURY Beast RGB 32GB 5600MHz", 3190000m, 3490000m, new() { { "color", "Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ram-bo-nho-trong",
            BrandSlug = "kingston",
            Name = "RAM Kingston FURY Renegade 64GB (2x32GB) DDR5 6400MHz",
            Slug = "ram-kingston-fury-renegade-64gb-ddr5",
            ShortDesc = "Tốc độ cực nhanh 6400MHz CL32, dung lượng khủng 64GB cho máy trạm Workstation.",
            Desc = "Tối đa hóa hiệu năng xử lý đa luồng, máy ảo và dựng hình 3D dung lượng lớn.",
            BasePrice = 6290000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
            Specs = new() { { "type", "DDR5" }, { "bus_speed", "6400MHz" }, { "capacity", "64GB (2x32GB)" } },
            Variants = new()
            {
                ("KNG-REN-64G", "Kingston FURY Renegade 64GB 6400MHz", 6290000m, 6890000m, new() { { "color", "Bạc Đen" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "ram-bo-nho-trong",
            BrandSlug = "corsair",
            Name = "RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz",
            Slug = "ram-corsair-vengeance-lpx-16gb-ddr4",
            ShortDesc = "Cấu hình thấp Low-profile phù hợp mọi case máy, tản nhiệt nhôm tinh khiết.",
            Desc = "Thanh RAM DDR4 quốc dân bền bỉ phục vụ nâng cấp máy tính văn phòng và dàn máy gaming tiết kiệm.",
            BasePrice = 1190000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
            Specs = new() { { "type", "DDR4" }, { "bus_speed", "3200MHz" }, { "capacity", "16GB (2x8GB)" } },
            Variants = new()
            {
                ("COR-LPX-16G", "Corsair Vengeance LPX 16GB (2x8GB) DDR4", 1190000m, 1390000m, new() { { "color", "Đen" } })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 11. Ổ CỨNG SSD (5 sản phẩm)
        // ═══════════════════════════════════════════════════════════════
        list.Add(new ProductSeedModel
        {
            CatSlug = "o-cung-ssd",
            BrandSlug = "samsung",
            Name = "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 2TB",
            Slug = "ssd-samsung-990-pro-2tb",
            ShortDesc = "Tốc độ đọc tuần tự 7450 MB/s, ghi 6900 MB/s, kiểm soát nhiệt thông minh Dynamic Thermal Guard.",
            Desc = "Ổ cứng NVMe PCIe 4.0 đỉnh cao nhất hiện nay, tăng tốc load game tức thì và giải phóng toàn bộ tiềm năng của PC & PS5.",
            BasePrice = 4890000m,
            IsFeatured = true,
            ImageUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
            Specs = new() { { "form_factor", "M.2 NVMe PCIe 4.0" }, { "capacity", "2TB" }, { "read_speed", "Lên đến 7450 MB/s" } },
            Variants = new()
            {
                ("SAM-990P-2TB", "Samsung 990 PRO NVMe M.2 2TB", 4890000m, 5290000m, new() { { "capacity", "2TB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "o-cung-ssd",
            BrandSlug = "samsung",
            Name = "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 1TB",
            Slug = "ssd-samsung-990-pro-1tb",
            ShortDesc = "Tốc độ đọc 7450 MB/s, ghi 6900 MB/s, tuổi thọ bền bỉ 600 TBW.",
            Desc = "Lựa chọn hoàn hảo để cài đặt hệ điều hành và các ứng dụng đồ họa chuyên nghiệp.",
            BasePrice = 2890000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
            Specs = new() { { "form_factor", "M.2 NVMe PCIe 4.0" }, { "capacity", "1TB" }, { "read_speed", "Lên đến 7450 MB/s" } },
            Variants = new()
            {
                ("SAM-990P-1TB", "Samsung 990 PRO NVMe M.2 1TB", 2890000m, 3190000m, new() { { "capacity", "1TB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "o-cung-ssd",
            BrandSlug = "kingston",
            Name = "Ổ cứng SSD Kingston KC3000 M.2 NVMe PCIe 4.0 1TB",
            Slug = "ssd-kingston-kc3000-1tb",
            ShortDesc = "Bộ điều khiển Phison E18, chip nhớ 3D TLC NAND, tốc độ đọc 7000 MB/s.",
            Desc = "Tấm tản nhiệt nhôm graphene mỏng nhẹ cho phép lắp đặt dễ dàng trên cả laptop và bo mạch chủ máy bàn.",
            BasePrice = 2390000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
            Specs = new() { { "form_factor", "M.2 NVMe PCIe 4.0" }, { "capacity", "1TB" }, { "read_speed", "Lên đến 7450 MB/s" } },
            Variants = new()
            {
                ("KNG-KC3000-1TB", "Kingston KC3000 NVMe M.2 1TB", 2390000m, 2690000m, new() { { "capacity", "1TB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "o-cung-ssd",
            BrandSlug = "kingston",
            Name = "Ổ cứng SSD Kingston NV2 M.2 NVMe PCIe 4.0 500GB",
            Slug = "ssd-kingston-nv2-500gb",
            ShortDesc = "Tốc độ đọc 3500 MB/s, ghi 2100 MB/s, giá thành dễ tiếp cận.",
            Desc = "Giải pháp nâng cấp dung lượng lưu trữ tốc độ cao giá rẻ hàng đầu thị trường.",
            BasePrice = 1190000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
            Specs = new() { { "form_factor", "M.2 NVMe PCIe 4.0" }, { "capacity", "500GB" }, { "read_speed", "Lên đến 3500 MB/s" } },
            Variants = new()
            {
                ("KNG-NV2-500GB", "Kingston NV2 NVMe M.2 500GB", 1190000m, 1390000m, new() { { "capacity", "500GB" } })
            }
        });

        list.Add(new ProductSeedModel
        {
            CatSlug = "o-cung-ssd",
            BrandSlug = "kingston",
            Name = "Ổ cứng SSD Crucial T700 M.2 NVMe PCIe 5.0 2TB",
            Slug = "ssd-crucial-t700-2tb-pcie-5",
            ShortDesc = "Kỷ nguyên PCIe Gen 5 tốc độ khủng khiếp 12400 MB/s đọc, tản nhiệt nhôm cao cấp.",
            Desc = "Tốc độ đọc ghi nhanh gấp đôi chuẩn PCIe 4.0, thiết kế dành cho các dàn máy tính cao cấp thế hệ mới nhất.",
            BasePrice = 7990000m,
            IsFeatured = false,
            ImageUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
            Specs = new() { { "form_factor", "M.2 NVMe PCIe 5.0" }, { "capacity", "2TB" }, { "read_speed", "Lên đến 12400 MB/s" } },
            Variants = new()
            {
                ("CRU-T700-2TB", "Crucial T700 PCIe 5.0 2TB Heatsink", 7990000m, 8690000m, new() { { "capacity", "2TB" } })
            }
        });

        return list;
    }

    private static async Task<Dictionary<string, Role>> SeedRolesAndPermissionsAsync(AppDbContext context, ILogger? logger)
    {
        var existingRoles = await context.Roles.ToDictionaryAsync(r => r.Name);
        var existingPermissions = await context.Permissions.ToDictionaryAsync(p => p.Code);

        // Define system permissions matching PLAN.md matrix
        var permissionDefs = new[]
        {
            new { Code = "catalog.view", Module = "Catalog", Desc = "Xem danh mục và sản phẩm" },
            new { Code = "catalog.manage", Module = "Catalog", Desc = "Tạo, sửa, xóa danh mục và sản phẩm, quản lý giá" },
            new { Code = "order.view", Module = "Order", Desc = "Xem danh sách và chi tiết đơn hàng" },
            new { Code = "order.manage", Module = "Order", Desc = "Cập nhật trạng thái và xử lý đơn hàng" },
            new { Code = "order.refund", Module = "Order", Desc = "Xử lý đổi trả và hoàn tiền" },
            new { Code = "discount.manage", Module = "Discount", Desc = "Quản lý mã giảm giá" },
            new { Code = "inventory.view", Module = "Inventory", Desc = "Xem tồn kho sản phẩm" },
            new { Code = "inventory.manage", Module = "Inventory", Desc = "Nhập xuất, kiểm kho và điều chỉnh tồn kho" },
            new { Code = "user.view", Module = "User", Desc = "Xem thông tin người dùng" },
            new { Code = "user.manage", Module = "User", Desc = "Quản lý tài khoản và phân quyền người dùng" },
            new { Code = "audit.view", Module = "Audit", Desc = "Xem nhật ký kiểm toán hệ thống" },
            new { Code = "report.revenue", Module = "Report", Desc = "Xem báo cáo doanh thu" },
            new { Code = "report.inventory", Module = "Report", Desc = "Xem báo cáo tồn kho" },
            new { Code = "report.all", Module = "Report", Desc = "Xem toàn bộ báo cáo phân tích" }
        };

        var addedPermissions = false;
        foreach (var def in permissionDefs)
        {
            if (!existingPermissions.ContainsKey(def.Code))
            {
                var p = new Permission
                {
                    Id = Guid.NewGuid(),
                    Code = def.Code,
                    Module = def.Module,
                    Description = def.Desc,
                    CreatedAt = DateTime.UtcNow
                };
                context.Permissions.Add(p);
                existingPermissions[p.Code] = p;
                addedPermissions = true;
            }
        }

        if (addedPermissions)
        {
            await context.SaveChangesAsync();
        }

        // Define system roles according to PLAN.md matrix:
        // Customer: Xem catalog, tìm kiếm
        // Sales: Catalog.View, Order.View, Order.Manage, Order.Refund, Discount.Manage, Report.Revenue
        // Warehouse: Catalog.View, Order.View, Inventory.View, Inventory.Manage, Report.Inventory
        // Admin: Toàn quyền
        var roleDefs = new[]
        {
            new
            {
                Name = "Customer",
                Desc = "Khách hàng mua sắm mặc định",
                Permissions = new[] { "catalog.view" }
            },
            new
            {
                Name = "Sales",
                Desc = "Nhân viên bán hàng & chăm sóc khách hàng",
                Permissions = new[] { "catalog.view", "order.view", "order.manage", "order.refund", "discount.manage", "report.revenue" }
            },
            new
            {
                Name = "Warehouse",
                Desc = "Nhân viên kho vận & quản lý tồn kho",
                Permissions = new[] { "catalog.view", "order.view", "inventory.view", "inventory.manage", "report.inventory" }
            },
            new
            {
                Name = "Admin",
                Desc = "Quản trị viên toàn quyền hệ thống",
                Permissions = permissionDefs.Select(p => p.Code).ToArray()
            }
        };

        foreach (var rDef in roleDefs)
        {
            if (!existingRoles.TryGetValue(rDef.Name, out var role))
            {
                role = new Role
                {
                    Id = Guid.NewGuid(),
                    Name = rDef.Name,
                    Description = rDef.Desc,
                    CreatedAt = DateTime.UtcNow
                };
                context.Roles.Add(role);
                existingRoles[role.Name] = role;
                await context.SaveChangesAsync();
            }

            // Ensure role permissions are mapped
            var currentPermIds = await context.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var targetPermIds = rDef.Permissions
                .Where(code => existingPermissions.ContainsKey(code))
                .Select(code => existingPermissions[code].Id)
                .ToList();

            foreach (var permId in targetPermIds)
            {
                if (!currentPermIds.Contains(permId))
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        RoleId = role.Id,
                        PermissionId = permId
                    });
                }
            }
        }

        await context.SaveChangesAsync();
        logger?.LogInformation("Seeded {RoleCount} roles and permissions successfully.", existingRoles.Count);
        return existingRoles;
    }

    private static async Task SeedUsersAsync(AppDbContext context, Dictionary<string, Role> roleMap, ILogger? logger)
    {
        var existingUsers = await context.Users
            .Include(u => u.UserRoles)
            .ToDictionaryAsync(u => u.Email.ToLower());

        // 1. Default admin
        var adminEmail = "admin@madkstore.vn";
        if (!existingUsers.ContainsKey(adminEmail))
        {
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Email = adminEmail,
                FullName = "Quản Trị Viên Hệ Thống",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminPassword123!", 11),
                PhoneNumber = "0901234567",
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            if (roleMap.TryGetValue("Admin", out var adminRole))
            {
                adminUser.UserRoles.Add(new UserRole
                {
                    UserId = adminUser.Id,
                    RoleId = adminRole.Id,
                    User = adminUser,
                    Role = adminRole
                });
            }

            context.Users.Add(adminUser);
            logger?.LogInformation("Seeded default admin user: {Email}", adminEmail);
        }

        // 2. Default customer
        var customerEmail = "customer@madkstore.vn";
        if (!existingUsers.ContainsKey(customerEmail))
        {
            var customerUser = new User
            {
                Id = Guid.NewGuid(),
                Email = customerEmail,
                FullName = "Nguyễn Văn Khách",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CustomerPassword123!", 11),
                PhoneNumber = "0987654321",
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            if (roleMap.TryGetValue("Customer", out var customerRole))
            {
                customerUser.UserRoles.Add(new UserRole
                {
                    UserId = customerUser.Id,
                    RoleId = customerRole.Id,
                    User = customerUser,
                    Role = customerRole
                });
            }

            context.Users.Add(customerUser);
            logger?.LogInformation("Seeded default customer user: {Email}", customerEmail);
        }

        // 3. Default Sales
        var salesEmail = "sales@madkstore.vn";
        if (!existingUsers.ContainsKey(salesEmail))
        {
            var salesUser = new User
            {
                Id = Guid.NewGuid(),
                Email = salesEmail,
                FullName = "Nguyễn Thị Sales",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("SalesPassword123!", 11),
                PhoneNumber = "0912345678",
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            if (roleMap.TryGetValue("Sales", out var salesRole))
            {
                salesUser.UserRoles.Add(new UserRole
                {
                    UserId = salesUser.Id,
                    RoleId = salesRole.Id,
                    User = salesUser,
                    Role = salesRole
                });
            }

            context.Users.Add(salesUser);
            logger?.LogInformation("Seeded default sales user: {Email}", salesEmail);
        }

        // 4. Default Warehouse
        var warehouseEmail = "warehouse@madkstore.vn";
        if (!existingUsers.ContainsKey(warehouseEmail))
        {
            var warehouseUser = new User
            {
                Id = Guid.NewGuid(),
                Email = warehouseEmail,
                FullName = "Trần Văn Kho",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("WarehousePassword123!", 11),
                PhoneNumber = "0923456789",
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            if (roleMap.TryGetValue("Warehouse", out var warehouseRole))
            {
                warehouseUser.UserRoles.Add(new UserRole
                {
                    UserId = warehouseUser.Id,
                    RoleId = warehouseRole.Id,
                    User = warehouseUser,
                    Role = warehouseRole
                });
            }

            context.Users.Add(warehouseUser);
            logger?.LogInformation("Seeded default warehouse user: {Email}", warehouseEmail);
        }

        await context.SaveChangesAsync();
    }
}

