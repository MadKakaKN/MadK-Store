import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';

export interface GhnCalculateFeeRequest {
  toDistrictId?: number;
  toWardCode?: string;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  subtotalAmount?: number;
  totalWeightGrams?: number;
  totalQuantity?: number;
}

export interface GhnCalculateFeeResponse {
  totalFee: number;
  serviceFee: number;
  insuranceFee: number;
  expectedDeliveryTime: string;
  isFreeShipping: boolean;
}

export interface GhnCreateShippingOrderResponse {
  orderNumber: string;
  trackingCode: string;
  totalFee: number;
  expectedDeliveryTime: string;
  sortCode?: string | null;
  printToken?: string | null;
  printUrl?: string | null;
}

export interface GhnTrackingLog {
  status: string;
  description: string;
  time: string;
  location?: string | null;
}

export interface GhnTrackingDetail {
  orderNumber: string;
  trackingCode: string;
  status: string;
  statusDescription: string;
  shipperName?: string | null;
  shipperPhone?: string | null;
  warehouse?: string | null;
  updatedAt?: string | null;
  logs: GhnTrackingLog[];
}

export interface GhnProvince {
  provinceId: number;
  provinceName: string;
  code?: string | null;
}

export interface GhnDistrict {
  districtId: number;
  provinceId: number;
  districtName: string;
  code?: string | null;
}

export interface GhnWard {
  wardCode: string;
  districtId: number;
  wardName: string;
}

export const shippingApi = {
  /**
   * Tính phí ship tự động chuẩn GHN.
   */
  async calculateGhnFee(request: GhnCalculateFeeRequest): Promise<ApiEnvelope<GhnCalculateFeeResponse>> {
    try {
      const res = await apiClient.post<ApiEnvelope<GhnCalculateFeeResponse>>(
        '/shipping/ghn/calculate-fee',
        request
      );
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractServerErrorMessage(err) || 'Không thể tính phí vận chuyển GHN.',
      };
    }
  },

  /**
   * Khách hàng / Quản trị viên tra cứu hành trình bưu phẩm qua mã đơn hoặc mã vận đơn.
   */
  async getTrackingDetail(orderNumberOrTrackingCode: string): Promise<ApiEnvelope<GhnTrackingDetail>> {
    try {
      const res = await apiClient.get<ApiEnvelope<GhnTrackingDetail>>(
        `/shipping/ghn/track/${encodeURIComponent(orderNumberOrTrackingCode)}`
      );
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractServerErrorMessage(err) || 'Không tìm thấy hành trình bưu kiện.',
      };
    }
  },

  /**
   * Quản trị viên bấm nút tạo vận đơn GHN cho đơn hàng đang xử lý.
   */
  async createAdminShippingOrder(orderNumber: string, note?: string): Promise<ApiEnvelope<GhnCreateShippingOrderResponse>> {
    try {
      const res = await apiClient.post<ApiEnvelope<GhnCreateShippingOrderResponse>>(
        `/admin/shipping/ghn/create-order/${encodeURIComponent(orderNumber)}`,
        { orderNumber, note }
      );
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractServerErrorMessage(err) || 'Không thể tạo vận đơn GHN.',
      };
    }
  },

  /**
   * Lấy đường dẫn in phiếu giao hàng A5 / tem dán từ GHN.
   */
  async getPrintUrl(orderCode: string): Promise<ApiEnvelope<string>> {
    try {
      const res = await apiClient.get<ApiEnvelope<string>>(
        `/admin/shipping/ghn/print/${encodeURIComponent(orderCode)}`
      );
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractServerErrorMessage(err) || 'Không thể lấy liên kết in phiếu gửi.',
      };
    }
  },

  /**
   * Lấy danh sách Tỉnh/Thành phố chuẩn GHN.
   */
  async getProvinces(): Promise<ApiEnvelope<GhnProvince[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<GhnProvince[]>>('/shipping/ghn/provinces');
      return res.data;
    } catch {
      return { isSuccess: false, error: 'Không thể tải danh sách tỉnh thành.' };
    }
  },

  /**
   * Lấy danh sách Quận/Huyện chuẩn GHN.
   */
  async getDistricts(provinceId: number): Promise<ApiEnvelope<GhnDistrict[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<GhnDistrict[]>>(`/shipping/ghn/districts/${provinceId}`);
      return res.data;
    } catch {
      return { isSuccess: false, error: 'Không thể tải danh sách quận huyện.' };
    }
  },

  /**
   * Lấy danh sách Phường/Xã chuẩn GHN.
   */
  async getWards(districtId: number): Promise<ApiEnvelope<GhnWard[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<GhnWard[]>>(`/shipping/ghn/wards/${districtId}`);
      return res.data;
    } catch {
      return { isSuccess: false, error: 'Không thể tải danh sách phường xã.' };
    }
  },
};

function extractServerErrorMessage(err: unknown): string | null {
  if (err && typeof err === 'object') {
    const anyErr = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
    if (anyErr.response?.data?.error) return anyErr.response.data.error;
    if (anyErr.response?.data?.message) return anyErr.response.data.message;
  }
  return null;
}

export default shippingApi;
