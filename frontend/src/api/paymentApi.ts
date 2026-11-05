import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import {
  CheckoutCodRequestDto,
  CheckoutVnpayResponseDto,
  PaymentUrlResponseDto,
  VnpayCallbackResultDto,
  PaymentDto,
  CheckoutMomoResponseDto,
  MomoPaymentResponseDto,
  MomoCallbackResultDto,
  SimulateMomoIpnRequestDto,
} from '../types/order';
import { guestSessionStorage } from './cartApi';

export interface SimulateIpnRequest {
  orderNumber: string;
  responseCode?: string;
  amount?: number;
  bankCode?: string;
  transactionNo?: string;
  tamperSignature?: boolean;
}

export interface VnpayIpnResponse {
  rspCode: string;
  message: string;
}

export const paymentApi = {
  /**
   * Tạo đơn hàng và lấy URL chuyển hướng sang cổng thanh toán trực tuyến VNPay Sandbox.
   */
  async checkoutVnpay(request: CheckoutCodRequestDto): Promise<ApiEnvelope<CheckoutVnpayResponseDto>> {
    try {
      const headers: Record<string, string> = {};
      if (request.idempotencyKey) {
        headers['Idempotency-Key'] = request.idempotencyKey;
      }
      const anonId = guestSessionStorage.getAnonymousId();
      if (anonId) {
        headers['X-Anonymous-Id'] = anonId;
      }

      const res = await apiClient.post<ApiEnvelope<CheckoutVnpayResponseDto>>(
        '/orders/checkout/vnpay',
        request,
        { headers }
      );

      return res.data;
    } catch (err: unknown) {
      const errorMsg = extractServerErrorMessage(err);
      return {
        isSuccess: false,
        error: errorMsg || 'Không thể kết nối đến cổng thanh toán VNPay.',
      };
    }
  },

  /**
   * Sinh lại URL thanh toán VNPay cho đơn hàng đang ở trạng thái PendingPayment.
   */
  async createPaymentUrl(orderNumber: string, returnUrl?: string): Promise<ApiEnvelope<PaymentUrlResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<PaymentUrlResponseDto>>(
        '/payments/vnpay/create-payment-url',
        { orderNumber, returnUrl }
      );
      return res.data;
    } catch (err: unknown) {
      const errorMsg = extractServerErrorMessage(err);
      return {
        isSuccess: false,
        error: errorMsg || 'Không thể tạo liên kết thanh toán.',
      };
    }
  },

  /**
   * Xác thực tham số và chữ ký trả về tại trang Return URL.
   * LƯU Ý: Trang return chỉ lấy kết quả để hiển thị giao diện, không tự đổi trạng thái đơn.
   */
  async verifyPaymentReturn(searchQuery: string): Promise<ApiEnvelope<VnpayCallbackResultDto>> {
    try {
      const query = searchQuery.startsWith('?') ? searchQuery : `?${searchQuery}`;
      const res = await apiClient.get<ApiEnvelope<VnpayCallbackResultDto>>(
        `/payments/vnpay/payment-return${query}`
      );
      return res.data;
    } catch (err: unknown) {
      const errorMsg = extractServerErrorMessage(err);
      return {
        isSuccess: false,
        error: errorMsg || 'Xác thực phản hồi từ VNPay không thành công.',
      };
    }
  },

  /**
   * Mô phỏng gọi Webhook IPN phục vụ kiểm thử môi trường local mà không cần tunnel.
   */
  async simulateIpn(payload: SimulateIpnRequest): Promise<VnpayIpnResponse> {
    const res = await apiClient.post<VnpayIpnResponse>(
      '/payments/vnpay/simulate-ipn',
      payload
    );
    return res.data;
  },

  /**
   * Tra cứu danh sách lịch sử giao dịch thanh toán của đơn hàng để đối soát.
   */
  async getOrderPayments(orderNumber: string): Promise<ApiEnvelope<PaymentDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<PaymentDto[]>>(
        `/payments/vnpay/orders/${encodeURIComponent(orderNumber)}/transactions`
      );
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractServerErrorMessage(err) || 'Không thể tải lịch sử thanh toán.',
      };
    }
  },

  // ==========================================
  // MOMO ALL-IN-ONE GATEWAY APIs
  // ==========================================

  /**
   * Tạo đơn hàng và lấy PayUrl / Deeplink / QR Code chuyển hướng sang Ví MoMo.
   */
  async checkoutMomo(request: CheckoutCodRequestDto): Promise<ApiEnvelope<CheckoutMomoResponseDto>> {
    try {
      const headers: Record<string, string> = {};
      if (request.idempotencyKey) {
        headers['Idempotency-Key'] = request.idempotencyKey;
      }
      const anonId = guestSessionStorage.getAnonymousId();
      if (anonId) {
        headers['X-Anonymous-Id'] = anonId;
      }

      const res = await apiClient.post<ApiEnvelope<CheckoutMomoResponseDto>>(
        '/orders/checkout/momo',
        request,
        { headers }
      );

      return res.data;
    } catch (err: unknown) {
      const errorMsg = extractServerErrorMessage(err);
      return {
        isSuccess: false,
        error: errorMsg || 'Không thể kết nối đến cổng thanh toán Ví MoMo.',
      };
    }
  },

  /**
   * Sinh lại link / QR Code thanh toán MoMo cho đơn hàng đang ở trạng thái Pending hoặc PendingPayment.
   */
  async createMomoPayment(orderNumber: string, returnUrl?: string): Promise<ApiEnvelope<MomoPaymentResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<MomoPaymentResponseDto>>(
        '/payments/momo/create',
        { orderNumber, returnUrl }
      );
      return res.data;
    } catch (err: unknown) {
      const errorMsg = extractServerErrorMessage(err);
      return {
        isSuccess: false,
        error: errorMsg || 'Không thể tạo phiên thanh toán MoMo.',
      };
    }
  },

  /**
   * Xác thực tham số và chữ ký phản hồi tại trang MoMo Return URL.
   */
  async verifyMomoPaymentReturn(searchQuery: string): Promise<ApiEnvelope<MomoCallbackResultDto>> {
    try {
      const query = searchQuery.startsWith('?') ? searchQuery : `?${searchQuery}`;
      const res = await apiClient.get<ApiEnvelope<MomoCallbackResultDto>>(
        `/payments/momo/payment-return${query}`
      );
      return res.data;
    } catch (err: unknown) {
      const errorMsg = extractServerErrorMessage(err);
      return {
        isSuccess: false,
        error: errorMsg || 'Xác thực kết quả thanh toán từ MoMo không thành công.',
      };
    }
  },

  /**
   * Mô phỏng gọi Webhook IPN MoMo phục vụ kiểm thử tại môi trường local.
   */
  async simulateMomoIpn(payload: SimulateMomoIpnRequestDto): Promise<Record<string, unknown>> {
    const res = await apiClient.post<Record<string, unknown>>(
      '/payments/momo/simulate-ipn',
      payload
    );
    return res.data;
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

export default paymentApi;
