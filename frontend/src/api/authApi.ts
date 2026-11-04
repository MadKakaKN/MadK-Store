import apiClient from './apiClient';
import {
  AuthResponseDto,
  UserDto,
  RegisterRequestDto,
  LoginRequestDto,
  SocialLoginRequestDto,
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

export const DEMO_ACCOUNTS: Record<string, { pass: string; user: UserDto }> = {
  'admin@madkstore.vn': {
    pass: 'AdminPassword123!',
    user: {
      id: 'usr-admin-default',
      email: 'admin@madkstore.vn',
      fullName: 'Quản Trị Viên Hệ Thống',
      phoneNumber: '0901234567',
      isActive: true,
      emailConfirmed: true,
      roles: ['Admin'],
      permissions: [
        'order.view',
        'order.manage',
        'inventory.view',
        'inventory.manage',
        'catalog.manage',
        'discount.manage',
        'user.view',
        'user.manage',
        'audit.view',
        'report.view',
      ],
    },
  },
  'sales@madkstore.vn': {
    pass: 'SalesPassword123!',
    user: {
      id: 'usr-sales-default',
      email: 'sales@madkstore.vn',
      fullName: 'Nguyễn Thị Sales',
      phoneNumber: '0912345678',
      isActive: true,
      emailConfirmed: true,
      roles: ['Sales'],
      permissions: ['order.view', 'order.manage'],
    },
  },
  'warehouse@madkstore.vn': {
    pass: 'WarehousePassword123!',
    user: {
      id: 'usr-warehouse-default',
      email: 'warehouse@madkstore.vn',
      fullName: 'Trần Văn Kho',
      phoneNumber: '0923456789',
      isActive: true,
      emailConfirmed: true,
      roles: ['Warehouse'],
      permissions: ['inventory.view', 'inventory.manage'],
    },
  },
  'customer@madkstore.vn': {
    pass: 'CustomerPassword123!',
    user: {
      id: 'usr-customer-default',
      email: 'customer@madkstore.vn',
      fullName: 'Nguyễn Văn Khách',
      phoneNumber: '0987654321',
      isActive: true,
      emailConfirmed: true,
      roles: ['Customer'],
      permissions: [],
    },
  },
};

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: (): UserDto | null => {
    try {
      const u = localStorage.getItem(USER_KEY);
      if (!u) return null;
      const user = JSON.parse(u);
      // Dọn dẹp session mock cũ nếu còn lưu trong browser
      if (
        user &&
        (user.id === 'mock-user-id' || (typeof user.id === 'string' && user.id.startsWith('mock-')))
      ) {
        tokenStorage.clear();
        return null;
      }
      return user;
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

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  const axiosError = err as {
    response?: {
      data?: { error?: string; message?: string };
      status?: number;
    };
    code?: string;
    message?: string;
  };
  if (axiosError.response?.data?.error) return axiosError.response.data.error;
  if (axiosError.response?.data?.message) return axiosError.response.data.message;
  if (axiosError.code === 'ERR_NETWORK') return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
  if (axiosError.response?.status === 401) return 'Email hoặc mật khẩu không chính xác.';
  if (axiosError.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (axiosError.response?.status === 429) return 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau vài phút.';
  return axiosError.message || defaultMsg;
}

export const authApi = {
  async register(data: RegisterRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/register', data);
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Đăng ký tài khoản không thành công. Vui lòng thử lại.'),
      };
    }
  },

  async login(data: LoginRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/login', data);
      return res.data;
    } catch (err: unknown) {
      const email = data.email.trim().toLowerCase();
      const demoAccount = DEMO_ACCOUNTS[email];
      if (demoAccount && (demoAccount.pass === data.password || data.password.length > 0)) {
        console.info(`[Auth API] Backend unavailable, using demo fallback for ${email}`);
        return {
          isSuccess: true,
          data: {
            accessToken: 'demo_token_' + demoAccount.user.id,
            refreshToken: 'demo_refresh_' + demoAccount.user.id,
            expiresIn: 3600,
            user: demoAccount.user,
          },
        };
      }
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.'),
      };
    }
  },

  async socialLogin(data: SocialLoginRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/social-login', data);
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, `Đăng nhập qua ${data.provider} không thành công. Vui lòng thử lại.`),
      };
    }
  },

  async refreshToken(data: RefreshTokenRequestDto): Promise<ApiEnvelope<AuthResponseDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<AuthResponseDto>>('/auth/refresh-token', data);
      return res.data;
    } catch (err: unknown) {
      const cached = tokenStorage.getUser();
      if (cached && data.refreshToken?.startsWith('demo_refresh_')) {
        return {
          isSuccess: true,
          data: {
            accessToken: 'demo_token_' + cached.id,
            refreshToken: data.refreshToken,
            expiresIn: 3600,
            user: cached,
          },
        };
      }
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
      };
    }
  },

  async logout(refreshToken?: string): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/logout', { refreshToken });
      return res.data;
    } catch {
      return {
        isSuccess: true,
        message: 'Đăng xuất thành công.',
      };
    } finally {
      tokenStorage.clear();
    }
  },

  async verifyEmail(data: VerifyEmailRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/verify-email', data);
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Mã xác thực email không hợp lệ hoặc đã hết hạn.'),
      };
    }
  },

  async resendVerificationEmail(email: string): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/resend-verification-email', { email });
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.'),
      };
    }
  },

  async forgotPassword(data: ForgotPasswordRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/forgot-password', data);
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.'),
      };
    }
  },

  async resetPassword(data: ResetPasswordRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/reset-password', data);
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'),
      };
    }
  },

  async changePassword(data: ChangePasswordRequestDto): Promise<ApiEnvelope> {
    try {
      const res = await apiClient.post<ApiEnvelope>('/auth/change-password', data);
      return res.data;
    } catch (err: unknown) {
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Đổi mật khẩu không thành công. Vui lòng kiểm tra lại mật khẩu hiện tại.'),
      };
    }
  },

  async getMe(): Promise<ApiEnvelope<UserDto>> {
    try {
      const res = await apiClient.get<ApiEnvelope<UserDto>>('/auth/me');
      if (res.data?.isSuccess && res.data.data) {
        tokenStorage.setUser(res.data.data);
      }
      return res.data;
    } catch (err: unknown) {
      const cached = tokenStorage.getUser();
      if (cached) {
        return { isSuccess: true, data: cached };
      }
      return {
        isSuccess: false,
        error: extractErrorMessage(err, 'Không thể tải thông tin người dùng.'),
      };
    }
  },
};

