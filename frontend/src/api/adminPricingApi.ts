import apiClient from './apiClient';
import { handleApiError } from './authApi';
import { ApiEnvelope } from '../types/auth';
import { PagedResult } from '../types/catalog';
import {
  AdminPricingQueryParams,
  AdminVariantPriceItemDto,
  CreatePriceScheduleDto,
  PriceScheduleDto,
  PriceType,
  UpdateBasePriceDto,
  VariantPricingDto,
} from '../types/pricing';

// In-memory mock data for standalone dev mode
let mockVariants: AdminVariantPriceItemDto[] = [
  {
    variantId: 'v-001',
    productId: 'p-001',
    productName: 'Bàn phím cơ MadK Cyber 87',
    variantName: 'Gateron Yellow Switch / Đen',
    sku: 'MK-CYBER-87-YEL',
    categoryName: 'Bàn phím cơ',
    brandName: 'MadK Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=300',
    baseOriginalPrice: 2200000,
    baseSalePrice: 1990000,
    effectivePrice: 1690000,
    isOnSale: true,
    discountPercent: 23.2,
    activePromotionName: 'Flash Sale Giữa Tháng 10',
    promotionStartDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    promotionEndDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    totalSchedulesCount: 3,
    stockQuantity: 42,
    isActive: true,
  },
  {
    variantId: 'v-002',
    productId: 'p-001',
    productName: 'Bàn phím cơ MadK Cyber 87',
    variantName: 'Cherry Red Switch / Trắng',
    sku: 'MK-CYBER-87-WHT',
    categoryName: 'Bàn phím cơ',
    brandName: 'MadK Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300',
    baseOriginalPrice: 2400000,
    baseSalePrice: 2190000,
    effectivePrice: 2190000,
    isOnSale: false,
    discountPercent: 8.8,
    activePromotionName: null,
    promotionStartDate: null,
    promotionEndDate: null,
    totalSchedulesCount: 1,
    stockQuantity: 18,
    isActive: true,
  },
  {
    variantId: 'v-003',
    productId: 'p-002',
    productName: 'Chuột không dây MadK Speedmaster X',
    variantName: 'PAW3395 / Matte Black',
    sku: 'MK-SPEED-X-BLK',
    categoryName: 'Chuột máy tính',
    brandName: 'MadK Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300',
    baseOriginalPrice: 1590000,
    baseSalePrice: 1390000,
    effectivePrice: 1190000,
    isOnSale: true,
    discountPercent: 25.2,
    activePromotionName: 'Khuyến mãi mùa giải Esports',
    promotionStartDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    promotionEndDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    totalSchedulesCount: 2,
    stockQuantity: 65,
    isActive: true,
  },
  {
    variantId: 'v-004',
    productId: 'p-003',
    productName: 'Tai nghe gaming MadK Void 7.1',
    variantName: 'Wireless 2.4GHz / LED RGB',
    sku: 'MK-VOID-71-RGB',
    categoryName: 'Tai nghe',
    brandName: 'MadK Audio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    baseOriginalPrice: 1890000,
    baseSalePrice: 1690000,
    effectivePrice: 1690000,
    isOnSale: false,
    discountPercent: 10.6,
    activePromotionName: null,
    promotionStartDate: null,
    promotionEndDate: null,
    totalSchedulesCount: 1,
    stockQuantity: 24,
    isActive: true,
  },
];

