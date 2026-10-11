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
    id: 'p-1',
    name: 'iPhone 15 Pro Max',
    slug: 'dien-thoai-iphone-15-pro-max',
    shortDescription: 'Khung titan siêu bền, chip Apple A17 Pro mạnh mẽ, camera tiềm vọng 5x.',
    description: 'iPhone 15 Pro Max là đỉnh cao công nghệ với khung vỏ titan hàng không vũ trụ siêu nhẹ và bền bỉ. Màn hình Super Retina XDR 6.7 inch với ProMotion 120Hz mượt mà.',
    specifications: JSON.stringify({ os: 'iOS', screen_size: '6.7 inch', refresh_rate: '120Hz', ram: '8GB', storage: '256GB', network: '5G' }),
    model3DUrl: 'https://models.madkstore.vn/iphone-15-pro-max.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
    basePrice: 34990000,
    isFeatured: true,
    category: { id: 'c-dien-thoai-thong-minh', name: 'Điện thoại thông minh', slug: 'dien-thoai-thong-minh' },
    brand: { id: 'b-apple', name: 'Apple', slug: 'apple' },
    variants: [
      { id: 'v-1', sku: 'IP15PM-256-NAT', name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', attributes: JSON.stringify({ color: 'Titan Tự Nhiên', storage: '256GB' }), originalPrice: 36990000, salePrice: 34990000, costPrice: 28000000, isActive: true, images: [] },
      { id: 'v-2', sku: 'IP15PM-512-BLU', name: 'iPhone 15 Pro Max 512GB Titan Xanh', attributes: JSON.stringify({ color: 'Titan Xanh', storage: '512GB' }), originalPrice: 41990000, salePrice: 39990000, costPrice: 32000000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-1', imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80', altText: 'iPhone 15 Pro Max Chính', displayOrder: 1, isPrimary: true },
      { id: 'img-2', imageUrl: 'https://images.unsplash.com/photo-1695048065036-75f8546b14f8?w=600&q=80', altText: 'iPhone 15 Pro Max Góc nghiêng', displayOrder: 2, isPrimary: false },
    ],
  },
  {
    id: 'p-2',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'dien-thoai-samsung-galaxy-s24-ultra',
    shortDescription: 'Galaxy AI quyền năng, bút S-Pen tích hợp, khung titan và camera 200MP zoom 100x.',
    description: 'Galaxy S24 Ultra mở ra kỷ nguyên mới với trí tuệ nhân tạo Galaxy AI, màn hình phẳng Dynamic AMOLED 2X 120Hz rực rỡ và kính chống chói Corning Gorilla Armor.',
    specifications: JSON.stringify({ os: 'Android', screen_size: '6.8 inch', refresh_rate: '120Hz', ram: '12GB', storage: '256GB', network: '5G' }),
    model3DUrl: 'https://models.madkstore.vn/galaxy-s24-ultra.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
    basePrice: 31990000,
    isFeatured: true,
    category: { id: 'c-dien-thoai-thong-minh', name: 'Điện thoại thông minh', slug: 'dien-thoai-thong-minh' },
    brand: { id: 'b-samsung', name: 'Samsung', slug: 'samsung' },
    variants: [
      { id: 'v-3', sku: 'S24U-256-GRY', name: 'Galaxy S24 Ultra 256GB Xám Titan', attributes: JSON.stringify({ color: 'Xám Titan', storage: '256GB' }), originalPrice: 33990000, salePrice: 31990000, costPrice: 25000000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-3', imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', altText: 'Galaxy S24 Ultra Chính', displayOrder: 1, isPrimary: true },
    ],
  },
  {
    id: 'p-3',
    name: 'MacBook Pro 16 M3 Max',
    slug: 'laptop-apple-macbook-pro-16-m3-max',
    shortDescription: 'Sức mạnh dựng phim 8K và AI đỉnh cao, màn hình Liquid Retina XDR 120Hz, pin 22 giờ.',
    description: 'Cỗ máy làm việc di động hoàn hảo nhất lịch sử Apple, xử lý các tác vụ render 3D và lập trình máy học nhẹ nhàng với chip M3 Max.',
    specifications: JSON.stringify({ cpu: 'Apple M3 Pro', ram: '32GB', storage: '1TB SSD', weight: 'Trên 1.5kg' }),
    model3DUrl: 'https://models.madkstore.vn/macbook-pro-16.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    basePrice: 89990000,
    isFeatured: true,
    category: { id: 'c-laptop-van-phong', name: 'Laptop Văn phòng & Doanh nhân', slug: 'laptop-van-phong' },
    brand: { id: 'b-apple', name: 'Apple', slug: 'apple' },
    variants: [
      { id: 'v-4', sku: 'MBP16-M3MAX-BLK', name: 'MacBook Pro 16 M3 Max 36GB/1TB Đen Không Gian', attributes: JSON.stringify({ color: 'Đen Không Gian', storage: '1TB SSD' }), originalPrice: 92990000, salePrice: 89990000, costPrice: 75000000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-4', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', altText: 'MacBook Pro 16 Chính', displayOrder: 1, isPrimary: true },
    ],
  },
  {
    id: 'p-4',
    name: 'ASUS ROG Strix SCAR 16 (2024)',
    slug: 'laptop-asus-rog-strix-scar-16',
    shortDescription: 'Quái thú gaming Intel Core i9-14900HX, RTX 4090, màn hình Mini LED 240Hz Nebula HDR.',
    description: 'Cỗ máy chiến game tối thượng dành cho game thủ Esports với hệ thống tản nhiệt ba quạt và keo tản nhiệt kim loại lỏng Conductonaut Extreme.',
    specifications: JSON.stringify({ cpu: 'Intel Core i9', gpu: 'RTX 4090', ram: '32GB', storage: '1TB SSD', screen: '16 inch 240Hz' }),
    thumbnailUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80',
    basePrice: 69990000,
    isFeatured: true,
    category: { id: 'c-laptop-gaming', name: 'Laptop Gaming', slug: 'laptop-gaming' },
    brand: { id: 'b-asus', name: 'ASUS', slug: 'asus' },
    variants: [
      { id: 'v-5', sku: 'SCAR16-4090', name: 'ROG Strix SCAR 16 i9/32GB/1TB/RTX4090', attributes: JSON.stringify({ color: 'Off Black', gpu: 'RTX 4090' }), originalPrice: 73990000, salePrice: 69990000, costPrice: 58000000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-5', imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80', altText: 'ROG Strix SCAR 16', displayOrder: 1, isPrimary: true },
    ],
  },
  {
    id: 'p-5',
    name: 'Bàn phím cơ Keychron Q1 Pro Wireless',
    slug: 'ban-phim-co-keychron-q1-pro-wireless',
    shortDescription: 'Vỏ nhôm CNC 75%, gasket mount, kết nối Bluetooth 5.1 và keycap PBT doubleshot.',
    description: 'Bàn phím cơ custom không dây cao cấp nhất của Keychron hỗ trợ phần mềm QMK/VIA tùy biến từng phím bấm.',
    specifications: JSON.stringify({ switch: 'Tactile', layout: '75%', connectivity: 'Không dây (Bluetooth/2.4G)', hotswap: 'Có' }),
    model3DUrl: 'https://models.madkstore.vn/keychron-q1-pro.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
    basePrice: 4500000,
    isFeatured: true,
    category: { id: 'c-ban-phim-co', name: 'Bàn phím cơ', slug: 'ban-phim-co' },
    brand: { id: 'b-keychron', name: 'Keychron', slug: 'keychron' },
    variants: [
      { id: 'v-6', sku: 'KQ1P-RED', name: 'Keychron Q1 Pro Red Switch', attributes: JSON.stringify({ switch: 'Linear Red', color: 'Carbon Black' }), originalPrice: 4800000, salePrice: 4500000, costPrice: 3500000, isActive: true, images: [] },
      { id: 'v-7', sku: 'KQ1P-BRN', name: 'Keychron Q1 Pro Brown Switch', attributes: JSON.stringify({ switch: 'Tactile Brown', color: 'Carbon Black' }), originalPrice: 4800000, salePrice: 4500000, costPrice: 3500000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-6', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80', altText: 'Keychron Q1 Pro', displayOrder: 1, isPrimary: true },
    ],
  },
  {
    id: 'p-6',
    name: 'Chuột gaming Logitech G Pro X Superlight 2',
    slug: 'chuot-gaming-logitech-g-pro-x-superlight-2',
    shortDescription: 'Siêu nhẹ 60g, cảm biến HERO 2 32000 DPI, switch lai quang học LIGHTFORCE.',
    description: 'Chuột thi đấu Esports được các tuyển thủ chuyên nghiệp toàn cầu tin dùng nhất.',
    specifications: JSON.stringify({ sensor: 'Optical HERO', weight: 'Siêu nhẹ (<63g)', connectivity: 'Không dây 2.4GHz' }),
    thumbnailUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
    basePrice: 3890000,
    isFeatured: true,
    category: { id: 'c-chuot-gaming', name: 'Chuột Gaming', slug: 'chuot-gaming' },
    brand: { id: 'b-logitech', name: 'Logitech', slug: 'logitech' },
    variants: [
      { id: 'v-8', sku: 'GPX2-WHT', name: 'Logitech G Pro X Superlight 2 Trắng', attributes: JSON.stringify({ color: 'Trắng' }), originalPrice: 4290000, salePrice: 3890000, costPrice: 2800000, isActive: true, images: [] },
      { id: 'v-9', sku: 'GPX2-BLK', name: 'Logitech G Pro X Superlight 2 Đen', attributes: JSON.stringify({ color: 'Đen' }), originalPrice: 4290000, salePrice: 3890000, costPrice: 2800000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-7', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80', altText: 'Logitech GPX2', displayOrder: 1, isPrimary: true },
    ],
  },
  {
    id: 'p-7',
    name: 'Tai nghe chống ồn Sony WH-1000XM5',
    slug: 'tai-nghe-sony-wh-1000xm5-wireless',
    shortDescription: 'Chống ồn đỉnh cao Auto NC Optimizer, 8 microphone, driver carbon fiber 30mm.',
    description: 'Chuẩn mực tai nghe chống ồn chủ động toàn cầu mang đến không gian tĩnh lặng tuyệt đối cho âm nhạc hi-res.',
    specifications: JSON.stringify({ type: 'Over-ear', anc: 'Có', battery: '20 - 30 giờ', connectivity: 'Bluetooth 5.3' }),
    model3DUrl: 'https://models.madkstore.vn/sony-wh-1000xm5.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    basePrice: 8490000,
    isFeatured: true,
    category: { id: 'c-tai-nghe', name: 'Tai nghe & Audio', slug: 'tai-nghe' },
    brand: { id: 'b-sony', name: 'Sony', slug: 'sony' },
    variants: [
      { id: 'v-10', sku: 'WH1000M5-BLK', name: 'Sony WH-1000XM5 Đen', attributes: JSON.stringify({ color: 'Đen' }), originalPrice: 8990000, salePrice: 8490000, costPrice: 6500000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-8', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', altText: 'Sony WH-1000XM5', displayOrder: 1, isPrimary: true },
    ],
  },
  {
    id: 'p-8',
    name: 'VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB',
    slug: 'vga-asus-rog-strix-geforce-rtx-4090',
    shortDescription: 'Kiến trúc Ada Lovelace, 24GB GDDR6X, khung kim loại đúc khuôn cứng cáp, buồng hơi tản nhiệt.',
    description: 'Chiếc card đồ họa mạnh mẽ và hầm hố nhất thế giới, sẵn sàng cân mọi tựa game 4K Ray Tracing và huấn luyện mô hình AI.',
    specifications: JSON.stringify({ vram: '24GB GDDR6X', bus_width: '384-bit', power_consumption: '1000W' }),
    model3DUrl: 'https://models.madkstore.vn/rtx-4090.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80',
    basePrice: 58990000,
    isFeatured: true,
    category: { id: 'c-vga-card-man-hinh', name: 'VGA - Card màn hình', slug: 'vga-card-man-hinh' },
    brand: { id: 'b-asus', name: 'ASUS', slug: 'asus' },
    variants: [
      { id: 'v-11', sku: 'ROG-4090-24G', name: 'ASUS ROG Strix RTX 4090 OC Edition 24GB', attributes: JSON.stringify({ color: 'Đen RGB' }), originalPrice: 62990000, salePrice: 58990000, costPrice: 49000000, isActive: true, images: [] },
    ],
    images: [
      { id: 'img-9', imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80', altText: 'ROG Strix RTX 4090', displayOrder: 1, isPrimary: true },
    ],
  },
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
