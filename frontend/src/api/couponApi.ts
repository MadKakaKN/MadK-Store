import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  CouponCalculationResultDto,
  ValidateCouponRequestDto,
  CheckoutEstimateRequestDto,
  CheckoutEstimateResponseDto,
} from '../types/coupon';
import { guestSessionStorage } from './cartApi';

export const couponApi = {
  /**
   * Kiểm tra mã coupon và tính số tiền giảm giá
   */
  async validateCoupon(code: string, subtotalAmount: number): Promise<ApiEnvelope<CouponCalculationResultDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<CouponCalculationResultDto>>('/coupons/validate', {
        code,
        subtotalAmount,
      } as ValidateCouponRequestDto);
      return res.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        isSuccess: false,
        message: err.message || 'Mã giảm giá không hợp lệ',
        error: 'COUPON_INVALID',
      };
    }
  },

  /**
   * Tính toán trước tổng tiền, phí vận chuyển và giảm giá khi thay đổi địa chỉ hoặc mã giảm giá
   */
  async estimateCheckout(request: CheckoutEstimateRequestDto): Promise<ApiEnvelope<CheckoutEstimateResponseDto>> {
    try {
      const headers: Record<string, string> = {};
      const anonId = guestSessionStorage.getAnonymousId();
      if (anonId) {
        headers['X-Anonymous-Id'] = anonId;
      }

      const res = await apiClient.post<ApiEnvelope<CheckoutEstimateResponseDto>>(
        '/orders/checkout/estimate',
        request,
        { headers }
      );
      return res.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        isSuccess: false,
        message: err.message || 'Không thể tính toán phí giao hàng',
        error: 'ESTIMATE_ERROR',
      };
    }
  },
};