let mockSchedules: Record<string, PriceScheduleDto[]> = {
  'v-001': [
    {
      id: 'sch-001',
      variantId: 'v-001',
      priceType: PriceType.Promotion,
      price: 1690000,
      originalPrice: 2200000,
      startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      reason: 'Flash Sale Giữa Tháng 10',
      note: 'Áp dụng banner trang chủ',
      isActive: true,
      isCurrent: true,
      isUpcoming: false,
      isExpired: false,
      createdBy: 'admin@madkstore.vn',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'sch-002',
      variantId: 'v-001',
      priceType: PriceType.Standard,
      price: 1990000,
      originalPrice: 2200000,
      startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
      endDate: null,
      reason: 'Giá niêm yết ban đầu',
      isActive: true,
      isCurrent: false,
      isUpcoming: false,
      isExpired: false,
      createdBy: 'admin@madkstore.vn',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ],
};

function buildMockVariantPricing(variantId: string): ApiEnvelope<VariantPricingDto> {
  const item = mockVariants.find((v) => v.variantId === variantId) || mockVariants[0];
  const schedules = mockSchedules[item.variantId] || [
    {
      id: 'sch-def',
      variantId: item.variantId,
      priceType: PriceType.Standard,
      price: item.baseSalePrice,
      originalPrice: item.baseOriginalPrice,
      startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
      endDate: null,
      reason: 'Thiết lập giá ban đầu',
      isActive: true,
      isCurrent: !item.isOnSale,
      isUpcoming: false,
      isExpired: false,
      createdBy: 'admin@madkstore.vn',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    isSuccess: true,
    data: {
      variantId: item.variantId,
      productId: item.productId,
      sku: item.sku,
      variantName: item.variantName,
      productName: item.productName,
      productSlug: 'san-pham-madk',
      thumbnailUrl: item.thumbnailUrl,
      baseOriginalPrice: item.baseOriginalPrice,
      baseSalePrice: item.baseSalePrice,
      currentPrice: {
        variantId: item.variantId,
        originalPrice: item.baseOriginalPrice,
        currentPrice: item.effectivePrice,
        isOnSale: item.isOnSale,
        discountAmount: item.baseOriginalPrice - item.effectivePrice,
        discountPercent: item.discountPercent,
        promotionName: item.activePromotionName,
        promotionStartDate: item.promotionStartDate,
        promotionEndDate: item.promotionEndDate,
      },
      schedules,
    },
    message: 'Lấy thông tin giá biến thể thành công (Mock).',
  };
}

export const adminPricingApi = {
  /**
   * Danh sách biến thể kèm giá hiện hành và khuyến mãi (phân trang & lọc)
   */
  async getVariantPrices(
    params: AdminPricingQueryParams = {}
  ): Promise<ApiEnvelope<PagedResult<AdminVariantPriceItemDto>>> {
    try {
      const res = await apiClient.get<ApiEnvelope<PagedResult<AdminVariantPriceItemDto>>>(
        '/admin/pricing/variants',
        { params }
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        let filtered = [...mockVariants];

        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (v) =>
              v.sku.toLowerCase().includes(s) ||
              v.variantName.toLowerCase().includes(s) ||
              v.productName.toLowerCase().includes(s)
          );
        }

        if (params.onlyOnSale) {
          filtered = filtered.filter((v) => v.isOnSale);
        }

        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const total = filtered.length;
        const items = filtered.slice((page - 1) * pageSize, page * pageSize);

        return {
          isSuccess: true,
          data: {
            items,
            page,
            pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
            hasPreviousPage: page > 1,
            hasNextPage: page * pageSize < total,
          },
          message: 'Lấy danh sách giá biến thể thành công (Mock).',
        };
      });
    }
  },

  /**
   * Chi tiết cấu hình giá và toàn bộ lịch sử theo biến thể
   */
  async getVariantPricing(variantId: string): Promise<ApiEnvelope<VariantPricingDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<VariantPricingDto>>(
        `/admin/pricing/variants/${variantId}`
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => buildMockVariantPricing(variantId));
    }
  },

  /**
   * Tạo lịch khuyến mãi mới cho biến thể
   */
  async createPromotionSchedule(
    variantId: string,
    data: CreatePriceScheduleDto
  ): Promise<ApiEnvelope<PriceScheduleDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<PriceScheduleDto>>(
        `/admin/pricing/variants/${variantId}/promotions`,
        data
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        // Kiểm tra validation mock
        const newStart = new Date(data.startDate).getTime();
        const newEnd = data.endDate ? new Date(data.endDate).getTime() : Infinity;

        if (newEnd <= newStart) {
          return {
            isSuccess: false,
            error: 'Thời gian kết thúc khuyến mãi phải sau thời gian bắt đầu.',
          };
        }

        const existingSchedules = mockSchedules[variantId] || [];
        for (const ex of existingSchedules) {
          if (!ex.isActive || ex.priceType === PriceType.Standard) continue;
          const exStart = new Date(ex.startDate).getTime();
          const exEnd = ex.endDate ? new Date(ex.endDate).getTime() : Infinity;

          if (newStart <= exEnd && exStart <= newEnd) {
            return {
              isSuccess: false,
              error: `Khoảng thời gian khuyến mãi bị chồng chéo với chương trình '${ex.reason}' (${new Date(ex.startDate).toLocaleDateString()} - ${ex.endDate ? new Date(ex.endDate).toLocaleDateString() : 'Vô hạn'}).`,
            };
          }
        }

        const newSchedule: PriceScheduleDto = {
          id: 'sch-' + Date.now(),
          variantId,
          priceType: data.priceType || PriceType.Promotion,
          price: data.price,
          originalPrice: data.originalPrice || 2200000,
          startDate: data.startDate,
          endDate: data.endDate || null,
          reason: data.reason,
          note: data.note || null,
          isActive: true,
          isCurrent: true,
          isUpcoming: false,
          isExpired: false,
          createdBy: 'admin@madkstore.vn',
          createdAt: new Date().toISOString(),
        };

        if (!mockSchedules[variantId]) {
          mockSchedules[variantId] = [];
        }
        mockSchedules[variantId].unshift(newSchedule);

        // Update item in mockVariants
        const target = mockVariants.find((v) => v.variantId === variantId);
        if (target) {
          target.effectivePrice = data.price;
          target.isOnSale = true;
          target.activePromotionName = data.reason;
          target.promotionStartDate = data.startDate;
          target.promotionEndDate = data.endDate || null;
          target.totalSchedulesCount++;
        }

        return {
          isSuccess: true,
          data: newSchedule,
          message: 'Tạo lịch trình khuyến mãi thành công (Mock).',
        };
      });
    }
  },

  /**
   * Cập nhật giá niêm yết và giá bán chuẩn
   */
  async updateBasePrice(
    variantId: string,
    data: UpdateBasePriceDto
  ): Promise<ApiEnvelope<VariantPricingDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<VariantPricingDto>>(
        `/admin/pricing/variants/${variantId}/base-price`,
        data
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const target = mockVariants.find((v) => v.variantId === variantId);
        if (target) {
          target.baseOriginalPrice = data.newOriginalPrice;
          target.baseSalePrice = data.newSalePrice;
          if (!target.isOnSale) {
            target.effectivePrice = data.newSalePrice;
          }
        }
        return buildMockVariantPricing(variantId);
      });
    }
  },

  /**
   * Bật/tắt kích hoạt một lịch trình
   */
  async toggleScheduleActive(scheduleId: string): Promise<ApiEnvelope<boolean>> {
    try {
      const res = await apiClient.post<ApiEnvelope<boolean>>(
        `/admin/pricing/schedules/${scheduleId}/toggle-active`
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        for (const schedules of Object.values(mockSchedules)) {
          const found = schedules.find((s) => s.id === scheduleId);
          if (found) {
            found.isActive = !found.isActive;
            return {
              isSuccess: true,
              data: found.isActive,
              message: found.isActive ? 'Đã kích hoạt lại khuyến mãi.' : 'Đã tạm ngưng khuyến mãi.',
            };
          }
        }
        return { isSuccess: true, data: true };
      });
    }
  },

  /**
   * Xóa một lịch trình
   */
  async deleteSchedule(scheduleId: string): Promise<ApiEnvelope<boolean>> {
    try {
      const res = await apiClient.delete<ApiEnvelope<boolean>>(
        `/admin/pricing/schedules/${scheduleId}`
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        for (const key of Object.keys(mockSchedules)) {
          mockSchedules[key] = mockSchedules[key].filter((s) => s.id !== scheduleId);
        }
        return {
          isSuccess: true,
          data: true,
          message: 'Đã xóa lịch trình giá thành công (Mock).',
        };
      });
    }
  },
};
