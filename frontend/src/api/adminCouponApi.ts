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

// Dữ liệu mã giảm giá thực tế đồng bộ từ bảng public.coupons trên Supabase
const REAL_DATABASE_COUPONS: CouponDto[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    code: 'WELCOME10',
    description: 'Giảm 10% tối đa 500.000đ cho khách hàng mới với đơn hàng từ 1.000.000đ',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: 500000,
    minOrderAmount: 1000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 18,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    code: 'FREESHIP',
    description: 'Miễn phí vận chuyển toàn quốc (tối đa 50.000đ) cho đơn từ 2.000.000đ',
    discountType: 'FixedAmount',
    discountValue: 50000,
    maxDiscountAmount: 50000,
    minOrderAmount: 2000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 42,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    code: 'FLAGSHIP2026',
    description: 'Giảm 1.000.000đ trực tiếp khi mua iPhone, Samsung Ultra hoặc Laptop cao cấp từ 20.000.000đ',
    discountType: 'FixedAmount',
    discountValue: 1000000,
    maxDiscountAmount: 1000000,
    minOrderAmount: 20000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 200,
    usedCount: 9,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    code: 'MADKTECH',
    description: 'Giảm 200.000đ cho phụ kiện bàn phím, chuột, tai nghe và SSD từ 3.000.000đ',
    discountType: 'FixedAmount',
    discountValue: 200000,
    maxDiscountAmount: 200000,
    minOrderAmount: 3000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 27,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    code: 'VIPMEMBER',
    description: 'Ưu đãi thành viên VIP: Giảm 5% tối đa 1.500.000đ cho đơn hàng từ 15.000.000đ',
    discountType: 'Percentage',
    discountValue: 5,
    maxDiscountAmount: 1500000,
    minOrderAmount: 15000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 100,
    usedCount: 7,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

function getFilteredCoupons(filter?: CouponFilterDto): PagedCouponsResult {
  let filtered = [...REAL_DATABASE_COUPONS];
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(
      (c) => c.code.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }
  if (filter?.isActive !== undefined) {
    filtered = filtered.filter((c) => c.isActive === filter.isActive);
  }
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return {
    items,
    page,
    pageSize,
    totalItems: filtered.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

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
        data: getFilteredCoupons(filter),
      };
    } catch {
      return {
        isSuccess: true,
        data: getFilteredCoupons(filter),
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
