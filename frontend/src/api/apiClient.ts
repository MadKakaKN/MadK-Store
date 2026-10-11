import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './authApi';
import { ApiEnvelope, AuthResponseDto } from '../types/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor nạp JWT Bearer token nếu đã đăng nhập
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Biến quản lý trạng thái đang refresh token để gom các request chờ
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor xử lý lỗi tập trung & tự động làm mới token (Silent Token Refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Bỏ qua nếu lỗi không phải 401 hoặc request là các endpoint auth cơ bản (tránh vòng lặp vô tận)
    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh-token')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Đang có một request khác gọi refresh, đưa request này vào hàng đợi chờ
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Gọi API refresh token
      const res = await axios.post<ApiEnvelope<AuthResponseDto>>(
        `${baseURL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (res.data?.isSuccess && res.data.data?.accessToken) {
        const { accessToken, refreshToken: newRefreshToken, user } = res.data.data;
        tokenStorage.setTokens(accessToken, newRefreshToken, user);

        // Gắn token mới vào request hiện tại
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Báo cho các request đang xếp hàng tiếp tục
        processQueue(null, accessToken);

        // Bắn sự kiện cập nhật auth state
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: { user } }));

        return apiClient(originalRequest);
      } else {
        throw new Error(res.data?.error || 'Làm mới token thất bại');
      }
    } catch (refreshErr) {
      processQueue(refreshErr as Error, null);
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
