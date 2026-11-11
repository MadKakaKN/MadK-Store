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

const ADMIN_COUPONS_STORAGE_KEY = 'madk_admin_coupons_store';

// Dữ liệu mã giảm giá khởi tạo mặc định cho cửa hàng MadK Store
const DEFAULT_SEED_COUPONS: CouponDto[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    code: 'WELCOME10',
    description: 'Giảm 10% tối đa 500.000đ cho khách hàng mới với đơn hàng từ 1.000.000đ',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: 500000,
    minOrderAmount: 1000000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2027-01-01T06:59:59Z',
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
    endDate: '2027-01-01T06:59:59Z',
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
    endDate: '2027-01-01T06:59:59Z',
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
    endDate: '2027-01-01T06:59:59Z',
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
    endDate: '2027-01-01T06:59:59Z',
    usageLimit: 100,
    usedCount: 7,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

function getStoredCoupons(): CouponDto[] {
  try {
    const raw = localStorage.getItem(ADMIN_COUPONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_COUPONS_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_COUPONS));
      return [...DEFAULT_SEED_COUPONS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_SEED_COUPONS];
  }
}

function saveStoredCoupons(coupons: CouponDto[]): void {
  try {
    localStorage.setItem(ADMIN_COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  } catch (err) {
    console.error('Failed to save coupons to localStorage:', err);
  }
}

function getFilteredCoupons(filter?: CouponFilterDto): PagedCouponsResult {
  let filtered = getStoredCoupons();

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
    } catch {
      // Fallback
    }

    return {
      isSuccess: true,
      data: getFilteredCoupons(filter),
    };
  },

  async getCouponById(id: string): Promise<ApiEnvelope<CouponDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<CouponDto>>(`/admin/discounts/${id}`);
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const found = getStoredCoupons().find((c) => c.id === id);
    if (!found) {
      return {
        isSuccess: false,
        error: 'Không tìm thấy mã giảm giá.',
      };
    }

    return {
      isSuccess: true,
      data: found,
    };
  },

  async createCoupon(dto: CreateCouponDto): Promise<ApiEnvelope<CouponDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<CouponDto>>('/admin/discounts', dto);
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const coupons = getStoredCoupons();
    // Kiểm tra trùng mã
    if (coupons.some((c) => c.code.toUpperCase() === dto.code.toUpperCase())) {
      return {
        isSuccess: false,
        error: `Mã voucher "${dto.code.toUpperCase()}" đã tồn tại. Vui lòng chọn mã khác.`,
      };
    }

    const newCoupon: CouponDto = {
      id: 'c-' + Date.now(),
      code: dto.code.trim().toUpperCase(),
      description: dto.description || null,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount || null,
      minOrderAmount: dto.minOrderAmount || 0,
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      usageLimit: dto.usageLimit || null,
      usedCount: 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdAt: new Date().toISOString(),
    };

    coupons.unshift(newCoupon);
    saveStoredCoupons(coupons);

    return {
      isSuccess: true,
      data: newCoupon,
      message: `Đã tạo thành công voucher ${newCoupon.code}`,
    };
  },

  async updateCoupon(id: string, dto: UpdateCouponDto): Promise<ApiEnvelope<CouponDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<CouponDto>>(`/admin/discounts/${id}`, dto);
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const coupons = getStoredCoupons();
    const index = coupons.findIndex((c) => c.id === id);
    if (index === -1) {
      return {
        isSuccess: false,
        error: 'Không tìm thấy mã voucher để cập nhật.',
      };
    }

    const existing = coupons[index];
    const updated: CouponDto = {
      ...existing,
      description: dto.description !== undefined ? dto.description : existing.description,
      discountType: dto.discountType !== undefined ? dto.discountType : existing.discountType,
      discountValue: dto.discountValue !== undefined ? dto.discountValue : existing.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount !== undefined ? dto.maxDiscountAmount : existing.maxDiscountAmount,
      minOrderAmount: dto.minOrderAmount !== undefined ? dto.minOrderAmount : existing.minOrderAmount,
      startDate: dto.startDate !== undefined ? dto.startDate : existing.startDate,
      endDate: dto.endDate !== undefined ? dto.endDate : existing.endDate,
      usageLimit: dto.usageLimit !== undefined ? dto.usageLimit : existing.usageLimit,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
    };

    coupons[index] = updated;
    saveStoredCoupons(coupons);

    return {
      isSuccess: true,
      data: updated,
      message: `Đã cập nhật voucher ${updated.code}`,
    };
  },

  async toggleActive(id: string): Promise<ApiEnvelope<CouponDto>> {
    try {
      const res = await apiClient.patch<ApiEnvelope<CouponDto>>(`/admin/discounts/${id}/toggle-active`);
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
    } catch {
      // Fallback khi backend chưa có endpoint này hoặc offline
    }

    const coupons = getStoredCoupons();
    const index = coupons.findIndex((c) => c.id === id);
    if (index === -1) {
      return {
        isSuccess: false,
        error: 'Không tìm thấy mã voucher cần cập nhật trạng thái.',
      };
    }

    const target = coupons[index];
    const updated: CouponDto = {
      ...target,
      isActive: !target.isActive,
    };

    coupons[index] = updated;
    saveStoredCoupons(coupons);

    return {
      isSuccess: true,
      data: updated,
      message: `Đã ${updated.isActive ? 'kích hoạt' : 'vô hiệu hóa'} mã ${updated.code}`,
    };
  },

  async deleteCoupon(id: string): Promise<ApiEnvelope<boolean>> {
    try {
      const res = await apiClient.delete<ApiEnvelope<boolean>>(`/admin/discounts/${id}`);
      if (res.data?.isSuccess) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const coupons = getStoredCoupons();
    const filtered = coupons.filter((c) => c.id !== id);
    saveStoredCoupons(filtered);

    return {
      isSuccess: true,
      data: true,
      message: 'Xóa mã voucher thành công.',
    };
  },
};

export default adminCouponApi;
