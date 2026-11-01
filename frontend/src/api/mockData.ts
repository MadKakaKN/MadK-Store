import {
  CategoryTreeDto,
  CategoryDetailDto,
  CategoryFiltersDto,
  BrandDto,
  ProductListDto,
  ProductDetailDto,
  PagedResult,
  ProductQueryParams,
} from '../types/catalog';

export const MOCK_CATEGORY_TREE: CategoryTreeDto[] = [
  {
    id: 'c-dien-thoai',
    name: 'Điện thoại & Tablet',
    slug: 'dien-thoai',
    description: 'Điện thoại thông minh, máy tính bảng và phụ kiện di động',
    iconUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80',
    displayOrder: 1,
    children: [
      {
        id: 'c-dien-thoai-thong-minh',
        name: 'Điện thoại thông minh',
        slug: 'dien-thoai-thong-minh',
        description: 'Smartphone cao cấp, tầm trung từ Apple, Samsung',
        iconUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&q=80',
        displayOrder: 1,
        children: [],
      },
      {
        id: 'c-may-tinh-bang',
        name: 'Máy tính bảng',
        slug: 'may-tinh-bang',
        description: 'iPad, Galaxy Tab phục vụ học tập và sáng tạo',
        iconUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80',
        displayOrder: 2,
        children: [],
      },
    ],
  },
  {
    id: 'c-laptop',
    name: 'Laptop & Máy tính xách tay',
    slug: 'laptop',
    description: 'Laptop gaming, văn phòng, đồ họa chính hãng',
    iconUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&q=80',
    displayOrder: 2,
    children: [
      {
        id: 'c-laptop-gaming',
        name: 'Laptop Gaming',
        slug: 'laptop-gaming',
        description: 'Máy tính xách tay cấu hình cao chuyên chơi game',
        iconUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&q=80',
        displayOrder: 1,
        children: [],
      },
      {
        id: 'c-laptop-van-phong',
        name: 'Laptop Văn phòng & Doanh nhân',
        slug: 'laptop-van-phong',
        description: 'Thiết kế mỏng nhẹ, pin lâu, màn hình chuẩn màu sắc',
        iconUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&q=80',
        displayOrder: 2,
        children: [],
      },
    ],
  },
  {
    id: 'c-phu-kien',
    name: 'Phụ kiện & Gaming Gear',
    slug: 'phu-kien',
    description: 'Bàn phím cơ, chuột gaming, tai nghe và phụ kiện công nghệ',
    iconUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&q=80',
    displayOrder: 3,
    children: [
      {
        id: 'c-ban-phim-co',
        name: 'Bàn phím cơ',
        slug: 'ban-phim-co',
        description: 'Bàn phím cơ Custom và Prebuilt cho gamer và lập trình viên',
        iconUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&q=80',
        displayOrder: 1,
        children: [],
      },
      {
        id: 'c-chuot-gaming',
        name: 'Chuột Gaming',
        slug: 'chuot-gaming',
        description: 'Chuột siêu nhẹ, mắt đọc chuẩn xác cao',
        iconUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&q=80',
        displayOrder: 2,
        children: [],
      },
      {
        id: 'c-tai-nghe',
        name: 'Tai nghe & Audio',
        slug: 'tai-nghe',
        description: 'Tai nghe không dây chống ồn chủ động và tai nghe gaming',
        iconUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80',
        displayOrder: 3,
        children: [],
      },
    ],
  },
  {
    id: 'c-linh-kien',
    name: 'Linh kiện PC',
    slug: 'linh-kien',
    description: 'CPU, VGA, RAM, SSD và linh kiện máy tính chất lượng cao',
    iconUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100&q=80',
    displayOrder: 4,
    children: [
      {
        id: 'c-cpu-vi-xu-ly',
        name: 'CPU - Vi xử lý',
        slug: 'cpu-vi-xu-ly',
        description: 'Bộ vi xử lý Intel Core thế hệ mới và AMD Ryzen',
        iconUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100&q=80',
        displayOrder: 1,
        children: [],
      },
      {
        id: 'c-vga-card-man-hinh',
        name: 'VGA - Card màn hình',
        slug: 'vga-card-man-hinh',
        description: 'Card đồ họa NVIDIA GeForce RTX và AMD Radeon',
        iconUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100&q=80',
        displayOrder: 2,
        children: [],
      },
      {
        id: 'c-ram-bo-nho-trong',
        name: 'RAM - Bộ nhớ trong',
        slug: 'ram-bo-nho-trong',
        description: 'Bộ nhớ RAM DDR4 và DDR5 hiệu năng cao',
        iconUrl: 'https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=100&q=80',
        displayOrder: 3,
        children: [],
      },
      {
        id: 'c-o-cung-ssd',
        name: 'Ổ cứng SSD',
        slug: 'o-cung-ssd',
        description: 'Ổ cứng thể rắn M.2 NVMe PCIe 4.0 và 5.0 tốc độ cao',
        iconUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=100&q=80',
        displayOrder: 4,
        children: [],
      },
    ],
  },
];

export const MOCK_BRANDS: BrandDto[] = [
  { id: 'b-apple', name: 'Apple', slug: 'apple', isActive: true },
  { id: 'b-samsung', name: 'Samsung', slug: 'samsung', isActive: true },
  { id: 'b-asus', name: 'ASUS', slug: 'asus', isActive: true },
  { id: 'b-dell', name: 'Dell', slug: 'dell', isActive: true },
  { id: 'b-lenovo', name: 'Lenovo', slug: 'lenovo', isActive: true },
  { id: 'b-acer', name: 'Acer', slug: 'acer', isActive: true },
  { id: 'b-logitech', name: 'Logitech', slug: 'logitech', isActive: true },
  { id: 'b-razer', name: 'Razer', slug: 'razer', isActive: true },
  { id: 'b-keychron', name: 'Keychron', slug: 'keychron', isActive: true },
  { id: 'b-sony', name: 'Sony', slug: 'sony', isActive: true },
  { id: 'b-intel', name: 'Intel', slug: 'intel', isActive: true },
  { id: 'b-amd', name: 'AMD', slug: 'amd', isActive: true },
  { id: 'b-nvidia', name: 'NVIDIA', slug: 'nvidia', isActive: true },
  { id: 'b-corsair', name: 'Corsair', slug: 'corsair', isActive: true },
  { id: 'b-kingston', name: 'Kingston', slug: 'kingston', isActive: true },
];

