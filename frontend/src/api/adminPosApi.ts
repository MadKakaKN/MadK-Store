import { apiClient } from './apiClient';

export interface PosProductVariant {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  stockQuantity: number;
  originalPrice: number;
  salePrice: number;
  hasDiscount: boolean;
  discountPercent: number;
  thumbnailUrl?: string;
  categoryId?: string;
}

export interface PosCustomer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  loyaltyTier: string;
  loyaltyPoints: number;
}

export interface PosCheckoutItemInput {
  variantId: string;
  quantity: number;
}

export interface PosCheckoutRequest {
  items: PosCheckoutItemInput[];
  paymentMethod: 'Cash' | 'BankTransfer' | 'PosCard';
  cashTendered?: number;
  cashChange?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  couponCode?: string;
  staffNote?: string;
}

export interface PosOrderReceipt {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{
    productName: string;
    variantName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
}

export const adminPosApi = {
  getProducts: async (search?: string, categoryId?: string) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    const response = await apiClient.get('/admin/pos/products', { params });
    return response.data?.data as PosProductVariant[];
  },

  searchCustomers: async (query: string) => {
    const response = await apiClient.get('/admin/pos/customers', {
      params: { query },
    });
    return response.data?.data as PosCustomer[];
  },

  checkout: async (request: PosCheckoutRequest) => {
    const response = await apiClient.post('/admin/pos/checkout', request);
    return response.data?.data as PosOrderReceipt;
  },
};
