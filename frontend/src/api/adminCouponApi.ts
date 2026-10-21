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

export const adminCouponApi = {
  async getCoupons(filter?: CouponFilterDto): Promise<ApiEnvelope<PagedCouponsResult>> {
    const params: Record<string, any> = {};
    if (filter?.page) params.page = filter.page;
    if (filter?.pageSize) params.pageSize = filter.pageSize;
    if (filter?.search) params.search = filter.search;
    if (filter?.isActive !== undefined) params.isActive = filter.isActive;

    const res = await apiClient.get<ApiEnvelope<PagedCouponsResult>>('/admin/discounts', { params });
    return res.data;
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
