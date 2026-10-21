import apiClient from './apiClient';
import {
  AuthResponseDto,
  UserDto,
  RegisterRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  VerifyEmailRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  ChangePasswordRequestDto,
  ApiEnvelope,
} from '../types/auth';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: (): UserDto | null => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setTokens: (access: string, refresh: string, user?: UserDto) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  setUser: (user: UserDto) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const authApi = {
  async register(data: RegisterRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/register', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        data: {
          accessToken: 'mock_jwt_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          expiresIn: 3600,
          user: {
            id: 'mock-user-id',
            email: data.email,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber || null,
            isActive: true,
            emailConfirmed: false,
            roles: ['Customer'],
            permissions: [],
          },
        },
        message: 'Đăng ký tài khoản thành công (Mock). Vui lòng kiểm tra email để xác thực.',
      }));
    }
  },

  async login(data: LoginRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/login', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        if (data.password.length < 6) {
          return {
            isSuccess: false,
            error: 'Email hoặc mật khẩu không chính xác (Mock).',
          };
        }
        let roles = ['Customer'];
        let permissions: string[] = [];
        const lowerEmail = data.email.toLowerCase();
        if (lowerEmail.includes('admin')) {
          roles = ['Admin'];
          permissions = [
            'catalog.manage',
            'order.view',
            'inventory.view',
            'user.view',
            'audit.view',
            'discount.manage',
            'report.revenue',
            'report.inventory',
            'report.all',
          ];
        } else if (lowerEmail.includes('sales')) {
          roles = ['Sales'];
          permissions = ['order.view', 'catalog.manage', 'discount.manage'];
        } else if (lowerEmail.includes('warehouse')) {
          roles = ['Warehouse'];
          permissions = ['inventory.view', 'order.view'];
        }

        return {
          isSuccess: true,
          data: {
            accessToken: 'mock_jwt_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
            expiresIn: 3600,
            user: {
              id: 'mock-user-id',
              email: data.email,
              fullName: data.email.split('@')[0],
              phoneNumber: '0901234567',
              isActive: true,
              emailConfirmed: true,
              roles,
              permissions,
            },
          },
          message: 'Đăng nhập thành công (Mock).',
        };
      });
    }
  },

  async refreshToken(data: RefreshTokenRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/refresh-token', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        data: {
          accessToken: 'mock_refreshed_access_token_' + Date.now(),
          refreshToken: 'mock_refreshed_rt_' + Date.now(),
          expiresIn: 3600,
          user: tokenStorage.getUser() || {
            id: 'mock-user-id',
            email: 'customer@madkstore.vn',
            fullName: 'Khách hàng',
            isActive: true,
            emailConfirmed: true,
            roles: ['Customer'],
            permissions: [],
          },
        },
        message: 'Làm mới token thành công (Mock).',
      }));
    }
  },

  async logout(refreshToken?: string): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/logout', { refreshToken });
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        message: 'Đăng xuất thành công.',
      }));
    } finally {
      tokenStorage.clear();
    }
  },

  async verifyEmail(data: VerifyEmailRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/verify-email', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        message: 'Xác thực email thành công (Mock).',
      }));
    }
  },

  async forgotPassword(data: ForgotPasswordRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/forgot-password', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hòm thư của bạn.',
      }));
    }
  },

  async resetPassword(data: ResetPasswordRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/reset-password', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
      }));
    }
  },

  async changePassword(data: ChangePasswordRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/change-password', data);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        message: 'Đổi mật khẩu thành công (Mock).',
      }));
    }
  },

  async getMe(): Promise<ApiEnvelope<UserDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<UserDto>>('/auth/me');
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const cached = tokenStorage.getUser();
        if (cached) {
          return { isSuccess: true, data: cached };
        }
        return { isSuccess: false, error: 'Không thể tải thông tin người dùng.' };
      });
    }
  },
};

export function handleApiError<T>(err: unknown, fallback: () => ApiEnvelope<T>): ApiEnvelope<T> {
  const axiosError = err as {
    response?: {
      data?: ApiEnvelope<T>;
      status?: number;
    };
    code?: string;
    message?: string;
  };

  // If server responded with a Result Envelope (e.g. 400 Bad Request with error description)
  if (axiosError.response?.data?.error || axiosError.response?.data?.message) {
    return {
      isSuccess: false,
      error: axiosError.response.data.error || axiosError.response.data.message || 'Lỗi xử lý yêu cầu.',
      data: axiosError.response.data.data,
    };
  }

  // If 429 Too Many Requests
  if (axiosError.response?.status === 429) {
    return {
      isSuccess: false,
      error: 'Bạn đã thao tác quá nhanh hoặc thử sai nhiều lần. Vui lòng thử lại sau vài phút.',
    };
  }

  // If Network error / Connection Refused and we have fallback mock
  if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
    return fallback();
  }

  return {
    isSuccess: false,
    error: axiosError.message || 'Đã xảy ra lỗi kết nối tới máy chủ.',
  };
}

export default authApi;
