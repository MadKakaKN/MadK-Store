import { ShippingAddressInputDto, CheckoutItemInputDto } from './order';

export type CouponDiscountType = 'Percentage' | 'FixedAmount' | 1 | 2;

export interface CouponDto {
  id: string;
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface UpdateCouponDto {
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface CouponFilterDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface ValidateCouponRequestDto {
  code: string;
  subtotalAmount: number;
}

export interface CouponCalculationResultDto {
  isValid: boolean;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  description?: string | null;
  errorMessage?: string | null;
}

export interface CheckoutEstimateRequestDto {
  addressId?: string | null;
  shippingAddress?: ShippingAddressInputDto | null;
  items?: CheckoutItemInputDto[] | null;
  couponCode?: string | null;
}

export interface CheckoutEstimateResponseDto {
  subtotalAmount: number;
  shippingFee: number;
  carrierName: string;
  estimatedDelivery: string;
  isFreeShipping: boolean;
  discountAmount: number;
  couponCode?: string | null;
  couponDescription?: string | null;
  totalAmount: number;
  isCouponValid: boolean;
  couponErrorMessage?: string | null;
}
