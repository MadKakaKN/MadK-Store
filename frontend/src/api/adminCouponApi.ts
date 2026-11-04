import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  CouponDto,
  CreateCouponDto,
  UpdateCouponDto,
  CouponFilterDto,
} from '../types/coupon';

export interface PagedCouponsResult {
  items: CouponDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const MOCK_COUPONS: CouponDto[] = [
  {
    id: 'cp-welcome10',
    code: 'WELCOME10',
    description: 'Giảm 10% tối đa 500.000đ cho khách hàng mới',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: 500000,
    minOrderAmount: 1000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 82,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cp-freeship',
    code: 'FREESHIP',
    description: 'Miễn phí vận chuyển toàn quốc cho đơn từ 2.000.000đ',
    discountType: 'FixedAmount',
    discountValue: 50000,
    maxDiscountAmount: 50000,
    minOrderAmount: 2000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 215,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cp-sale2026',
    code: 'FLAGSHIP2026',
    description: 'Giảm 1.000.000đ cho đơn hàng flagship từ 20.000.000đ',
    discountType: 'FixedAmount',
    discountValue: 1000000,
    maxDiscountAmount: 1000000,
    minOrderAmount: 20000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 100,
    usedCount: 14,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const adminCouponApi = {
  async getCoupons(filter?: CouponFilterDto): Promise<ApiEnvelope<PagedCouponsResult>> {
    try {
      const params: Record<string, unknown> = {};
      if (filter?.page) params.page = filter.page;
      if (filter?.pageSize) params.pageSize = filter.pageSize;
      if (filter?.search) params.search = filter.search;
      if (filter?.isActive !== undefined) params.isActive = filter.isActive;

      const res = await apiClient.get<ApiEnvelope<PagedCouponsResult>>('/admin/discounts', { params });
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
      return {
        isSuccess: true,
        data: {
          items: MOCK_COUPONS,
          page: 1,
          pageSize: 10,
          totalItems: MOCK_COUPONS.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    } catch {
      return {
        isSuccess: true,
        data: {
          items: MOCK_COUPONS,
          page: 1,
          pageSize: 10,
          totalItems: MOCK_COUPONS.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  },

  async getCouponById(id: string): Promise<ApiEnvelope<CouponDto>> {
    const res = await apiClient.get<ApiEnvelope<CouponDto>>(`/admin/discounts/${id}`);
    return res.data;
  },

  async createCoupon(dto: CreateCouponDto): Promise<ApiEnvelope<CouponDto>> {
    const res = await apiClient.post<ApiEnvelope<CouponDto>>('/admin/discounts', dto);
    return res.data;
  },

  async updateCoupon(id: string, dto: UpdateCouponDto): Promise<ApiEnvelope<CouponDto>> {
    const res = await apiClient.put<ApiEnvelope<CouponDto>>(`/admin/discounts/${id}`, dto);
    return res.data;
  },

  async toggleActive(id: string): Promise<ApiEnvelope<CouponDto>> {
    const res = await apiClient.patch<ApiEnvelope<CouponDto>>(`/admin/discounts/${id}/toggle-active`);
    return res.data;
  },

  async deleteCoupon(id: string): Promise<ApiEnvelope<boolean>> {
    const res = await apiClient.delete<ApiEnvelope<boolean>>(`/admin/discounts/${id}`);
    return res.data;
  },
};