export const MOCK_PRODUCTS: ProductDetailDto[] = [
  {
    "id": "p-1",
    "name": "iPhone 15 Pro Max",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Khung titan siêu bền, chip Apple A17 Pro mạnh mẽ, camera tiềm vọng 5x.",
    "description": "<p>Khung titan siêu bền, chip Apple A17 Pro mạnh mẽ, camera tiềm vọng 5x.</p>",
    "specifications": "{}",
    "model3DUrl": "https://models.madkstore.vn/iphone-15-pro-max.glb",
    "thumbnailUrl": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
    "basePrice": 34990000,
    "isFeatured": true,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "iPhone 15 Pro Max Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 38489000,
        "salePrice": 34990000,
        "costPrice": 26242500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-1-1",
        "imageUrl": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
        "altText": "iPhone 15 Pro Max chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-2",
    "name": "iPhone 15 Pro",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Thiết kế titan nhỏ gọn 6.1 inch, camera chuyên nghiệp, nút Action tiện lợi.",
    "description": "<p>Thiết kế titan nhỏ gọn 6.1 inch, camera chuyên nghiệp, nút Action tiện lợi.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
    "basePrice": 28490000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "iPhone 15 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 31339000,
        "salePrice": 28490000,
        "costPrice": 21367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-2-1",
        "imageUrl": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
        "altText": "iPhone 15 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-3",
    "name": "iPhone 15",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Mặt lưng kính pha màu rực rỡ, Dynamic Island và camera 48MP.",
    "description": "<p>Mặt lưng kính pha màu rực rỡ, Dynamic Island và camera 48MP.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1695048065036-75f8546b14f8?w=600&q=80",
    "basePrice": 19990000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "iPhone 15 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 21989000,
        "salePrice": 19990000,
        "costPrice": 14992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-3-1",
        "imageUrl": "https://images.unsplash.com/photo-1695048065036-75f8546b14f8?w=600&q=80",
        "altText": "iPhone 15 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-4",
    "name": "iPhone 14",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Hiệu năng bền bỉ với chip A15 Bionic, thời lượng pin cả ngày.",
    "description": "<p>Hiệu năng bền bỉ với chip A15 Bionic, thời lượng pin cả ngày.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=600&q=80",
    "basePrice": 16990000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "iPhone 14 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 18689000,
        "salePrice": 16990000,
        "costPrice": 12742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-4-1",
        "imageUrl": "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=600&q=80",
        "altText": "iPhone 14 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-5",
    "name": "Samsung Galaxy S24 Ultra",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Galaxy AI quyền năng, bút S-Pen tích hợp, khung titan và camera 200MP zoom 100x.",
    "description": "<p>Galaxy AI quyền năng, bút S-Pen tích hợp, khung titan và camera 200MP zoom 100x.</p>",
    "specifications": "{}",
    "model3DUrl": "https://models.madkstore.vn/galaxy-s24-ultra.glb",
    "thumbnailUrl": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    "basePrice": 31990000,
    "isFeatured": true,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "Samsung Galaxy S24 Ultra Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 35189000,
        "salePrice": 31990000,
        "costPrice": 23992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-5-1",
        "imageUrl": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
        "altText": "Samsung Galaxy S24 Ultra chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-6",
    "name": "Samsung Galaxy S24 Plus",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Màn hình 6.7 inch QHD+ sắc nét, dung lượng pin 4900mAh cùng Galaxy AI tiện ích.",
    "description": "<p>Màn hình 6.7 inch QHD+ sắc nét, dung lượng pin 4900mAh cùng Galaxy AI tiện ích.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    "basePrice": 24990000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "Samsung Galaxy S24 Plus Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 27489000,
        "salePrice": 24990000,
        "costPrice": 18742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-6-1",
        "imageUrl": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
        "altText": "Samsung Galaxy S24 Plus chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-7",
    "name": "Samsung Galaxy S24",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Kích thước 6.2 inch nhỏ gọn, viền siêu mỏng, chip Exynos 2400 mạnh mẽ.",
    "description": "<p>Kích thước 6.2 inch nhỏ gọn, viền siêu mỏng, chip Exynos 2400 mạnh mẽ.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    "basePrice": 18990000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "Samsung Galaxy S24 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 20889000,
        "salePrice": 18990000,
        "costPrice": 14242500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-7-1",
        "imageUrl": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
        "altText": "Samsung Galaxy S24 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-8",
    "name": "Samsung Galaxy Z Fold5",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Bản lề Flex gập không kẽ hở, màn hình mở rộng 7.6 inch đa nhiệm mượt mà.",
    "description": "<p>Bản lề Flex gập không kẽ hở, màn hình mở rộng 7.6 inch đa nhiệm mượt mà.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
    "basePrice": 35990000,
    "isFeatured": true,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "Samsung Galaxy Z Fold5 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 39589000,
        "salePrice": 35990000,
        "costPrice": 26992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-8-1",
        "imageUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
        "altText": "Samsung Galaxy Z Fold5 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-9",
    "name": "Samsung Galaxy Z Flip5",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Màn hình ngoài Flex Window 3.4 inch độc đáo, thiết kế gập vỏ sò thời thượng.",
    "description": "<p>Màn hình ngoài Flex Window 3.4 inch độc đáo, thiết kế gập vỏ sò thời thượng.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
    "basePrice": 19990000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "Samsung Galaxy Z Flip5 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 21989000,
        "salePrice": 19990000,
        "costPrice": 14992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-9-1",
        "imageUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
        "altText": "Samsung Galaxy Z Flip5 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-10",
    "name": "Samsung Galaxy A55 5G",
    "slug": "dien-thoai-thong-minh",
    "shortDescription": "Khung kim loại sang trọng, camera chụp đêm sắc nét và bảo mật Samsung Knox.",
    "description": "<p>Khung kim loại sang trọng, camera chụp đêm sắc nét và bảo mật Samsung Knox.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
    "basePrice": 9690000,
    "isFeatured": false,
    "category": {
      "id": "c-dien-thoai-thong-minh",
      "name": "Điện thoại thông minh",
      "slug": "dien-thoai-thong-minh"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-dien-thoai-thong-minh-1",
        "sku": "DIEN-THOAI-THONG-MINH-STD",
        "name": "Samsung Galaxy A55 5G Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 10659000,
        "salePrice": 9690000,
        "costPrice": 7267500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-10-1",
        "imageUrl": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
        "altText": "Samsung Galaxy A55 5G chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-11",
    "name": "iPad Pro M4 11 inch",
    "slug": "may-tinh-bang",
    "shortDescription": "Màn hình OLED Ultra Retina XDR đột phá, chip Apple M4 siêu mỏng 5.3mm.",
    "description": "<p>Màn hình OLED Ultra Retina XDR đột phá, chip Apple M4 siêu mỏng 5.3mm.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    "basePrice": 28990000,
    "isFeatured": true,
    "category": {
      "id": "c-may-tinh-bang",
      "name": "Máy tính bảng",
      "slug": "may-tinh-bang"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-may-tinh-bang-1",
        "sku": "MAY-TINH-BANG-STD",
        "name": "iPad Pro M4 11 inch Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 31889000,
        "salePrice": 28990000,
        "costPrice": 21742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-11-1",
        "imageUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
        "altText": "iPad Pro M4 11 inch chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-12",
    "name": "iPad Pro M4 13 inch",
    "slug": "may-tinh-bang",
    "shortDescription": "Không gian hiển thị rộng rãi 13 inch, màn hình Tandem OLED cực đỉnh.",
    "description": "<p>Không gian hiển thị rộng rãi 13 inch, màn hình Tandem OLED cực đỉnh.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    "basePrice": 37990000,
    "isFeatured": false,
    "category": {
      "id": "c-may-tinh-bang",
      "name": "Máy tính bảng",
      "slug": "may-tinh-bang"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-may-tinh-bang-1",
        "sku": "MAY-TINH-BANG-STD",
        "name": "iPad Pro M4 13 inch Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 41789000,
        "salePrice": 37990000,
        "costPrice": 28492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-12-1",
        "imageUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
        "altText": "iPad Pro M4 13 inch chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-13",
    "name": "iPad Air M2 11 inch",
    "slug": "may-tinh-bang",
    "shortDescription": "Trang bị chip Apple M2 vượt trội, thiết kế thanh lịch nhiều sắc màu.",
    "description": "<p>Trang bị chip Apple M2 vượt trội, thiết kế thanh lịch nhiều sắc màu.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    "basePrice": 16990000,
    "isFeatured": false,
    "category": {
      "id": "c-may-tinh-bang",
      "name": "Máy tính bảng",
      "slug": "may-tinh-bang"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-may-tinh-bang-1",
        "sku": "MAY-TINH-BANG-STD",
        "name": "iPad Air M2 11 inch Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 18689000,
        "salePrice": 16990000,
        "costPrice": 12742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-13-1",
        "imageUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
        "altText": "iPad Air M2 11 inch chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-14",
    "name": "iPad Gen 10 10.9 inch",
    "slug": "may-tinh-bang",
    "shortDescription": "Thiết kế tràn viền mới, cổng sạc Type-C, camera đặt ngang thông minh.",
    "description": "<p>Thiết kế tràn viền mới, cổng sạc Type-C, camera đặt ngang thông minh.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    "basePrice": 9990000,
    "isFeatured": false,
    "category": {
      "id": "c-may-tinh-bang",
      "name": "Máy tính bảng",
      "slug": "may-tinh-bang"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-may-tinh-bang-1",
        "sku": "MAY-TINH-BANG-STD",
        "name": "iPad Gen 10 10.9 inch Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 10989000,
        "salePrice": 9990000,
        "costPrice": 7492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-14-1",
        "imageUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
        "altText": "iPad Gen 10 10.9 inch chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-15",
    "name": "Samsung Galaxy Tab S9 Ultra",
    "slug": "may-tinh-bang",
    "shortDescription": "Màn hình khổng lồ 14.6 inch Dynamic AMOLED 2X, chuẩn chống nước IP68.",
    "description": "<p>Màn hình khổng lồ 14.6 inch Dynamic AMOLED 2X, chuẩn chống nước IP68.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    "basePrice": 27990000,
    "isFeatured": false,
    "category": {
      "id": "c-may-tinh-bang",
      "name": "Máy tính bảng",
      "slug": "may-tinh-bang"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-may-tinh-bang-1",
        "sku": "MAY-TINH-BANG-STD",
        "name": "Samsung Galaxy Tab S9 Ultra Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 30789000,
        "salePrice": 27990000,
        "costPrice": 20992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-15-1",
        "imageUrl": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
        "altText": "Samsung Galaxy Tab S9 Ultra chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-16",
    "name": "ASUS ROG Strix SCAR 16 (2024)",
    "slug": "laptop-gaming",
    "shortDescription": "Quái thú gaming Intel Core i9-14900HX, RTX 4090, màn hình Mini LED 240Hz Nebula HDR.",
    "description": "<p>Quái thú gaming Intel Core i9-14900HX, RTX 4090, màn hình Mini LED 240Hz Nebula HDR.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 69990000,
    "isFeatured": true,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-asus",
      "name": "ASUS",
      "slug": "asus"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "ASUS ROG Strix SCAR 16 (2024) Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 76989000,
        "salePrice": 69990000,
        "costPrice": 52492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-16-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "ASUS ROG Strix SCAR 16 (2024) chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-17",
    "name": "ASUS ROG Zephyrus G16 OLED",
    "slug": "laptop-gaming",
    "shortDescription": "Mỏng nhẹ kim loại nguyên khối, màn hình ROG Nebula OLED 240Hz, RTX 4070.",
    "description": "<p>Mỏng nhẹ kim loại nguyên khối, màn hình ROG Nebula OLED 240Hz, RTX 4070.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 52990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-asus",
      "name": "ASUS",
      "slug": "asus"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "ASUS ROG Zephyrus G16 OLED Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 58289000,
        "salePrice": 52990000,
        "costPrice": 39742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-17-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "ASUS ROG Zephyrus G16 OLED chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-18",
    "name": "ASUS TUF Gaming A15",
    "slug": "laptop-gaming",
    "shortDescription": "Độ bền chuẩn quân đội MIL-STD-810H, AMD Ryzen 7 7735HS, RTX 4060 140W.",
    "description": "<p>Độ bền chuẩn quân đội MIL-STD-810H, AMD Ryzen 7 7735HS, RTX 4060 140W.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 24990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-asus",
      "name": "ASUS",
      "slug": "asus"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "ASUS TUF Gaming A15 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 27489000,
        "salePrice": 24990000,
        "costPrice": 18742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-18-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "ASUS TUF Gaming A15 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-19",
    "name": "Lenovo Legion Pro 7i Gen 9",
    "slug": "laptop-gaming",
    "shortDescription": "Sức mạnh AI Engine+ thông minh, chip i9-14900HX, card đồ họa RTX 4080.",
    "description": "<p>Sức mạnh AI Engine+ thông minh, chip i9-14900HX, card đồ họa RTX 4080.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 64990000,
    "isFeatured": true,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-lenovo",
      "name": "Lenovo",
      "slug": "lenovo"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "Lenovo Legion Pro 7i Gen 9 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 71489000,
        "salePrice": 64990000,
        "costPrice": 48742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-19-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "Lenovo Legion Pro 7i Gen 9 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-20",
    "name": "Lenovo Legion 5 Pro",
    "slug": "laptop-gaming",
    "shortDescription": "Màn hình tỉ lệ vàng 16:10 2.5K 165Hz chuẩn màu 100% sRGB, Ryzen 7, RTX 4070.",
    "description": "<p>Màn hình tỉ lệ vàng 16:10 2.5K 165Hz chuẩn màu 100% sRGB, Ryzen 7, RTX 4070.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 36990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-lenovo",
      "name": "Lenovo",
      "slug": "lenovo"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "Lenovo Legion 5 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 40689000,
        "salePrice": 36990000,
        "costPrice": 27742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-20-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "Lenovo Legion 5 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-21",
    "name": "Acer Predator Helios 16",
    "slug": "laptop-gaming",
    "shortDescription": "Quạt kim loại 3D AeroBlade thế hệ 5, Core i9-14900HX, RTX 4070.",
    "description": "<p>Quạt kim loại 3D AeroBlade thế hệ 5, Core i9-14900HX, RTX 4070.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 48990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-acer",
      "name": "Acer",
      "slug": "acer"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "Acer Predator Helios 16 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 53889000,
        "salePrice": 48990000,
        "costPrice": 36742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-21-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "Acer Predator Helios 16 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-22",
    "name": "Acer Nitro V 15",
    "slug": "laptop-gaming",
    "shortDescription": "Gaming thế hệ mới với Core i7-13620H, RTX 4060, màn hình 144Hz IPS.",
    "description": "<p>Gaming thế hệ mới với Core i7-13620H, RTX 4060, màn hình 144Hz IPS.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 19990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-acer",
      "name": "Acer",
      "slug": "acer"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "Acer Nitro V 15 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 21989000,
        "salePrice": 19990000,
        "costPrice": 14992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-22-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "Acer Nitro V 15 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-23",
    "name": "Dell Alienware m18 R2",
    "slug": "laptop-gaming",
    "shortDescription": "Kích thước khổng lồ 18 inch 240Hz QHD+, i9-14900HX, RTX 4090 175W max công suất.",
    "description": "<p>Kích thước khổng lồ 18 inch 240Hz QHD+, i9-14900HX, RTX 4090 175W max công suất.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
    "basePrice": 89990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-gaming",
      "name": "Laptop Gaming",
      "slug": "laptop-gaming"
    },
    "brand": {
      "id": "b-dell",
      "name": "Dell",
      "slug": "dell"
    },
    "variants": [
      {
        "id": "v-laptop-gaming-1",
        "sku": "LAPTOP-GAMING-STD",
        "name": "Dell Alienware m18 R2 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 98989000,
        "salePrice": 89990000,
        "costPrice": 67492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-23-1",
        "imageUrl": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80",
        "altText": "Dell Alienware m18 R2 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-24",
    "name": "MacBook Pro 16 M3 Max",
    "slug": "laptop-van-phong",
    "shortDescription": "Sức mạnh dựng phim 8K và AI đỉnh cao, màn hình Liquid Retina XDR 120Hz, pin 22 giờ.",
    "description": "<p>Sức mạnh dựng phim 8K và AI đỉnh cao, màn hình Liquid Retina XDR 120Hz, pin 22 giờ.</p>",
    "specifications": "{}",
    "model3DUrl": "https://models.madkstore.vn/macbook-pro-16.glb",
    "thumbnailUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    "basePrice": 89990000,
    "isFeatured": true,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "MacBook Pro 16 M3 Max Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 98989000,
        "salePrice": 89990000,
        "costPrice": 67492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-24-1",
        "imageUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
        "altText": "MacBook Pro 16 M3 Max chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-25",
    "name": "MacBook Pro 14 M3",
    "slug": "laptop-van-phong",
    "shortDescription": "Màn hình 14.2 inch ProMotion 120Hz, vỏ nhôm tái chế nguyên khối bền bỉ.",
    "description": "<p>Màn hình 14.2 inch ProMotion 120Hz, vỏ nhôm tái chế nguyên khối bền bỉ.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    "basePrice": 39990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "MacBook Pro 14 M3 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 43989000,
        "salePrice": 39990000,
        "costPrice": 29992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-25-1",
        "imageUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
        "altText": "MacBook Pro 14 M3 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-26",
    "name": "MacBook Air 13 M3",
    "slug": "laptop-van-phong",
    "shortDescription": "Siêu mỏng 11.3mm, nhẹ 1.24kg, hỗ trợ xuất 2 màn hình ngoài.",
    "description": "<p>Siêu mỏng 11.3mm, nhẹ 1.24kg, hỗ trợ xuất 2 màn hình ngoài.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
    "basePrice": 27990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "MacBook Air 13 M3 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 30789000,
        "salePrice": 27990000,
        "costPrice": 20992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-26-1",
        "imageUrl": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
        "altText": "MacBook Air 13 M3 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-27",
    "name": "MacBook Air 15 M3",
    "slug": "laptop-van-phong",
    "shortDescription": "Màn hình 15.3 inch rộng rãi trong thân hình siêu mỏng nhẹ chỉ 1.5kg.",
    "description": "<p>Màn hình 15.3 inch rộng rãi trong thân hình siêu mỏng nhẹ chỉ 1.5kg.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
    "basePrice": 32990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "MacBook Air 15 M3 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 36289000,
        "salePrice": 32990000,
        "costPrice": 24742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-27-1",
        "imageUrl": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
        "altText": "MacBook Air 15 M3 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-28",
    "name": "Dell XPS 13 Plus 9320",
    "slug": "laptop-van-phong",
    "shortDescription": "Bàn di chuột tàng hình bằng kính liền mạch, bàn phím tràn viền không khoảng cách.",
    "description": "<p>Bàn di chuột tàng hình bằng kính liền mạch, bàn phím tràn viền không khoảng cách.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
    "basePrice": 44990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-dell",
      "name": "Dell",
      "slug": "dell"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "Dell XPS 13 Plus 9320 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 49489000,
        "salePrice": 44990000,
        "costPrice": 33742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-28-1",
        "imageUrl": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
        "altText": "Dell XPS 13 Plus 9320 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-29",
    "name": "Dell Inspiron 14 5440",
    "slug": "laptop-van-phong",
    "shortDescription": "Bền bỉ, pin khỏe, màn hình 14 inch chống chói góc rộng cho dân văn phòng.",
    "description": "<p>Bền bỉ, pin khỏe, màn hình 14 inch chống chói góc rộng cho dân văn phòng.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
    "basePrice": 17990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-dell",
      "name": "Dell",
      "slug": "dell"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "Dell Inspiron 14 5440 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 19789000,
        "salePrice": 17990000,
        "costPrice": 13492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-29-1",
        "imageUrl": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
        "altText": "Dell Inspiron 14 5440 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-30",
    "name": "Lenovo ThinkPad X1 Carbon Gen 12",
    "slug": "laptop-van-phong",
    "shortDescription": "Vỏ sợi carbon siêu nhẹ 1.09kg, bàn phím gõ sướng nhất phân khúc, bảo mật doanh nghiệp.",
    "description": "<p>Vỏ sợi carbon siêu nhẹ 1.09kg, bàn phím gõ sướng nhất phân khúc, bảo mật doanh nghiệp.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
    "basePrice": 56990000,
    "isFeatured": true,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-lenovo",
      "name": "Lenovo",
      "slug": "lenovo"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "Lenovo ThinkPad X1 Carbon Gen 12 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 62689000,
        "salePrice": 56990000,
        "costPrice": 42742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-30-1",
        "imageUrl": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
        "altText": "Lenovo ThinkPad X1 Carbon Gen 12 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-31",
    "name": "ASUS Zenbook 14 OLED",
    "slug": "laptop-van-phong",
    "shortDescription": "Màn hình OLED 3K 120Hz rực rỡ, chip Intel Core Ultra 7 tích hợp NPU AI.",
    "description": "<p>Màn hình OLED 3K 120Hz rực rỡ, chip Intel Core Ultra 7 tích hợp NPU AI.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
    "basePrice": 28990000,
    "isFeatured": false,
    "category": {
      "id": "c-laptop-van-phong",
      "name": "Laptop Văn phòng & Doanh nhân",
      "slug": "laptop-van-phong"
    },
    "brand": {
      "id": "b-asus",
      "name": "ASUS",
      "slug": "asus"
    },
    "variants": [
      {
        "id": "v-laptop-van-phong-1",
        "sku": "LAPTOP-VAN-PHONG-STD",
        "name": "ASUS Zenbook 14 OLED Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 31889000,
        "salePrice": 28990000,
        "costPrice": 21742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-31-1",
        "imageUrl": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
        "altText": "ASUS Zenbook 14 OLED chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-32",
    "name": "Bàn phím cơ Keychron Q1 Pro Wireless",
    "slug": "ban-phim-co",
    "shortDescription": "Vỏ nhôm CNC 75%, gasket mount, kết nối Bluetooth 5.1 và keycap PBT doubleshot.",
    "description": "<p>Vỏ nhôm CNC 75%, gasket mount, kết nối Bluetooth 5.1 và keycap PBT doubleshot.</p>",
    "specifications": "{}",
    "model3DUrl": "https://models.madkstore.vn/keychron-q1-pro.glb",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    "basePrice": 4500000,
    "isFeatured": true,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-keychron",
      "name": "Keychron",
      "slug": "keychron"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Keychron Q1 Pro Wireless Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4950000,
        "salePrice": 4500000,
        "costPrice": 3375000,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-32-1",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        "altText": "Bàn phím cơ Keychron Q1 Pro Wireless chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-33",
    "name": "Bàn phím cơ Keychron V1 Max",
    "slug": "ban-phim-co",
    "shortDescription": "Layout 75%, 3 chế độ kết nối (2.4GHz/BT/Type-C), foam tiêu âm dày dặn.",
    "description": "<p>Layout 75%, 3 chế độ kết nối (2.4GHz/BT/Type-C), foam tiêu âm dày dặn.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    "basePrice": 2190000,
    "isFeatured": false,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-keychron",
      "name": "Keychron",
      "slug": "keychron"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Keychron V1 Max Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 2409000,
        "salePrice": 2190000,
        "costPrice": 1642500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-33-1",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        "altText": "Bàn phím cơ Keychron V1 Max chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-34",
    "name": "Bàn phím cơ Keychron K2 Pro",
    "slug": "ban-phim-co",
    "shortDescription": "Bản nâng cấp của K2 huyền thoại với hỗ trợ QMK/VIA và lót foam cách âm.",
    "description": "<p>Bản nâng cấp của K2 huyền thoại với hỗ trợ QMK/VIA và lót foam cách âm.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    "basePrice": 2490000,
    "isFeatured": false,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-keychron",
      "name": "Keychron",
      "slug": "keychron"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Keychron K2 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 2739000,
        "salePrice": 2490000,
        "costPrice": 1867500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-34-1",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        "altText": "Bàn phím cơ Keychron K2 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-35",
    "name": "Bàn phím cơ Keychron K8 Pro",
    "slug": "ban-phim-co",
    "shortDescription": "Layout TKL tiêu chuẩn, kết nối Bluetooth đa thiết bị, hotswap 5-pin.",
    "description": "<p>Layout TKL tiêu chuẩn, kết nối Bluetooth đa thiết bị, hotswap 5-pin.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    "basePrice": 2690000,
    "isFeatured": false,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-keychron",
      "name": "Keychron",
      "slug": "keychron"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Keychron K8 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 2959000,
        "salePrice": 2690000,
        "costPrice": 2017500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-35-1",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        "altText": "Bàn phím cơ Keychron K8 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-36",
    "name": "Bàn phím cơ Razer BlackWidow V4 Pro",
    "slug": "ban-phim-co",
    "shortDescription": "Switch cơ học Razer Green/Yellow, núm xoay Command Dial, đèn nền Chroma RGB 3 phía.",
    "description": "<p>Switch cơ học Razer Green/Yellow, núm xoay Command Dial, đèn nền Chroma RGB 3 phía.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
    "basePrice": 5490000,
    "isFeatured": true,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-razer",
      "name": "Razer",
      "slug": "razer"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Razer BlackWidow V4 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 6039000,
        "salePrice": 5490000,
        "costPrice": 4117500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-36-1",
        "imageUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
        "altText": "Bàn phím cơ Razer BlackWidow V4 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-37",
    "name": "Bàn phím cơ Razer Huntsman V3 Pro TKL",
    "slug": "ban-phim-co",
    "shortDescription": "Switch quang học Analog Gen-2, tính năng Rapid Trigger phản hồi tức thì.",
    "description": "<p>Switch quang học Analog Gen-2, tính năng Rapid Trigger phản hồi tức thì.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
    "basePrice": 5190000,
    "isFeatured": false,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-razer",
      "name": "Razer",
      "slug": "razer"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Razer Huntsman V3 Pro TKL Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 5709000,
        "salePrice": 5190000,
        "costPrice": 3892500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-37-1",
        "imageUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
        "altText": "Bàn phím cơ Razer Huntsman V3 Pro TKL chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-38",
    "name": "Bàn phím cơ Corsair K70 MAX RGB",
    "slug": "ban-phim-co",
    "shortDescription": "Switch từ tính CORSAIR MGX điều chỉnh điểm nhận lệnh từ 0.4mm đến 3.6mm.",
    "description": "<p>Switch từ tính CORSAIR MGX điều chỉnh điểm nhận lệnh từ 0.4mm đến 3.6mm.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    "basePrice": 4990000,
    "isFeatured": false,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Corsair K70 MAX RGB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 5489000,
        "salePrice": 4990000,
        "costPrice": 3742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-38-1",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        "altText": "Bàn phím cơ Corsair K70 MAX RGB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-39",
    "name": "Bàn phím cơ Corsair K65 PLUS WIRELESS",
    "slug": "ban-phim-co",
    "shortDescription": "Layout 75%, hotswap, switch Corsair MLX Red bôi trơn sẵn mượt mà.",
    "description": "<p>Layout 75%, hotswap, switch Corsair MLX Red bôi trơn sẵn mượt mà.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    "basePrice": 3890000,
    "isFeatured": false,
    "category": {
      "id": "c-ban-phim-co",
      "name": "Bàn phím cơ",
      "slug": "ban-phim-co"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-ban-phim-co-1",
        "sku": "BAN-PHIM-CO-STD",
        "name": "Bàn phím cơ Corsair K65 PLUS WIRELESS Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4279000,
        "salePrice": 3890000,
        "costPrice": 2917500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-39-1",
        "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        "altText": "Bàn phím cơ Corsair K65 PLUS WIRELESS chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-40",
    "name": "Chuột gaming Logitech G Pro X Superlight 2",
    "slug": "chuot-gaming",
    "shortDescription": "Siêu nhẹ 60g, cảm biến HERO 2 32000 DPI, switch lai quang học LIGHTFORCE.",
    "description": "<p>Siêu nhẹ 60g, cảm biến HERO 2 32000 DPI, switch lai quang học LIGHTFORCE.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 3890000,
    "isFeatured": true,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-logitech",
      "name": "Logitech",
      "slug": "logitech"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Logitech G Pro X Superlight 2 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4279000,
        "salePrice": 3890000,
        "costPrice": 2917500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-40-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Logitech G Pro X Superlight 2 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-41",
    "name": "Chuột gaming Logitech G502 X PLUS",
    "slug": "chuot-gaming",
    "shortDescription": "Huyền thoại tái sinh với switch lai LIGHTFORCE, LED LIGHTSYNC RGB 8 vùng.",
    "description": "<p>Huyền thoại tái sinh với switch lai LIGHTFORCE, LED LIGHTSYNC RGB 8 vùng.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 3290000,
    "isFeatured": false,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-logitech",
      "name": "Logitech",
      "slug": "logitech"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Logitech G502 X PLUS Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 3619000,
        "salePrice": 3290000,
        "costPrice": 2467500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-41-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Logitech G502 X PLUS chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-42",
    "name": "Chuột gaming Logitech G502 HERO High Performance",
    "slug": "chuot-gaming",
    "shortDescription": "Cảm biến HERO 25K, 11 nút lập trình, 5 tạ tùy chỉnh trọng lượng.",
    "description": "<p>Cảm biến HERO 25K, 11 nút lập trình, 5 tạ tùy chỉnh trọng lượng.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 990000,
    "isFeatured": false,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-logitech",
      "name": "Logitech",
      "slug": "logitech"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Logitech G502 HERO High Performance Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 1089000,
        "salePrice": 990000,
        "costPrice": 742500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-42-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Logitech G502 HERO High Performance chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-43",
    "name": "Chuột gaming Razer DeathAdder V3 Pro",
    "slug": "chuot-gaming",
    "shortDescription": "Form công thái học huyền thoại, siêu nhẹ 63g, cảm biến Focus Pro 30K.",
    "description": "<p>Form công thái học huyền thoại, siêu nhẹ 63g, cảm biến Focus Pro 30K.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 3690000,
    "isFeatured": true,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-razer",
      "name": "Razer",
      "slug": "razer"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Razer DeathAdder V3 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4059000,
        "salePrice": 3690000,
        "costPrice": 2767500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-43-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Razer DeathAdder V3 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-44",
    "name": "Chuột gaming Razer Viper V3 Pro",
    "slug": "chuot-gaming",
    "shortDescription": "Siêu nhẹ 54g, tần số phản hồi không dây True 8000Hz HyperPolling.",
    "description": "<p>Siêu nhẹ 54g, tần số phản hồi không dây True 8000Hz HyperPolling.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 4190000,
    "isFeatured": false,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-razer",
      "name": "Razer",
      "slug": "razer"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Razer Viper V3 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4609000,
        "salePrice": 4190000,
        "costPrice": 3142500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-44-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Razer Viper V3 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-45",
    "name": "Chuột gaming Razer Basilisk V3 Pro",
    "slug": "chuot-gaming",
    "shortDescription": "Con lăn Razer HyperScroll Tilt Wheel, LED Chroma 13 vùng, sạc không dây Qi.",
    "description": "<p>Con lăn Razer HyperScroll Tilt Wheel, LED Chroma 13 vùng, sạc không dây Qi.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 3890000,
    "isFeatured": false,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-razer",
      "name": "Razer",
      "slug": "razer"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Razer Basilisk V3 Pro Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4279000,
        "salePrice": 3890000,
        "costPrice": 2917500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-45-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Razer Basilisk V3 Pro chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-46",
    "name": "Chuột gaming Corsair Darkstar Wireless MMO",
    "slug": "chuot-gaming",
    "shortDescription": "15 nút lập trình, cụm phím sườn độc đáo, cảm biến Marksman 26000 DPI.",
    "description": "<p>15 nút lập trình, cụm phím sườn độc đáo, cảm biến Marksman 26000 DPI.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    "basePrice": 3590000,
    "isFeatured": false,
    "category": {
      "id": "c-chuot-gaming",
      "name": "Chuột Gaming",
      "slug": "chuot-gaming"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-chuot-gaming-1",
        "sku": "CHUOT-GAMING-STD",
        "name": "Chuột gaming Corsair Darkstar Wireless MMO Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 3949000,
        "salePrice": 3590000,
        "costPrice": 2692500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-46-1",
        "imageUrl": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        "altText": "Chuột gaming Corsair Darkstar Wireless MMO chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-47",
    "name": "Tai nghe chống ồn Sony WH-1000XM5",
    "slug": "tai-nghe",
    "shortDescription": "Chống ồn đỉnh cao Auto NC Optimizer, 8 microphone, driver carbon fiber 30mm.",
    "description": "<p>Chống ồn đỉnh cao Auto NC Optimizer, 8 microphone, driver carbon fiber 30mm.</p>",
    "specifications": "{}",
    "model3DUrl": "https://models.madkstore.vn/sony-wh-1000xm5.glb",
    "thumbnailUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    "basePrice": 8490000,
    "isFeatured": true,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-sony",
      "name": "Sony",
      "slug": "sony"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe chống ồn Sony WH-1000XM5 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 9339000,
        "salePrice": 8490000,
        "costPrice": 6367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-47-1",
        "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        "altText": "Tai nghe chống ồn Sony WH-1000XM5 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-48",
    "name": "Tai nghe True Wireless Sony WF-1000XM5",
    "slug": "tai-nghe",
    "shortDescription": "Chống ồn in-ear tốt nhất thị trường, chip V2 và QN2e, âm thanh Hi-Res LDAC.",
    "description": "<p>Chống ồn in-ear tốt nhất thị trường, chip V2 và QN2e, âm thanh Hi-Res LDAC.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    "basePrice": 5990000,
    "isFeatured": false,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-sony",
      "name": "Sony",
      "slug": "sony"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe True Wireless Sony WF-1000XM5 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 6589000,
        "salePrice": 5990000,
        "costPrice": 4492500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-48-1",
        "imageUrl": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
        "altText": "Tai nghe True Wireless Sony WF-1000XM5 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-49",
    "name": "Tai nghe Apple AirPods Max",
    "slug": "tai-nghe",
    "shortDescription": "Khung thép không gỉ bọc lưới knit-mesh, Spatial Audio cá nhân hóa, chip H1 kép.",
    "description": "<p>Khung thép không gỉ bọc lưới knit-mesh, Spatial Audio cá nhân hóa, chip H1 kép.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    "basePrice": 12490000,
    "isFeatured": true,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe Apple AirPods Max Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 13739000,
        "salePrice": 12490000,
        "costPrice": 9367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-49-1",
        "imageUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
        "altText": "Tai nghe Apple AirPods Max chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-50",
    "name": "Tai nghe Apple AirPods Pro 2 USB-C",
    "slug": "tai-nghe",
    "shortDescription": "Chip H2, chống ồn chủ động mạnh gấp đôi, kháng nước và bụi bẩn IP54.",
    "description": "<p>Chip H2, chống ồn chủ động mạnh gấp đôi, kháng nước và bụi bẩn IP54.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",
    "basePrice": 5490000,
    "isFeatured": false,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-apple",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe Apple AirPods Pro 2 USB-C Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 6039000,
        "salePrice": 5490000,
        "costPrice": 4117500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-50-1",
        "imageUrl": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",
        "altText": "Tai nghe Apple AirPods Pro 2 USB-C chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-51",
    "name": "Tai nghe gaming Logitech G PRO X 2 LIGHTSPEED",
    "slug": "tai-nghe",
    "shortDescription": "Màng loa Graphene 50mm đầu tiên trên thế giới, kết nối LIGHTSPEED, pin 50 giờ.",
    "description": "<p>Màng loa Graphene 50mm đầu tiên trên thế giới, kết nối LIGHTSPEED, pin 50 giờ.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    "basePrice": 5890000,
    "isFeatured": false,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-logitech",
      "name": "Logitech",
      "slug": "logitech"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe gaming Logitech G PRO X 2 LIGHTSPEED Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 6479000,
        "salePrice": 5890000,
        "costPrice": 4417500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-51-1",
        "imageUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
        "altText": "Tai nghe gaming Logitech G PRO X 2 LIGHTSPEED chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-52",
    "name": "Tai nghe gaming Razer BlackShark V2 Pro 2023",
    "slug": "tai-nghe",
    "shortDescription": "Mic Razer HyperClear Super Wideband, màng loa TriForce Titanium 50mm, pin 70 giờ.",
    "description": "<p>Mic Razer HyperClear Super Wideband, màng loa TriForce Titanium 50mm, pin 70 giờ.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    "basePrice": 4690000,
    "isFeatured": false,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-razer",
      "name": "Razer",
      "slug": "razer"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe gaming Razer BlackShark V2 Pro 2023 Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 5159000,
        "salePrice": 4690000,
        "costPrice": 3517500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-52-1",
        "imageUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
        "altText": "Tai nghe gaming Razer BlackShark V2 Pro 2023 chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-53",
    "name": "Tai nghe Corsair Virtuoso Pro Open Back",
    "slug": "tai-nghe",
    "shortDescription": "Thiết kế mở Open-Back, màng loa Graphene 50mm, âm trường tự nhiên rộng lớn.",
    "description": "<p>Thiết kế mở Open-Back, màng loa Graphene 50mm, âm trường tự nhiên rộng lớn.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    "basePrice": 4490000,
    "isFeatured": false,
    "category": {
      "id": "c-tai-nghe",
      "name": "Tai nghe & Audio",
      "slug": "tai-nghe"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-tai-nghe-1",
        "sku": "TAI-NGHE-STD",
        "name": "Tai nghe Corsair Virtuoso Pro Open Back Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4939000,
        "salePrice": 4490000,
        "costPrice": 3367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-53-1",
        "imageUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
        "altText": "Tai nghe Corsair Virtuoso Pro Open Back chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-54",
    "name": "CPU Intel Core i9-14900K",
    "slug": "cpu-vi-xu-ly",
    "shortDescription": "24 nhân 32 luồng, xung nhịp Turbo 6.0 GHz, socket LGA1700, hỗ trợ DDR4 & DDR5.",
    "description": "<p>24 nhân 32 luồng, xung nhịp Turbo 6.0 GHz, socket LGA1700, hỗ trợ DDR4 & DDR5.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
    "basePrice": 14990000,
    "isFeatured": true,
    "category": {
      "id": "c-cpu-vi-xu-ly",
      "name": "CPU - Vi xử lý",
      "slug": "cpu-vi-xu-ly"
    },
    "brand": {
      "id": "b-intel",
      "name": "Intel",
      "slug": "intel"
    },
    "variants": [
      {
        "id": "v-cpu-vi-xu-ly-1",
        "sku": "CPU-VI-XU-LY-STD",
        "name": "CPU Intel Core i9-14900K Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 16489000,
        "salePrice": 14990000,
        "costPrice": 11242500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-54-1",
        "imageUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
        "altText": "CPU Intel Core i9-14900K chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-55",
    "name": "CPU Intel Core i7-14700K",
    "slug": "cpu-vi-xu-ly",
    "shortDescription": "20 nhân 28 luồng (thêm 4 E-core), xung nhịp 5.6 GHz, lựa chọn toàn diện.",
    "description": "<p>20 nhân 28 luồng (thêm 4 E-core), xung nhịp 5.6 GHz, lựa chọn toàn diện.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
    "basePrice": 10890000,
    "isFeatured": false,
    "category": {
      "id": "c-cpu-vi-xu-ly",
      "name": "CPU - Vi xử lý",
      "slug": "cpu-vi-xu-ly"
    },
    "brand": {
      "id": "b-intel",
      "name": "Intel",
      "slug": "intel"
    },
    "variants": [
      {
        "id": "v-cpu-vi-xu-ly-1",
        "sku": "CPU-VI-XU-LY-STD",
        "name": "CPU Intel Core i7-14700K Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 11979000,
        "salePrice": 10890000,
        "costPrice": 8167500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-55-1",
        "imageUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
        "altText": "CPU Intel Core i7-14700K chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-56",
    "name": "CPU Intel Core i5-14600K",
    "slug": "cpu-vi-xu-ly",
    "shortDescription": "14 nhân 20 luồng, xung nhịp 5.3 GHz, vua phân khúc gaming tầm trung.",
    "description": "<p>14 nhân 20 luồng, xung nhịp 5.3 GHz, vua phân khúc gaming tầm trung.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
    "basePrice": 7890000,
    "isFeatured": false,
    "category": {
      "id": "c-cpu-vi-xu-ly",
      "name": "CPU - Vi xử lý",
      "slug": "cpu-vi-xu-ly"
    },
    "brand": {
      "id": "b-intel",
      "name": "Intel",
      "slug": "intel"
    },
    "variants": [
      {
        "id": "v-cpu-vi-xu-ly-1",
        "sku": "CPU-VI-XU-LY-STD",
        "name": "CPU Intel Core i5-14600K Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 8679000,
        "salePrice": 7890000,
        "costPrice": 5917500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-56-1",
        "imageUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
        "altText": "CPU Intel Core i5-14600K chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-57",
    "name": "CPU AMD Ryzen 9 7950X3D",
    "slug": "cpu-vi-xu-ly",
    "shortDescription": "16 nhân 32 luồng, công nghệ 3D V-Cache 144MB bộ nhớ đệm, socket AM5.",
    "description": "<p>16 nhân 32 luồng, công nghệ 3D V-Cache 144MB bộ nhớ đệm, socket AM5.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
    "basePrice": 16490000,
    "isFeatured": true,
    "category": {
      "id": "c-cpu-vi-xu-ly",
      "name": "CPU - Vi xử lý",
      "slug": "cpu-vi-xu-ly"
    },
    "brand": {
      "id": "b-amd",
      "name": "AMD",
      "slug": "amd"
    },
    "variants": [
      {
        "id": "v-cpu-vi-xu-ly-1",
        "sku": "CPU-VI-XU-LY-STD",
        "name": "CPU AMD Ryzen 9 7950X3D Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 18139000,
        "salePrice": 16490000,
        "costPrice": 12367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-57-1",
        "imageUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
        "altText": "CPU AMD Ryzen 9 7950X3D chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-58",
    "name": "CPU AMD Ryzen 7 7800X3D",
    "slug": "cpu-vi-xu-ly",
    "shortDescription": "8 nhân 16 luồng, 3D V-Cache 96MB, CPU chơi game tốt nhất thế giới.",
    "description": "<p>8 nhân 16 luồng, 3D V-Cache 96MB, CPU chơi game tốt nhất thế giới.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
    "basePrice": 10990000,
    "isFeatured": false,
    "category": {
      "id": "c-cpu-vi-xu-ly",
      "name": "CPU - Vi xử lý",
      "slug": "cpu-vi-xu-ly"
    },
    "brand": {
      "id": "b-amd",
      "name": "AMD",
      "slug": "amd"
    },
    "variants": [
      {
        "id": "v-cpu-vi-xu-ly-1",
        "sku": "CPU-VI-XU-LY-STD",
        "name": "CPU AMD Ryzen 7 7800X3D Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 12089000,
        "salePrice": 10990000,
        "costPrice": 8242500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-58-1",
        "imageUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
        "altText": "CPU AMD Ryzen 7 7800X3D chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-59",
    "name": "CPU AMD Ryzen 5 7600X",
    "slug": "cpu-vi-xu-ly",
    "shortDescription": "6 nhân 12 luồng, xung nhịp 5.3 GHz, socket AM5 nền tảng DDR5 bền vững.",
    "description": "<p>6 nhân 12 luồng, xung nhịp 5.3 GHz, socket AM5 nền tảng DDR5 bền vững.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
    "basePrice": 5790000,
    "isFeatured": false,
    "category": {
      "id": "c-cpu-vi-xu-ly",
      "name": "CPU - Vi xử lý",
      "slug": "cpu-vi-xu-ly"
    },
    "brand": {
      "id": "b-amd",
      "name": "AMD",
      "slug": "amd"
    },
    "variants": [
      {
        "id": "v-cpu-vi-xu-ly-1",
        "sku": "CPU-VI-XU-LY-STD",
        "name": "CPU AMD Ryzen 5 7600X Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 6369000,
        "salePrice": 5790000,
        "costPrice": 4342500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-59-1",
        "imageUrl": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
        "altText": "CPU AMD Ryzen 5 7600X chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-60",
    "name": "VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB",
    "slug": "vga-card-man-hinh",
    "shortDescription": "Kiến trúc Ada Lovelace, 24GB GDDR6X, khung kim loại đúc khuôn cứng cáp, buồng hơi tản nhiệt.",
    "description": "<p>Kiến trúc Ada Lovelace, 24GB GDDR6X, khung kim loại đúc khuôn cứng cáp, buồng hơi tản nhiệt.</p>",
    "specifications": "{}",
    "model3DUrl": "https://models.madkstore.vn/rtx-4090.glb",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    "basePrice": 58990000,
    "isFeatured": true,
    "category": {
      "id": "c-vga-card-man-hinh",
      "name": "VGA - Card màn hình",
      "slug": "vga-card-man-hinh"
    },
    "brand": {
      "id": "b-asus",
      "name": "ASUS",
      "slug": "asus"
    },
    "variants": [
      {
        "id": "v-vga-card-man-hinh-1",
        "sku": "VGA-CARD-MAN-HINH-STD",
        "name": "VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 64889000,
        "salePrice": 58990000,
        "costPrice": 44242500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-60-1",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        "altText": "VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-61",
    "name": "VGA ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB",
    "slug": "vga-card-man-hinh",
    "shortDescription": "Độ bền chuẩn quân sự, quạt vòng bi kép Axial-tech, 16GB GDDR6X.",
    "description": "<p>Độ bền chuẩn quân sự, quạt vòng bi kép Axial-tech, 16GB GDDR6X.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    "basePrice": 31990000,
    "isFeatured": false,
    "category": {
      "id": "c-vga-card-man-hinh",
      "name": "VGA - Card màn hình",
      "slug": "vga-card-man-hinh"
    },
    "brand": {
      "id": "b-asus",
      "name": "ASUS",
      "slug": "asus"
    },
    "variants": [
      {
        "id": "v-vga-card-man-hinh-1",
        "sku": "VGA-CARD-MAN-HINH-STD",
        "name": "VGA ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 35189000,
        "salePrice": 31990000,
        "costPrice": 23992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-61-1",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        "altText": "VGA ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-62",
    "name": "VGA MSI GeForce RTX 4070 Ti SUPER Gaming X Slim",
    "slug": "vga-card-man-hinh",
    "shortDescription": "Thiết kế mỏng nhẹ Slim, 16GB VRAM 256-bit, tản nhiệt TRI FROZR 3.",
    "description": "<p>Thiết kế mỏng nhẹ Slim, 16GB VRAM 256-bit, tản nhiệt TRI FROZR 3.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    "basePrice": 23990000,
    "isFeatured": false,
    "category": {
      "id": "c-vga-card-man-hinh",
      "name": "VGA - Card màn hình",
      "slug": "vga-card-man-hinh"
    },
    "brand": {
      "id": "b-nvidia",
      "name": "NVIDIA",
      "slug": "nvidia"
    },
    "variants": [
      {
        "id": "v-vga-card-man-hinh-1",
        "sku": "VGA-CARD-MAN-HINH-STD",
        "name": "VGA MSI GeForce RTX 4070 Ti SUPER Gaming X Slim Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 26389000,
        "salePrice": 23990000,
        "costPrice": 17992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-62-1",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        "altText": "VGA MSI GeForce RTX 4070 Ti SUPER Gaming X Slim chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-63",
    "name": "VGA Gigabyte GeForce RTX 4060 Ti Gaming OC 8GB",
    "slug": "vga-card-man-hinh",
    "shortDescription": "Hệ thống 3 quạt tản nhiệt WINDFORCE, ống đồng tiếp xúc trực tiếp, DLSS 3.",
    "description": "<p>Hệ thống 3 quạt tản nhiệt WINDFORCE, ống đồng tiếp xúc trực tiếp, DLSS 3.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    "basePrice": 11490000,
    "isFeatured": false,
    "category": {
      "id": "c-vga-card-man-hinh",
      "name": "VGA - Card màn hình",
      "slug": "vga-card-man-hinh"
    },
    "brand": {
      "id": "b-nvidia",
      "name": "NVIDIA",
      "slug": "nvidia"
    },
    "variants": [
      {
        "id": "v-vga-card-man-hinh-1",
        "sku": "VGA-CARD-MAN-HINH-STD",
        "name": "VGA Gigabyte GeForce RTX 4060 Ti Gaming OC 8GB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 12639000,
        "salePrice": 11490000,
        "costPrice": 8617500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-63-1",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        "altText": "VGA Gigabyte GeForce RTX 4060 Ti Gaming OC 8GB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-64",
    "name": "VGA ASUS Dual GeForce RTX 4060 OC Edition 8GB",
    "slug": "vga-card-man-hinh",
    "shortDescription": "Thiết kế nhỏ gọn 2 quạt, công nghệ 0dB tĩnh lặng, hiệu suất tiết kiệm điện.",
    "description": "<p>Thiết kế nhỏ gọn 2 quạt, công nghệ 0dB tĩnh lặng, hiệu suất tiết kiệm điện.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    "basePrice": 8490000,
    "isFeatured": false,
    "category": {
      "id": "c-vga-card-man-hinh",
      "name": "VGA - Card màn hình",
      "slug": "vga-card-man-hinh"
    },
    "brand": {
      "id": "b-nvidia",
      "name": "NVIDIA",
      "slug": "nvidia"
    },
    "variants": [
      {
        "id": "v-vga-card-man-hinh-1",
        "sku": "VGA-CARD-MAN-HINH-STD",
        "name": "VGA ASUS Dual GeForce RTX 4060 OC Edition 8GB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 9339000,
        "salePrice": 8490000,
        "costPrice": 6367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-64-1",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        "altText": "VGA ASUS Dual GeForce RTX 4060 OC Edition 8GB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-65",
    "name": "VGA PowerColor Hellhound AMD Radeon RX 7900 XTX 24GB",
    "slug": "vga-card-man-hinh",
    "shortDescription": "Kiến trúc RDNA 3 chiplet, 24GB GDDR6, đèn LED thạch anh xanh băng độc đáo.",
    "description": "<p>Kiến trúc RDNA 3 chiplet, 24GB GDDR6, đèn LED thạch anh xanh băng độc đáo.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    "basePrice": 27990000,
    "isFeatured": false,
    "category": {
      "id": "c-vga-card-man-hinh",
      "name": "VGA - Card màn hình",
      "slug": "vga-card-man-hinh"
    },
    "brand": {
      "id": "b-amd",
      "name": "AMD",
      "slug": "amd"
    },
    "variants": [
      {
        "id": "v-vga-card-man-hinh-1",
        "sku": "VGA-CARD-MAN-HINH-STD",
        "name": "VGA PowerColor Hellhound AMD Radeon RX 7900 XTX 24GB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 30789000,
        "salePrice": 27990000,
        "costPrice": 20992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-65-1",
        "imageUrl": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        "altText": "VGA PowerColor Hellhound AMD Radeon RX 7900 XTX 24GB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-66",
    "name": "RAM Corsair Dominator Titanium RGB 32GB (2x16GB) DDR5 6000MHz",
    "slug": "ram-bo-nho-trong",
    "shortDescription": "Thiết kế đỉnh cao có thể tháo rời thanh trên, LED CAPELLIX rực rỡ, chip nhớ tuyển chọn.",
    "description": "<p>Thiết kế đỉnh cao có thể tháo rời thanh trên, LED CAPELLIX rực rỡ, chip nhớ tuyển chọn.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
    "basePrice": 4490000,
    "isFeatured": true,
    "category": {
      "id": "c-ram-bo-nho-trong",
      "name": "RAM - Bộ nhớ trong",
      "slug": "ram-bo-nho-trong"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-ram-bo-nho-trong-1",
        "sku": "RAM-BO-NHO-TRONG-STD",
        "name": "RAM Corsair Dominator Titanium RGB 32GB (2x16GB) DDR5 6000MHz Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 4939000,
        "salePrice": 4490000,
        "costPrice": 3367500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-66-1",
        "imageUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
        "altText": "RAM Corsair Dominator Titanium RGB 32GB (2x16GB) DDR5 6000MHz chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-67",
    "name": "RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 5600MHz",
    "slug": "ram-bo-nho-trong",
    "shortDescription": "Dải LED RGB 10 vùng dynamic, tối ưu cho bo mạch chủ Intel XMP 3.0 và AMD EXPO.",
    "description": "<p>Dải LED RGB 10 vùng dynamic, tối ưu cho bo mạch chủ Intel XMP 3.0 và AMD EXPO.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
    "basePrice": 3290000,
    "isFeatured": false,
    "category": {
      "id": "c-ram-bo-nho-trong",
      "name": "RAM - Bộ nhớ trong",
      "slug": "ram-bo-nho-trong"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-ram-bo-nho-trong-1",
        "sku": "RAM-BO-NHO-TRONG-STD",
        "name": "RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 5600MHz Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 3619000,
        "salePrice": 3290000,
        "costPrice": 2467500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-67-1",
        "imageUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
        "altText": "RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 5600MHz chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-68",
    "name": "RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz",
    "slug": "ram-bo-nho-trong",
    "shortDescription": "Tản nhiệt nhôm cá tính, công nghệ đồng bộ hồng ngoại Kingston FURY Infrared Sync.",
    "description": "<p>Tản nhiệt nhôm cá tính, công nghệ đồng bộ hồng ngoại Kingston FURY Infrared Sync.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
    "basePrice": 3190000,
    "isFeatured": false,
    "category": {
      "id": "c-ram-bo-nho-trong",
      "name": "RAM - Bộ nhớ trong",
      "slug": "ram-bo-nho-trong"
    },
    "brand": {
      "id": "b-kingston",
      "name": "Kingston",
      "slug": "kingston"
    },
    "variants": [
      {
        "id": "v-ram-bo-nho-trong-1",
        "sku": "RAM-BO-NHO-TRONG-STD",
        "name": "RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 3509000,
        "salePrice": 3190000,
        "costPrice": 2392500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-68-1",
        "imageUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
        "altText": "RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-69",
    "name": "RAM Kingston FURY Renegade 64GB (2x32GB) DDR5 6400MHz",
    "slug": "ram-bo-nho-trong",
    "shortDescription": "Tốc độ cực nhanh 6400MHz CL32, dung lượng khủng 64GB cho máy trạm Workstation.",
    "description": "<p>Tốc độ cực nhanh 6400MHz CL32, dung lượng khủng 64GB cho máy trạm Workstation.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
    "basePrice": 6290000,
    "isFeatured": false,
    "category": {
      "id": "c-ram-bo-nho-trong",
      "name": "RAM - Bộ nhớ trong",
      "slug": "ram-bo-nho-trong"
    },
    "brand": {
      "id": "b-kingston",
      "name": "Kingston",
      "slug": "kingston"
    },
    "variants": [
      {
        "id": "v-ram-bo-nho-trong-1",
        "sku": "RAM-BO-NHO-TRONG-STD",
        "name": "RAM Kingston FURY Renegade 64GB (2x32GB) DDR5 6400MHz Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 6919000,
        "salePrice": 6290000,
        "costPrice": 4717500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-69-1",
        "imageUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
        "altText": "RAM Kingston FURY Renegade 64GB (2x32GB) DDR5 6400MHz chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-70",
    "name": "RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz",
    "slug": "ram-bo-nho-trong",
    "shortDescription": "Cấu hình thấp Low-profile phù hợp mọi case máy, tản nhiệt nhôm tinh khiết.",
    "description": "<p>Cấu hình thấp Low-profile phù hợp mọi case máy, tản nhiệt nhôm tinh khiết.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
    "basePrice": 1190000,
    "isFeatured": false,
    "category": {
      "id": "c-ram-bo-nho-trong",
      "name": "RAM - Bộ nhớ trong",
      "slug": "ram-bo-nho-trong"
    },
    "brand": {
      "id": "b-corsair",
      "name": "Corsair",
      "slug": "corsair"
    },
    "variants": [
      {
        "id": "v-ram-bo-nho-trong-1",
        "sku": "RAM-BO-NHO-TRONG-STD",
        "name": "RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 1309000,
        "salePrice": 1190000,
        "costPrice": 892500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-70-1",
        "imageUrl": "https://images.unsplash.com/photo-1541029074-12826c71c4c9?w=600&q=80",
        "altText": "RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-71",
    "name": "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 2TB",
    "slug": "o-cung-ssd",
    "shortDescription": "Tốc độ đọc tuần tự 7450 MB/s, ghi 6900 MB/s, kiểm soát nhiệt thông minh Dynamic Thermal Guard.",
    "description": "<p>Tốc độ đọc tuần tự 7450 MB/s, ghi 6900 MB/s, kiểm soát nhiệt thông minh Dynamic Thermal Guard.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
    "basePrice": 4890000,
    "isFeatured": true,
    "category": {
      "id": "c-o-cung-ssd",
      "name": "Ổ cứng SSD",
      "slug": "o-cung-ssd"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-o-cung-ssd-1",
        "sku": "O-CUNG-SSD-STD",
        "name": "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 2TB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 5379000,
        "salePrice": 4890000,
        "costPrice": 3667500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-71-1",
        "imageUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
        "altText": "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 2TB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-72",
    "name": "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 1TB",
    "slug": "o-cung-ssd",
    "shortDescription": "Tốc độ đọc 7450 MB/s, ghi 6900 MB/s, tuổi thọ bền bỉ 600 TBW.",
    "description": "<p>Tốc độ đọc 7450 MB/s, ghi 6900 MB/s, tuổi thọ bền bỉ 600 TBW.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
    "basePrice": 2890000,
    "isFeatured": false,
    "category": {
      "id": "c-o-cung-ssd",
      "name": "Ổ cứng SSD",
      "slug": "o-cung-ssd"
    },
    "brand": {
      "id": "b-samsung",
      "name": "Samsung",
      "slug": "samsung"
    },
    "variants": [
      {
        "id": "v-o-cung-ssd-1",
        "sku": "O-CUNG-SSD-STD",
        "name": "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 1TB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 3179000,
        "salePrice": 2890000,
        "costPrice": 2167500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-72-1",
        "imageUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
        "altText": "Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 1TB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-73",
    "name": "Ổ cứng SSD Kingston KC3000 M.2 NVMe PCIe 4.0 1TB",
    "slug": "o-cung-ssd",
    "shortDescription": "Bộ điều khiển Phison E18, chip nhớ 3D TLC NAND, tốc độ đọc 7000 MB/s.",
    "description": "<p>Bộ điều khiển Phison E18, chip nhớ 3D TLC NAND, tốc độ đọc 7000 MB/s.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
    "basePrice": 2390000,
    "isFeatured": false,
    "category": {
      "id": "c-o-cung-ssd",
      "name": "Ổ cứng SSD",
      "slug": "o-cung-ssd"
    },
    "brand": {
      "id": "b-kingston",
      "name": "Kingston",
      "slug": "kingston"
    },
    "variants": [
      {
        "id": "v-o-cung-ssd-1",
        "sku": "O-CUNG-SSD-STD",
        "name": "Ổ cứng SSD Kingston KC3000 M.2 NVMe PCIe 4.0 1TB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 2629000,
        "salePrice": 2390000,
        "costPrice": 1792500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-73-1",
        "imageUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
        "altText": "Ổ cứng SSD Kingston KC3000 M.2 NVMe PCIe 4.0 1TB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-74",
    "name": "Ổ cứng SSD Kingston NV2 M.2 NVMe PCIe 4.0 500GB",
    "slug": "o-cung-ssd",
    "shortDescription": "Tốc độ đọc 3500 MB/s, ghi 2100 MB/s, giá thành dễ tiếp cận.",
    "description": "<p>Tốc độ đọc 3500 MB/s, ghi 2100 MB/s, giá thành dễ tiếp cận.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
    "basePrice": 1190000,
    "isFeatured": false,
    "category": {
      "id": "c-o-cung-ssd",
      "name": "Ổ cứng SSD",
      "slug": "o-cung-ssd"
    },
    "brand": {
      "id": "b-kingston",
      "name": "Kingston",
      "slug": "kingston"
    },
    "variants": [
      {
        "id": "v-o-cung-ssd-1",
        "sku": "O-CUNG-SSD-STD",
        "name": "Ổ cứng SSD Kingston NV2 M.2 NVMe PCIe 4.0 500GB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 1309000,
        "salePrice": 1190000,
        "costPrice": 892500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-74-1",
        "imageUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
        "altText": "Ổ cứng SSD Kingston NV2 M.2 NVMe PCIe 4.0 500GB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  },
  {
    "id": "p-75",
    "name": "Ổ cứng SSD Crucial T700 M.2 NVMe PCIe 5.0 2TB",
    "slug": "o-cung-ssd",
    "shortDescription": "Kỷ nguyên PCIe Gen 5 tốc độ khủng khiếp 12400 MB/s đọc, tản nhiệt nhôm cao cấp.",
    "description": "<p>Kỷ nguyên PCIe Gen 5 tốc độ khủng khiếp 12400 MB/s đọc, tản nhiệt nhôm cao cấp.</p>",
    "specifications": "{}",
    "thumbnailUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
    "basePrice": 7990000,
    "isFeatured": false,
    "category": {
      "id": "c-o-cung-ssd",
      "name": "Ổ cứng SSD",
      "slug": "o-cung-ssd"
    },
    "brand": {
      "id": "b-kingston",
      "name": "Kingston",
      "slug": "kingston"
    },
    "variants": [
      {
        "id": "v-o-cung-ssd-1",
        "sku": "O-CUNG-SSD-STD",
        "name": "Ổ cứng SSD Crucial T700 M.2 NVMe PCIe 5.0 2TB Tiêu chuẩn",
        "attributes": "{\"version\":\"Tiêu chuẩn\"}",
        "originalPrice": 8789000,
        "salePrice": 7990000,
        "costPrice": 5992500,
        "isActive": true,
        "stockQuantity": 12,
        "images": []
      }
    ],
    "images": [
      {
        "id": "img-p-75-1",
        "imageUrl": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80",
        "altText": "Ổ cứng SSD Crucial T700 M.2 NVMe PCIe 5.0 2TB chính",
        "displayOrder": 1,
        "isPrimary": true
      }
    ]
  }
];

export function getMockProducts(params: ProductQueryParams = {}): PagedResult<ProductListDto> {
  let filtered = MOCK_PRODUCTS.map((p) => {
    let minPrice = p.basePrice;
    let maxPrice = p.basePrice;
    if (p.variants.length > 0) {
      const prices = p.variants.map((v) => v.salePrice);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      thumbnailUrl: p.thumbnailUrl,
      basePrice: p.basePrice,
      minPrice,
      maxPrice,
      model3DUrl: p.model3DUrl,
      categoryId: p.category.id,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      brandId: p.brand.id,
      brandName: p.brand.name,
      brandSlug: p.brand.slug,
      isFeatured: p.isFeatured,
      createdAt: '2026-10-11T12:00:00Z',
    };
  });

  if (params.categorySlug) {
    filtered = filtered.filter(
      (p) => p.categorySlug === params.categorySlug || p.categorySlug.startsWith(params.categorySlug!)
    );
  }

  if (params.brandSlug) {
    filtered = filtered.filter((p) => p.brandSlug === params.brandSlug);
  }

  if (params.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.basePrice >= params.minPrice!);
  }

  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.basePrice <= params.maxPrice!);
  }

  if (params.search) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (params.specs && Object.keys(params.specs).length > 0) {
    filtered = filtered.filter((p) => {
      const fullProd = MOCK_PRODUCTS.find((mp) => mp.id === p.id);
      if (!fullProd || !fullProd.specifications) return false;
      try {
        const specObj = JSON.parse(fullProd.specifications);
        for (const [key, val] of Object.entries(params.specs!)) {
          if (val && String(specObj[key]).toLowerCase() !== String(val).toLowerCase()) {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    });
  }

  if (params.sort === 'price_asc') {
    filtered.sort((a, b) => a.basePrice - b.basePrice);
  } else if (params.sort === 'price_desc') {
    filtered.sort((a, b) => b.basePrice - a.basePrice);
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export function getMockProductBySlug(slug: string): ProductDetailDto | null {
  const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return found || null;
}

export function getMockCategoryBySlug(slug: string): CategoryDetailDto | null {
  function findInTree(nodes: CategoryTreeDto[]): CategoryTreeDto | null {
    for (const node of nodes) {
      if (node.slug === slug) return node;
      if (node.children && node.children.length > 0) {
        const found = findInTree(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  const found = findInTree(MOCK_CATEGORY_TREE);
  if (!found) return null;

  return {
    id: found.id,
    name: found.name,
    slug: found.slug,
    description: found.description,
    iconUrl: found.iconUrl,
    displayOrder: found.displayOrder,
  };
}

export function getMockCategoryFilters(slug: string): CategoryFiltersDto {
  const cat = getMockCategoryBySlug(slug);
  const categoryId = cat?.id || 'all';
  const categoryName = cat?.name || 'Tất cả danh mục';
  const categorySlug = cat?.slug || slug;

  // Filter products matching this category
  const products = MOCK_PRODUCTS.filter((p) => {
    if (!slug || slug === 'all') return true;
    return p.category.slug === slug || p.category.slug.startsWith(slug);
  });

  // Calculate brand product counts
  const brandCountMap = new Map<string, number>();
  for (const p of products) {
    brandCountMap.set(p.brand.slug, (brandCountMap.get(p.brand.slug) || 0) + 1);
  }

  const brands = MOCK_BRANDS.filter((b) => brandCountMap.has(b.slug)).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    productCount: brandCountMap.get(b.slug) || 0,
  }));

  // Default spec filters based on category
  let specFilters = [
    { key: 'ram', label: 'RAM', options: ['8GB', '16GB', '32GB', '64GB'] },
    { key: 'storage', label: 'Bộ nhớ lưu trữ', options: ['256GB', '512GB', '1TB', '2TB'] },
  ];

  if (slug.includes('laptop')) {
    specFilters = [
      { key: 'cpu', label: 'Vi xử lý', options: ['Intel Core i7', 'Intel Core i9', 'Apple M3 Pro', 'Apple M3 Max'] },
      { key: 'ram', label: 'RAM', options: ['16GB', '32GB', '64GB'] },
      { key: 'storage', label: 'Ổ cứng SSD', options: ['512GB SSD', '1TB SSD', '2TB SSD'] },
    ];
  } else if (slug.includes('linh-kien') || slug.includes('vga')) {
    specFilters = [
      { key: 'vram', label: 'Dung lượng VRAM', options: ['8GB', '12GB', '16GB', '24GB'] },
      { key: 'power_consumption', label: 'Nguồn đề xuất', options: ['650W', '750W', '850W', '1000W'] },
    ];
  }

  return {
    categoryId,
    categoryName,
    categorySlug,
    brands: brands.length > 0 ? brands : MOCK_BRANDS.slice(0, 6).map((b) => ({ id: b.id, name: b.name, slug: b.slug, productCount: 1 })),
    priceRange: { minPrice: 0, maxPrice: 100000000 },
    specFilters,
  };
}