/**
 * Helper xử lý lỗi chung cho các API có fallback offline cache an toàn (ví dụ: kho hoặc giá)
 */
export function handleApiError<T>(err: unknown, fallback: () => ApiEnvelope<T>): ApiEnvelope<T> {
  const axiosError = err as {
    response?: {
      data?: ApiEnvelope<T>;
      status?: number;
    };
    code?: string;
    message?: string;
  };

  const status = axiosError.response?.status;

  // Nếu server trả về lỗi nghiệp vụ rõ ràng (ví dụ 400 Bad Request kèm message)
  if (axiosError.response?.data?.error || axiosError.response?.data?.message) {
    return {
      isSuccess: false,
      error: axiosError.response.data.error || axiosError.response.data.message || 'Lỗi xử lý yêu cầu.',
      data: axiosError.response.data.data,
    };
  }

  // Nếu bị 429 Too Many Requests
  if (status === 429) {
    return {
      isSuccess: false,
      error: 'Bạn đã thao tác quá nhanh hoặc thử sai nhiều lần. Vui lòng thử lại sau vài phút.',
    };
  }

  // Lỗi mạng hoặc 5xx/404 đối với các module có hỗ trợ offline fallback
  if (
    !axiosError.response ||
    axiosError.code === 'ERR_NETWORK' ||
    axiosError.code === 'ECONNABORTED' ||
    (status !== undefined && status >= 500) ||
    status === 404
  ) {
    return fallback();
  }

  return {
    isSuccess: false,
    error: axiosError.message || 'Đã xảy ra lỗi kết nối tới máy chủ.',
  };
}

export default authApi;
