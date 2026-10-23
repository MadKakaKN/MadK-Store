import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDto, LoginRequestDto, RegisterRequestDto, SocialLoginRequestDto } from '../../../types/auth';
import authApi, { tokenStorage } from '../../../api/authApi';

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequestDto) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (data: SocialLoginRequestDto) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequestDto) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(() => tokenStorage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.isSuccess && res.data) {
        setUser(res.data);
        tokenStorage.setUser(res.data);
      }
    } catch {
      // Giữ nguyên cached user nếu lỗi mạng tạm thời
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Lắng nghe sự kiện token được làm mới ngầm hoặc hết hạn
    const handleRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ user?: UserDto }>;
      if (customEvent.detail?.user) {
        setUser(customEvent.detail.user);
      } else {
        refreshUser();
      }
    };

    const handleExpired = () => {
      setUser(null);
      tokenStorage.clear();
    };

    window.addEventListener('auth:refreshed', handleRefreshed);
    window.addEventListener('auth:expired', handleExpired);

    return () => {
      window.removeEventListener('auth:refreshed', handleRefreshed);
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, [refreshUser]);

  const login = async (data: LoginRequestDto): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.isSuccess && res.data) {
        tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Đăng nhập không thành công.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi đăng nhập.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (
    data: SocialLoginRequestDto
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authApi.socialLogin(data);
      if (res.isSuccess && res.data) {
        tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Đăng nhập mạng xã hội không thành công.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi xác thực mạng xã hội.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    data: RegisterRequestDto
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.isSuccess && res.data) {
        tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
        setUser(res.data.user);
        return {
          success: true,
          message: res.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
        };
      }
      return { success: false, error: res.error || 'Đăng ký không thành công.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi đăng ký.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const rt = tokenStorage.getRefreshToken();
    try {
      await authApi.logout(rt || undefined);
    } finally {
      tokenStorage.clear();
      setUser(null);
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!tokenStorage.getAccessToken(),
    isLoading,
    login,
    socialLogin,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
