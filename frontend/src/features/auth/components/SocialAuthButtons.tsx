import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tokenStorage } from '../../../api/authApi';
import { SocialLoginRequestDto } from '../../../types/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: unknown) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
    FB?: {
      init: (params: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            accessToken: string;
            userID: string;
            expiresIn: number;
          };
          status: string;
        }) => void,
        options?: { scope: string }
      ) => void;
      api: (
        path: string,
        params: { fields: string },
        callback: (response: { id: string; name?: string; email?: string; picture?: { data: { url: string } } }) => void
      ) => void;
    };
  }
}

interface SocialAuthButtonsProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  layout?: 'full' | 'compact';
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSuccess,
  onError,
  layout = 'full',
}) => {
  const { socialLogin } = useAuth();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const showError = (msg: string) => {
    if (onError) onError(msg);
    else setLocalError(msg);
  };

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '571963960082-jgoog1tegfb5rhkj4k52ialr0i2dnus5.apps.googleusercontent.com';

  const FACEBOOK_APP_ID =
    import.meta.env.VITE_FACEBOOK_APP_ID || '';

  /**
   * Directly triggers official Google OAuth 2.0 without any mock page
   */
  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsVerifying(true);
    setActiveProvider('Google');

    // If Google Identity Services SDK is available on window, open official Google popup
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              setIsVerifying(false);
              setActiveProvider(null);
              if (tokenResponse.error && tokenResponse.error !== 'popup_closed_by_user') {
                showError(tokenResponse.error_description || 'Đăng nhập Google bị hủy hoặc gặp sự cố.');
              }
              return;
            }

            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await profileRes.json();

              const payload: SocialLoginRequestDto = {
                provider: 'Google',
                email: profile.email,
                fullName: profile.name || profile.given_name || profile.email?.split('@')[0] || 'Google User',
                avatarUrl: profile.picture,
                idToken: tokenResponse.access_token,
              };

              const res = await socialLogin(payload);
              if (res.success) {
                if (onSuccess) {
                  onSuccess();
                } else {
                  const currentUser = tokenStorage.getUser();
                  const isAdmin = currentUser?.roles?.includes('Admin');
                  window.location.href = isAdmin ? '/admin' : '/';
                }
              } else {
                showError(res.error || 'Đăng nhập Google không thành công.');
              }
            } catch (fetchErr: unknown) {
              const msg = fetchErr instanceof Error ? fetchErr.message : 'Lỗi lấy thông tin Google.';
              showError(msg);
            } finally {
              setIsVerifying(false);
              setActiveProvider(null);
            }
          },
          error_callback: () => {
            // Popup blocked: fallback to direct browser redirect to accounts.google.com
            redirectToGoogleOAuth();
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fallback to direct redirect
        redirectToGoogleOAuth();
        return;
      }
    }

    // Direct redirect to accounts.google.com if GIS popup is unavailable
    redirectToGoogleOAuth();
  };

  const redirectToGoogleOAuth = () => {
    // Use only origin as redirect_uri to match Google Cloud Console config exactly
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent('email profile openid')}&prompt=select_account`;
    window.location.href = authUrl;
  };

  /**
   * Facebook Login handler (Official OAuth 2.0 / Facebook SDK)
   */
  const handleFacebookLogin = async () => {
    setLocalError(null);

    // If Facebook App ID is configured, trigger official Facebook OAuth
    if (FACEBOOK_APP_ID) {
      setIsVerifying(true);
      setActiveProvider('Facebook');

      // 1. If Facebook JS SDK is loaded on window
      if (window.FB) {
        try {
          window.FB.login(
            (response) => {
              if (response.authResponse?.accessToken) {
                const accessToken = response.authResponse.accessToken;
                window.FB!.api(
                  '/me',
                  { fields: 'id,name,email,picture.width(200)' },
                  async (userData) => {
                    try {
                      const email = userData.email || `${userData.id}@facebook.user`;
                      const res = await socialLogin({
                        provider: 'Facebook',
                        email,
                        fullName: userData.name || 'Người dùng Facebook',
                        avatarUrl: userData.picture?.data?.url,
                        idToken: accessToken,
                      });
                      if (res.success) {
                        if (onSuccess) onSuccess();
                        else {
                          const currentUser = tokenStorage.getUser();
                          const isAdmin = currentUser?.roles?.includes('Admin');
                          window.location.href = isAdmin ? '/admin' : '/';
                        }
                      } else {
                        showError(res.error || 'Đăng nhập Facebook không thành công.');
                      }
                    } catch (err: unknown) {
                      showError(err instanceof Error ? err.message : 'Lỗi lấy dữ liệu từ Facebook.');
                    } finally {
                      setIsVerifying(false);
                      setActiveProvider(null);
                    }
                  }
                );
              } else {
                setIsVerifying(false);
                setActiveProvider(null);
                showError('Đăng nhập Facebook đã bị hủy.');
              }
            },
            { scope: 'email,public_profile' }
          );
          return;
        } catch {
          // Fallback to direct browser redirect
        }
      }

      // 2. Direct browser redirect to Facebook OAuth dialog
      const redirectUri = window.location.origin;
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=facebook&response_type=token&scope=${encodeURIComponent('email,public_profile')}`;
      window.location.href = authUrl;
      return;
    }

    // If Meta App ID is not yet configured, do not hardcode any fake identity
    showError(
      'Tính năng "Đăng nhập với Facebook" đang chờ cấu hình Facebook App ID từ Meta Developer. Bạn vui lòng sử dụng "Đăng nhập với Google" (đang hoạt động bình thường) hoặc đăng nhập bằng Email/Mật khẩu.'
    );
  };

  return (
    <div className="w-full">
      {/* Informative notice if Meta App ID is missing or error occurred */}
      {localError && (
        <div className="mb-3 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in duration-200">
          <span className="text-sm mt-0.5 shrink-0">⚠️</span>
          <div className="flex-1 text-left leading-relaxed text-[11px] sm:text-xs">{localError}</div>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            className="text-amber-600 hover:text-amber-900 text-xs font-bold p-0.5 leading-none shrink-0"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E7EB]" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-white px-2.5 text-gray-400 font-medium">Hoặc tiếp tục với</span>
        </div>
      </div>

      {layout === 'full' ? (
        <div className="space-y-2.5">
          {/* Real Google Button - Directly opens official Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isVerifying}
            className="w-full h-10 flex items-center justify-center gap-2.5 px-4 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 text-xs sm:text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isVerifying && activeProvider === 'Google' ? (
              <span className="w-4 h-4 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isVerifying && activeProvider === 'Google'
                ? 'Đang kết nối Google...'
                : 'Đăng nhập với Google'}
            </span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={isVerifying}
            className="w-full h-10 flex items-center justify-center gap-2.5 px-4 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 text-xs sm:text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isVerifying && activeProvider === 'Facebook' ? (
              <span className="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span>
              {isVerifying && activeProvider === 'Facebook'
                ? 'Đang kết nối Facebook...'
                : 'Đăng nhập với Facebook'}
            </span>
          </button>
        </div>
      ) : (
        /* Compact layout for Modals */
        <div className="space-y-2">
          {/* Quick Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isVerifying}
            className="w-full h-9 flex items-center justify-center gap-2.5 px-3 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isVerifying && activeProvider === 'Google' ? (
              <span className="w-3.5 h-3.5 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isVerifying && activeProvider === 'Google'
                ? 'Đang kết nối Google...'
                : 'Đăng nhập với Google'}
            </span>
          </button>

          {/* Quick Facebook */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={isVerifying}
            className="w-full h-9 flex items-center justify-center gap-2.5 px-3 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isVerifying && activeProvider === 'Facebook' ? (
              <span className="w-3.5 h-3.5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span>
              {isVerifying && activeProvider === 'Facebook'
                ? 'Đang kết nối Facebook...'
                : 'Đăng nhập với Facebook'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
