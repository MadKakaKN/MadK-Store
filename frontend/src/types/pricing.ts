export enum PriceType {
  Standard = 1,
  Promotion = 2,
  FlashSale = 3,
}

export interface CurrentPriceResult {
  variantId: string;
  originalPrice: number;
  currentPrice: number;
  isOnSale: boolean;
  discountAmount?: number;
  discountPercent?: number;
  promotionName?: string | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  activeScheduleId?: string | null;
}

export interface PriceScheduleDto {
  id: string;
  variantId: string;
  priceType: PriceType;
  price: number;
  originalPrice: number;
  startDate: string;
  endDate?: string | null;
  reason: string;
  note?: string | null;
  isActive: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
  createdBy?: string | null;
  createdAt: string;
}

export interface CreatePriceScheduleDto {
  price: number;
  originalPrice?: number;
  startDate: string;
  endDate?: string | null;
  reason: string;
  note?: string;
  priceType?: PriceType;
}

export interface UpdateBasePriceDto {
  newOriginalPrice: number;
  newSalePrice: number;
  reason: string;
  note?: string;
}

export interface VariantPricingDto {
  variantId: string;
  productId: string;
  sku: string;
  variantName: string;
  productName: string;
  productSlug: string;
  thumbnailUrl?: string | null;
  baseOriginalPrice: number;
  baseSalePrice: number;
  currentPrice: CurrentPriceResult;
  schedules: PriceScheduleDto[];
}

export interface AdminVariantPriceItemDto {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  categoryName: string;
  brandName: string;
  thumbnailUrl?: string | null;
  baseOriginalPrice: number;
  baseSalePrice: number;
  effectivePrice: number;
  isOnSale: boolean;
  discountPercent: number;
  activePromotionName?: string | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  totalSchedulesCount: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface AdminPricingQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  onlyOnSale?: boolean;
  hasUpcomingSale?: boolean;
}
