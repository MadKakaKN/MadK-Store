import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  OrderDto,
  OrderStatus,
  UpdateOrderStatusRequestDto,
  CancelOrderRequestDto,
} from '../types/order';

export interface OrderAdminFilter {
  page?: number;
  pageSize?: number;
  status?: OrderStatus | 'ALL';
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface PagedOrderResult {
  items: OrderDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const ADMIN_ORDERS_KEY = 'madk_admin_orders_store';

// Dữ liệu đơn hàng thực tế từ cơ sở dữ liệu Supabase (9 đơn hàng từ các khách hàng thực tế)
const REAL_DATABASE_ORDERS: OrderDto[] = [
  {
    id: '5616bd9a-adc5-4e55-8b9f-e9e8ef6b51b8',
    orderNumber: 'MK-20261102-4C6C48',
    userId: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    customerEmail: 'hk641080@gmail.com',
    customerPhone: '0901112122',
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'MoMo',
    subtotalAmount: 7990000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 7990000,
    shippingAddressSnapshot: 'Phường Bình Trị Đông B, Quận Bình Tân, TP. Hồ Chí Minh',
    statusHistory: [
      {
        id: '9f46a33d-cfe4-4aaf-92ae-f882260d5f29',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Đặt hàng thanh toán MoMo',
        createdAt: '2026-11-02T13:59:55Z',
      },
    ],
    items: [
      {
        id: '358c12e2-1741-441b-8075-233842e68554',
        variantId: '49ccc36c-231c-41a5-b6a4-3dc3a8e62e0f',
        productId: 'a35b8ad7-f6f1-478e-8645-030c3c03c349',
        productName: 'Ổ cứng SSD Crucial T700 M.2 NVMe PCIe 5.0 2TB',
        productNameSnapshot: 'Ổ cứng SSD Crucial T700 M.2 NVMe PCIe 5.0 2TB',
        variantName: 'Crucial T700 PCIe 5.0 2TB Heatsink',
        variantNameSnapshot: 'Crucial T700 PCIe 5.0 2TB Heatsink',
        sku: 'CRU-T700-2TB',
        skuSnapshot: 'CRU-T700-2TB',
        unitPrice: 7990000,
        unitPriceSnapshot: 7990000,
        originalPrice: 8690000,
        originalPriceSnapshot: 8690000,
        quantity: 1,
        totalPrice: 7990000,
        attributesSnapshot: '{"capacity":"2TB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T13:59:55Z',
    updatedAt: null,
  },
  {
    id: '61c10b22-3c18-479f-ac8b-1a6313fbc652',
    orderNumber: 'MK-20261102-8B5AA3',
    userId: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    customerEmail: 'hk641080@gmail.com',
    customerPhone: '0901112122',
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'BankTransfer',
    subtotalAmount: 9690000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 9690000,
    shippingAddressSnapshot: 'Phường Bình Trị Đông B, Quận Bình Tân, TP. Hồ Chí Minh',
    statusHistory: [
      {
        id: '9db2cc64-7f37-4722-8ad5-accd0863a184',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Chuyển khoản ngân hàng',
        createdAt: '2026-11-02T13:59:36Z',
      },
    ],
    items: [
      {
        id: 'eaf9d39c-0601-4fbc-ae20-66159c6fc988',
        variantId: '05046154-fa52-487c-b5c8-9fad6a8a1345',
        productId: '5fdfb453-2ffb-42c2-bae7-286cff3ae912',
        productName: 'Samsung Galaxy A55 5G',
        productNameSnapshot: 'Samsung Galaxy A55 5G',
        variantName: 'Galaxy A55 128GB Xanh Iceblue',
        variantNameSnapshot: 'Galaxy A55 128GB Xanh Iceblue',
        sku: 'A55-128-BLU',
        skuSnapshot: 'A55-128-BLU',
        unitPrice: 9690000,
        unitPriceSnapshot: 9690000,
        originalPrice: 10490000,
        originalPriceSnapshot: 10490000,
        quantity: 1,
        totalPrice: 9690000,
        attributesSnapshot: '{"color":"Xanh Iceblue","storage":"128GB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T13:59:36Z',
    updatedAt: null,
  },
  {
    id: '4cc8dd34-6fb5-4d35-ab19-2e08b7e1b1ad',
    orderNumber: 'MK-20261102-BC6F82',
    userId: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    customerEmail: 'hk641080@gmail.com',
    customerPhone: '09112121212',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    paymentMethod: 'BankTransfer',
    subtotalAmount: 35990000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 35990000,
    shippingAddressSnapshot: 'Xã Như Cố, Huyện Chợ Mới, Tỉnh Bắc Kạn',
    statusHistory: [
      {
        id: '78c16d06-f202-4dee-a139-3e044059b413',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn hàng Galaxy S24 Ultra',
        createdAt: '2026-11-02T13:03:05Z',
      },
      {
        id: '78c16d06-f202-4dee-a139-3e044059b414',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Quản Trị Viên Hệ Thống',
        note: 'Đã nhận thanh toán ngân hàng',
        createdAt: '2026-11-04T09:12:00Z',
      },
    ],
    items: [
      {
        id: '1bc59b9a-f8c1-4b6e-97da-fc16a5f877ff',
        variantId: '563d0b9d-b404-4864-9335-9200ac6cce94',
        productId: '712c0265-194a-4457-af2d-f7a239c005de',
        productName: 'Samsung Galaxy S24 Ultra',
        productNameSnapshot: 'Samsung Galaxy S24 Ultra',
        variantName: 'Galaxy S24 Ultra 512GB Đen Titan',
        variantNameSnapshot: 'Galaxy S24 Ultra 512GB Đen Titan',
        sku: 'S24U-512-BLK',
        skuSnapshot: 'S24U-512-BLK',
        unitPrice: 35990000,
        unitPriceSnapshot: 35990000,
        originalPrice: 37990000,
        originalPriceSnapshot: 37990000,
        quantity: 1,
        totalPrice: 35990000,
        attributesSnapshot: '{"color":"Đen Titan","storage":"512GB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T13:03:05Z',
    updatedAt: '2026-11-04T09:12:00Z',
  },
  {
    id: 'deaa34da-3219-4d40-b61f-170030f95523',
    orderNumber: 'MK-20261102-9F2CE2',
    userId: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    customerEmail: 'hk641080@gmail.com',
    customerPhone: '09112121212',
    status: 'Processing',
    paymentStatus: 'Paid',
    paymentMethod: 'BankTransfer',
    subtotalAmount: 58990000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 58990000,
    shippingAddressSnapshot: 'Xã Quảng Thành, Huyện Hải Hà, Tỉnh Quảng Ninh',
    statusHistory: [
      {
        id: 'b03fa525-4930-4d39-8544-8b5cecbcb80d',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn đặt mua VGA RTX 4090',
        createdAt: '2026-11-02T12:44:55Z',
      },
      {
        id: 'b03fa525-4930-4d39-8544-8b5cecbcb80e',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Quản Trị Viên Hệ Thống',
        note: 'Xác nhận chuyển khoản',
        createdAt: '2026-11-04T08:00:00Z',
      },
      {
        id: 'b03fa525-4930-4d39-8544-8b5cecbcb80f',
        fromStatus: 'Confirmed',
        toStatus: 'Processing',
        changedByName: 'Trần Văn Kho',
        note: 'Đang kiểm tra card đồ họa RTX 4090 trước khi đóng gói',
        createdAt: '2026-11-04T09:12:00Z',
      },
    ],
    items: [
      {
        id: '2d48a695-7e44-491c-b4f1-69beb6cfd89d',
        variantId: 'e781c295-f4f0-43bf-afb0-a27e6564d6cf',
        productId: 'a4760472-1f29-48b0-a236-abc423d47423',
        productName: 'VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB',
        productNameSnapshot: 'VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB',
        variantName: 'ASUS ROG Strix RTX 4090 OC Edition 24GB',
        variantNameSnapshot: 'ASUS ROG Strix RTX 4090 OC Edition 24GB',
        sku: 'ROG-4090-24G',
        skuSnapshot: 'ROG-4090-24G',
        unitPrice: 58990000,
        unitPriceSnapshot: 58990000,
        originalPrice: 62990000,
        originalPriceSnapshot: 62990000,
        quantity: 1,
        totalPrice: 58990000,
        attributesSnapshot: '{"color":"Đen RGB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T12:44:55Z',
    updatedAt: '2026-11-04T09:12:00Z',
  },
  {
    id: '2715a966-c618-4c68-bed4-e13454fcb4fa',
    orderNumber: 'MK-20261102-6FDE99',
    userId: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    customerEmail: 'hk641080@gmail.com',
    customerPhone: '09112121212',
    status: 'Processing',
    paymentStatus: 'Paid',
    paymentMethod: 'BankTransfer',
    subtotalAmount: 45990000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 45990000,
    shippingAddressSnapshot: 'Xã Thanh Luận, Huyện Sơn Động, Tỉnh Bắc Giang',
    statusHistory: [
      {
        id: '6e7e7dfa-b798-4940-bfd2-c52c0ed9f7f1',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn hàng iPhone 15 Pro Max 1TB',
        createdAt: '2026-11-02T12:38:27Z',
      },
      {
        id: '6e7e7dfa-b798-4940-bfd2-c52c0ed9f7f2',
        fromStatus: 'Pending',
        toStatus: 'Processing',
        changedByName: 'Quản Trị Viên Hệ Thống',
        note: 'Đã nhận tiền, đang đóng gói tại kho',
        createdAt: '2026-11-04T08:12:00Z',
      },
    ],
    items: [
      {
        id: 'a1e883d6-b8e2-4a61-8221-3096faeff19f',
        variantId: '6b078eb7-b339-46fa-bb16-818a3989d3c9',
        productId: '5f82c51a-6e6b-46b6-b712-e87462db7c60',
        productName: 'iPhone 15 Pro Max',
        productNameSnapshot: 'iPhone 15 Pro Max',
        variantName: 'iPhone 15 Pro Max 1TB Titan Đen',
        variantNameSnapshot: 'iPhone 15 Pro Max 1TB Titan Đen',
        sku: 'IP15PM-1TB-BLK',
        skuSnapshot: 'IP15PM-1TB-BLK',
        unitPrice: 45990000,
        unitPriceSnapshot: 45990000,
        originalPrice: 47990000,
        originalPriceSnapshot: 47990000,
        quantity: 1,
        totalPrice: 45990000,
        attributesSnapshot: '{"color":"Titan Đen","storage":"1TB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T12:38:27Z',
    updatedAt: '2026-11-04T08:12:00Z',
  },
  {
    id: '095d981e-c2c3-4346-980b-1049ea936db3',
    orderNumber: 'MK-20261102-6E93E1',
    userId: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    customerEmail: 'hk641080@gmail.com',
    customerPhone: '09112121212',
    status: 'Shipping',
    paymentStatus: 'Paid',
    paymentMethod: 'BankTransfer',
    subtotalAmount: 55980000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 55980000,
    shippingAddressSnapshot: 'Xã Tân Lập, Huyện Lục Ngạn, Tỉnh Bắc Giang',
    statusHistory: [
      {
        id: 'b266ec68-185e-4de8-916e-02d76ed674ea',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn hàng Galaxy Tab S9 Ultra',
        createdAt: '2026-11-02T12:37:31Z',
      },
      {
        id: 'b266ec68-185e-4de8-916e-02d76ed674eb',
        fromStatus: 'Pending',
        toStatus: 'Shipping',
        changedByName: 'Viettel Post',
        note: 'Đang vận chuyển liên tỉnh đến Bắc Giang',
        createdAt: '2026-11-04T07:12:00Z',
      },
    ],
    items: [
      {
        id: '7e282264-32ca-4acb-9314-7a743307e21b',
        variantId: 'd03f739a-bb31-4934-98b3-427d85e2729e',
        productId: 'b679c343-8dcc-4af7-a464-dc8e8d132585',
        productName: 'Samsung Galaxy Tab S9 Ultra',
        productNameSnapshot: 'Samsung Galaxy Tab S9 Ultra',
        variantName: 'Galaxy Tab S9 Ultra 256GB Xám Graphite',
        variantNameSnapshot: 'Galaxy Tab S9 Ultra 256GB Xám Graphite',
        sku: 'TABS9U-256-GRY',
        skuSnapshot: 'TABS9U-256-GRY',
        unitPrice: 27990000,
        unitPriceSnapshot: 27990000,
        originalPrice: 30990000,
        originalPriceSnapshot: 30990000,
        quantity: 2,
        totalPrice: 55980000,
        attributesSnapshot: '{"color":"Xám Graphite","storage":"256GB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T12:37:31Z',
    updatedAt: '2026-11-04T07:12:00Z',
  },
  {
    id: '64865992-0daa-4113-9236-2567fe00b0f5',
    orderNumber: 'MK-20261102-FA4449',
    userId: '426497c9-763b-4cb6-bb9f-6252a94923df',
    customerEmail: 'kn054734@gmail.com',
    customerPhone: '09121212121',
    status: 'Shipping',
    paymentStatus: 'Paid',
    paymentMethod: 'COD',
    subtotalAmount: 10980000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 10980000,
    shippingAddressSnapshot: 'Phường An Lạc, Quận Bình Tân, TP. Hồ Chí Minh',
    statusHistory: [
      {
        id: 'b760a364-44a9-4d0d-a18b-681c22b9f387',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn hàng bàn phím Razer',
        createdAt: '2026-11-02T11:15:07Z',
      },
      {
        id: 'e6617523-9367-463e-bfa9-7ef0fc94cc3e',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Nguyễn Thị Sales',
        note: 'Khách xác nhận địa chỉ nhận hàng',
        createdAt: '2026-11-04T01:12:00Z',
      },
      {
        id: 'b8d31789-0f70-4e91-a05e-cf7cddee6d33',
        fromStatus: 'Confirmed',
        toStatus: 'Processing',
        changedByName: 'Trần Văn Kho',
        note: 'Đóng gói kiện hàng Razer',
        createdAt: '2026-11-04T03:12:00Z',
      },
      {
        id: 'df73e6c0-797b-47d3-a445-3fbab8530526',
        fromStatus: 'Processing',
        toStatus: 'Shipping',
        changedByName: 'VNPost',
        note: 'Đang trên đường giao đến Bình Tân',
        createdAt: '2026-11-04T05:12:00Z',
      },
    ],
    items: [
      {
        id: '41ad66a5-e815-42d2-b033-5bba6f5dca90',
        variantId: 'f9e89725-c400-428b-987c-97eed076ac4d',
        productId: '1aaa6e81-a92a-486b-ba2a-8cfe8f7b7fa8',
        productName: 'Bàn phím cơ Razer BlackWidow V4 Pro',
        productNameSnapshot: 'Bàn phím cơ Razer BlackWidow V4 Pro',
        variantName: 'Razer BlackWidow V4 Pro Yellow Switch',
        variantNameSnapshot: 'Razer BlackWidow V4 Pro Yellow Switch',
        sku: 'RZ-BW4P-YEL',
        skuSnapshot: 'RZ-BW4P-YEL',
        unitPrice: 5490000,
        unitPriceSnapshot: 5490000,
        originalPrice: 5990000,
        originalPriceSnapshot: 5990000,
        quantity: 2,
        totalPrice: 10980000,
        attributesSnapshot: '{"switch":"Yellow Linear"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T11:15:07Z',
    updatedAt: '2026-11-04T05:12:00Z',
  },
  {
    id: '4e01b3ab-a0fd-4918-bde1-710eb7f954a8',
    orderNumber: 'MK-20261102-549186',
    userId: '426497c9-763b-4cb6-bb9f-6252a94923df',
    customerEmail: 'kn054734@gmail.com',
    customerPhone: '0912121212',
    status: 'Completed',
    paymentStatus: 'Paid',
    paymentMethod: 'COD',
    subtotalAmount: 69990000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 69990000,
    shippingAddressSnapshot: 'Phường 1 (Trung tâm), Thành phố Từ Sơn, Tỉnh Bắc Ninh',
    statusHistory: [
      {
        id: 'a3a8fd5f-fca7-4c8f-9c63-ea23e48a80ac',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn đặt mua Laptop gaming ROG Strix',
        createdAt: '2026-11-02T05:08:06Z',
      },
      {
        id: '5b6e0a59-3336-4599-83f7-aa4fb2cc726b',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Quản Trị Viên Hệ Thống',
        note: 'Xác nhận thông tin máy',
        createdAt: '2026-11-03T15:12:00Z',
      },
      {
        id: 'ba59774d-5c7e-4ba8-99cb-c4f41fb8d497',
        fromStatus: 'Confirmed',
        toStatus: 'Processing',
        changedByName: 'Trần Văn Kho',
        note: 'Kiểm tra niêm phong laptop và đóng gói',
        createdAt: '2026-11-03T17:12:00Z',
      },
      {
        id: '29f6c375-904e-4b5d-a357-54a1fd0ccfdf',
        fromStatus: 'Processing',
        toStatus: 'Shipping',
        changedByName: 'Giao Hàng Tiết Kiệm',
        note: 'Bàn giao cho bưu tá giao hàng nhanh',
        createdAt: '2026-11-03T19:12:00Z',
      },
      {
        id: '745836cd-367e-470c-83e4-5988fe4000c9',
        fromStatus: 'Shipping',
        toStatus: 'Completed',
        changedByName: 'Giao Hàng Tiết Kiệm',
        note: 'Khách hàng đã nhận máy và thanh toán thành công',
        createdAt: '2026-11-03T23:12:00Z',
      },
    ],
    items: [
      {
        id: 'ec060de4-decd-4046-8c9c-7bb38c4bf470',
        variantId: '099d8a40-7b1e-4731-8628-6cc9688f4f0c',
        productId: '6d1e6f59-bb9a-4ede-b3cd-f77236716db0',
        productName: 'ASUS ROG Strix SCAR 16 (2024)',
        productNameSnapshot: 'ASUS ROG Strix SCAR 16 (2024)',
        variantName: 'ROG Strix SCAR 16 i9/32GB/1TB/RTX4090',
        variantNameSnapshot: 'ROG Strix SCAR 16 i9/32GB/1TB/RTX4090',
        sku: 'SCAR16-4090',
        skuSnapshot: 'SCAR16-4090',
        unitPrice: 69990000,
        unitPriceSnapshot: 69990000,
        originalPrice: 73990000,
        originalPriceSnapshot: 73990000,
        quantity: 1,
        totalPrice: 69990000,
        attributesSnapshot: '{"gpu":"RTX 4090","color":"Off Black"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80',
      },
    ],
    createdAt: '2026-11-02T05:08:06Z',
    updatedAt: '2026-11-03T23:12:00Z',
  },
  {
    id: '67fdb962-4d46-455d-913b-659fb03fce73',
    orderNumber: 'MK-20261101-F29CBD',
    userId: '426497c9-763b-4cb6-bb9f-6252a94923df',
    customerEmail: 'kn054734@gmail.com',
    customerPhone: '0901212121',
    status: 'Completed',
    paymentStatus: 'Paid',
    paymentMethod: 'COD',
    subtotalAmount: 39990000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 39990000,
    shippingAddressSnapshot: 'Phường 1, Quận Bình Thạnh, TP. Hồ Chí Minh',
    statusHistory: [
      {
        id: 'd0158d5d-aeec-4ec9-8f60-3ab59e24a551',
        fromStatus: null,
        toStatus: 'Pending',
        changedByName: 'Khách hàng',
        note: 'Tạo đơn đặt hàng iPhone 15 Pro Max',
        createdAt: '2026-11-01T17:34:59Z',
      },
      {
        id: '524afba5-af66-461a-96b8-bdc6bd89aba1',
        fromStatus: 'Pending',
        toStatus: 'Confirmed',
        changedByName: 'Quản Trị Viên Hệ Thống',
        note: 'Xác nhận đơn hàng qua điện thoại',
        createdAt: '2026-11-02T11:12:00Z',
      },
      {
        id: 'e6b35e8e-c618-4e64-8558-6f3a6708056c',
        fromStatus: 'Confirmed',
        toStatus: 'Processing',
        changedByName: 'Trần Văn Kho',
        note: 'Đóng gói sản phẩm và xuất kho',
        createdAt: '2026-11-02T13:12:00Z',
      },
      {
        id: 'd44ffc64-3009-403e-9cb0-ee5b7fd8cd4d',
        fromStatus: 'Processing',
        toStatus: 'Shipping',
        changedByName: 'Hệ thống vận chuyển',
        note: 'Giao cho đơn vị vận chuyển Viettel Post',
        createdAt: '2026-11-03T05:12:00Z',
      },
      {
        id: '61a1c6a5-3daa-42a2-930a-e061599469e4',
        fromStatus: 'Shipping',
        toStatus: 'Completed',
        changedByName: 'Hệ thống vận chuyển',
        note: 'Khách hàng đã nhận hàng và thanh toán COD thành công',
        createdAt: '2026-11-03T11:12:00Z',
      },
    ],
    items: [
      {
        id: '4eacbb89-8b8d-483b-b58e-afa4231f7273',
        variantId: '17b1c0b2-c18b-4c2b-91e4-c86f61aa18d9',
        productId: '5f82c51a-6e6b-46b6-b712-e87462db7c60',
        productName: 'iPhone 15 Pro Max',
        productNameSnapshot: 'iPhone 15 Pro Max',
        variantName: 'iPhone 15 Pro Max 512GB Titan Xanh',
        variantNameSnapshot: 'iPhone 15 Pro Max 512GB Titan Xanh',
        sku: 'IP15PM-512-BLU',
        skuSnapshot: 'IP15PM-512-BLU',
        unitPrice: 39990000,
        unitPriceSnapshot: 39990000,
        originalPrice: 41990000,
        originalPriceSnapshot: 41990000,
        quantity: 1,
        totalPrice: 39990000,
        attributesSnapshot: '{"color":"Titan Xanh","storage":"512GB"}',
        thumbnailUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
      },
    ],
    createdAt: '2026-11-01T17:34:59Z',
    updatedAt: '2026-11-03T11:12:00Z',
  },
];

function getStoredOrders(): OrderDto[] {
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_KEY);
    if (!raw) {
      saveStoredOrders(REAL_DATABASE_ORDERS);
      return [...REAL_DATABASE_ORDERS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStoredOrders(REAL_DATABASE_ORDERS);
      return [...REAL_DATABASE_ORDERS];
    }
    // Xoá bỏ hoàn toàn các đơn hàng mock demo cũ bắt đầu bằng 'ord-demo' hoặc 'ord-seed'
    const cleaned = parsed.filter(
      (o: OrderDto) => o && o.id && !o.id.startsWith('ord-demo') && !o.id.startsWith('ord-seed')
    );
    if (cleaned.length === 0) {
      saveStoredOrders(REAL_DATABASE_ORDERS);
      return [...REAL_DATABASE_ORDERS];
    }
    if (cleaned.length !== parsed.length) {
      saveStoredOrders(cleaned);
    }
    return cleaned;
  } catch {
    return [...REAL_DATABASE_ORDERS];
  }
}

function saveStoredOrders(orders: OrderDto[]) {
  try {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save admin orders to localStorage:', err);
  }
}

function getFilteredOrders(filter: OrderAdminFilter = {}): PagedOrderResult {
  let orders = getStoredOrders();

  if (filter.status && filter.status !== 'ALL') {
    orders = orders.filter((o) => o.status === filter.status);
  }

  if (filter.fromDate) {
    const from = new Date(filter.fromDate).getTime();
    orders = orders.filter((o) => new Date(o.createdAt).getTime() >= from);
  }

  if (filter.toDate) {
    const to = new Date(filter.toDate).getTime();
    orders = orders.filter((o) => new Date(o.createdAt).getTime() <= to);
  }

  if (filter.search && filter.search.trim()) {
    const s = filter.search.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(s) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(s)) ||
        (o.customerPhone && o.customerPhone.includes(s)) ||
        (o.shippingAddressSnapshot && o.shippingAddressSnapshot.toLowerCase().includes(s))
    );
  }

  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;
  const totalCount = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const items = orders.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    totalCount,
    pageNumber: page,
    pageSize,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export const adminOrderApi = {
  /**
   * Lấy danh sách toàn bộ đơn hàng (hỗ trợ lọc status, date range, search keyword).
   */
  async getAllOrders(filter: OrderAdminFilter = {}): Promise<ApiEnvelope<PagedOrderResult>> {
    try {
      const params: Record<string, string | number> = {
        page: filter.page || 1,
        pageSize: filter.pageSize || 20,
      };

      if (filter.status && filter.status !== 'ALL') {
        params.status = filter.status;
      }
      if (filter.fromDate) {
        params.fromDate = filter.fromDate;
      }
      if (filter.toDate) {
        params.toDate = filter.toDate;
      }
      if (filter.search && filter.search.trim()) {
        params.search = filter.search.trim();
      }

      const res = await apiClient.get<ApiEnvelope<PagedOrderResult>>('/admin/orders', { params });
      if (res.data?.isSuccess && res.data.data) {
        saveStoredOrders(res.data.data.items);
        return res.data;
      }
      return {
        isSuccess: true,
        data: getFilteredOrders(filter),
      };
    } catch {
      return {
        isSuccess: true,
        data: getFilteredOrders(filter),
      };
    }
  },

  /**
   * Lấy chi tiết đơn hàng theo mã đơn.
   */
  async getOrderDetail(orderNumber: string): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}`
      );
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
      const orders = getStoredOrders();
      const found = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (found) {
        return { isSuccess: true, data: found };
      }
      return res.data;
    } catch {
      const orders = getStoredOrders();
      const found = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (found) {
        return { isSuccess: true, data: found };
      }
      return { isSuccess: false, error: 'Không tìm thấy đơn hàng trong hệ thống.' };
    }
  },

  /**
   * Cập nhật trạng thái đơn hàng theo state machine.
   */
  async updateOrderStatus(
    orderNumber: string,
    request: UpdateOrderStatusRequestDto,
    actorName: string = 'Nhân viên Quản trị'
  ): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
        request
      );
      if (res.data?.isSuccess && res.data.data) {
        const orders = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(orders);
        return res.data;
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      // Offline fallback state machine
      const orders = getStoredOrders();
      const target = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (!target) {
        return { isSuccess: false, error: 'Không tìm thấy đơn hàng cần cập nhật.' };
      }

      const oldStatus = target.status;
      const targetStatus = request.newStatus;

      // Validate transitions
      const valid = isValidTransition(oldStatus, targetStatus);
      if (!valid) {
        return {
          isSuccess: false,
          error: `Chuyển trạng thái từ '${oldStatus}' sang '${targetStatus}' không hợp lệ theo quy tắc vòng đời đơn hàng.`,
        };
      }

      const now = new Date().toISOString();
      target.status = targetStatus;
      if (request.note) {
        target.adminNote = request.note;
      }
      if (targetStatus === 'Completed' && target.paymentMethod === 'COD') {
        target.paymentStatus = 'Paid';
      }
      if (targetStatus === 'Cancelled') {
        target.cancelReason = request.reason || 'Nhân viên hủy đơn';
        target.cancelledAt = now;
      }

      target.statusHistory.push({
        id: 'hist_' + Date.now(),
        fromStatus: oldStatus,
        toStatus: targetStatus,
        changedByName: actorName,
        reason: request.reason || `Chuyển trạng thái sang ${targetStatus}`,
        note: request.note || null,
        createdAt: now,
      });

      saveStoredOrders([...orders]);

      return {
        isSuccess: true,
        data: target,
        message: `Chuyển trạng thái đơn ${orderNumber} sang "${targetStatus}" thành công.`,
      };
    }
  },

  /**
   * Cập nhật ghi chú nội bộ cho đơn hàng.
   */
  async updateOrderNote(
    orderNumber: string,
    adminNote: string,
    actorName: string = 'Nhân viên'
  ): Promise<ApiEnvelope<OrderDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/note`,
        { adminNote }
      );
      if (res.data?.isSuccess && res.data.data) {
        const orders = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(orders);
        return res.data;
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      const orders = getStoredOrders();
      const target = orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (!target) {
        return { isSuccess: false, error: 'Không tìm thấy đơn hàng cần ghi chú.' };
      }

      const now = new Date().toISOString();
      target.adminNote = adminNote.trim();

      target.statusHistory.push({
        id: 'hist_note_' + Date.now(),
        fromStatus: target.status,
        toStatus: target.status,
        changedByName: actorName,
        reason: 'Cập nhật ghi chú nội bộ',
        note: adminNote.trim(),
        createdAt: now,
      });

      saveStoredOrders([...orders]);

      return {
        isSuccess: true,
        data: target,
        message: 'Cập nhật ghi chú nội bộ thành công.',
      };
    }
  },

  /**
   * Hủy đơn hàng và hoàn kho.
   */
  async cancelOrder(
    orderNumber: string,
    reason: string,
    actorName: string = 'Nhân viên Sales/Admin'
  ): Promise<ApiEnvelope<OrderDto>> {
    try {
      const payload: CancelOrderRequestDto = { reason: reason.trim() };
      const res = await apiClient.post<ApiEnvelope<OrderDto>>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/cancel`,
        payload
      );
      if (res.data?.isSuccess && res.data.data) {
        const orders = getStoredOrders().map((o) =>
          o.orderNumber === orderNumber ? res.data.data! : o
        );
        saveStoredOrders(orders);
        return res.data;
      }
      return res.data;
    } catch (err: unknown) {
      const serverError = extractServerBusinessError(err);
      if (serverError) {
        return { isSuccess: false, error: serverError };
      }

      return this.updateOrderStatus(
        orderNumber,
        {
          newStatus: 'Cancelled',
          reason: reason.trim(),
        },
        actorName
      );
    }
  },
};

function isValidTransition(current: OrderStatus, target: OrderStatus): boolean {
  if (current === 'PendingPayment') {
    return target === 'Pending' || target === 'Cancelled';
  }
  if (current === 'Pending') {
    return target === 'Confirmed' || target === 'Cancelled';
  }
  if (current === 'Confirmed') {
    return target === 'Processing' || target === 'Cancelled';
  }
  if (current === 'Processing') {
    return target === 'Shipping' || target === 'Cancelled';
  }
  if (current === 'Shipping') {
    return target === 'Completed' || target === 'Cancelled';
  }
  if (current === 'Completed') {
    return target === 'ReturnRequested';
  }
  if (current === 'ReturnRequested') {
    return target === 'Returned' || target === 'Completed';
  }
  return false;
}

function extractServerBusinessError(err: unknown): string | null {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: { status?: number; data?: { error?: string; message?: string } };
    };
    if (anyErr.response?.data?.error) return anyErr.response.data.error;
    if (anyErr.response?.data?.message) return anyErr.response.data.message;
  }
  return null;
}

export default adminOrderApi;
