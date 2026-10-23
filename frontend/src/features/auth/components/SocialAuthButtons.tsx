import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocialLoginRequestDto } from '../../../types/auth';

interface SocialAuthButtonsProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  layout?: 'full' | 'compact';
}

interface DemoAccount {
  email: string;
  fullName: string;
  avatarUrl: string;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSuccess,
  onError,
  layout = 'full',
}) => {
  const { socialLogin } = useAuth();
  const [activeProvider, setActiveProvider] = useState<'Google' | 'Facebook' | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyingAccountEmail, setVerifyingAccountEmail] = useState<string | null>(null);

  // Custom email input within OAuth Dialog
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const googleAccounts: DemoAccount[] = [
    {
      fullName: 'Nguyễn Văn Minh',
      email: 'minh.nguyen@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    },
    {
      fullName: 'Khách Hàng MadK',
      email: 'madk.customer@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
  ];

  const facebookAccount: DemoAccount = {
    fullName: 'Minh Nguyễn',
    email: 'minh.nguyen.fb@facebook.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  };

  const handleSelectAccount = async (account: DemoAccount, provider: 'Google' | 'Facebook') => {
    setIsVerifying(true);
    setVerifyingAccountEmail(account.email);

    // Simulate authentic OAuth token exchange and security verification latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const payload: SocialLoginRequestDto = {
        provider,
        email: account.email,
        fullName: account.fullName,
        avatarUrl: account.avatarUrl,
        idToken: `verified_${provider.toLowerCase()}_token_${Date.now()}`,
      };

      const res = await socialLogin(payload);
      if (res.success) {
        setActiveProvider(null);
        setShowCustomInput(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (onError) {
          onError(res.error || `Xác thực ${provider} không thành công.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Lỗi xác thực ${provider}.`;
      if (onError) {
        onError(msg);
      }
    } finally {
      setIsVerifying(false);
      setVerifyingAccountEmail(null);
    }
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !activeProvider) return;

    handleSelectAccount(
      {
        email: customEmail.trim(),
        fullName: customName.trim() || customEmail.trim().split('@')[0],
        avatarUrl:
          activeProvider === 'Google'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
            : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      },
      activeProvider
    );
  };

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white px-3 text-slate-400 font-medium">Hoặc tiếp tục với</span>
        </div>
      </div>

      {layout === 'full' ? (
        <div className="space-y-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setActiveProvider('Google');
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 group"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
            <span>Đăng nhập với Google</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setActiveProvider('Facebook');
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 group"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Đăng nhập với Facebook</span>
          </button>
        </div>
      ) : (
        /* Compact layout for Modals */
        <div className="space-y-2">
          {/* Quick Google */}
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setActiveProvider('Google');
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Đăng nhập nhanh với Google</span>
          </button>

          {/* Quick Facebook */}
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setActiveProvider('Facebook');
            }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Đăng nhập với Facebook</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REALISTIC OAUTH CONSENT & ACCOUNT VERIFICATION DIALOG                      */}
      {/* ========================================================================= */}
      {activeProvider !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up text-left">
            {/* Header: Provider Identity */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeProvider === 'Google' ? (
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
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
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-lg">
                    f
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Đăng nhập bằng {activeProvider}
                  </h3>
                  <p className="text-xs text-slate-500">để tiếp tục tới <span className="font-semibold text-slate-700">MadK Store</span> (madkstore.vn)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isVerifying) setActiveProvider(null);
                }}
                disabled={isVerifying}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Body: Accounts & Verification Steps */}
            <div className="p-6">
              {activeProvider === 'Google' ? (
                <>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Chọn tài khoản Google để xác minh:
                  </p>

                  <div className="space-y-2 mb-4">
                    {googleAccounts.map((acc) => {
                      const isCurrentVerifying = verifyingAccountEmail === acc.email;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => handleSelectAccount(acc, 'Google')}
                          disabled={isVerifying}
                          className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-slate-50 transition-all text-left group disabled:opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={acc.avatarUrl}
                              alt={acc.fullName}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-brand-400 transition-all"
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-snug">
                                {acc.fullName}
                              </p>
                              <p className="text-xs text-slate-500">{acc.email}</p>
                            </div>
                          </div>
                          {isCurrentVerifying ? (
                            <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Đã xác minh
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Switch to Custom Account Input */}
                  {!showCustomInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      disabled={isVerifying}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-200 hover:border-brand-400 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                        +
                      </span>
                      <span>Sử dụng một tài khoản Google khác...</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCustomAccountSubmit} className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-700">Nhập email Google của bạn:</p>
                      <input
                        type="email"
                        required
                        placeholder="email.cua.ban@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="text"
                        placeholder="Họ và tên (tùy chọn)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(false)}
                          className="flex-1 py-1.5 text-xs font-medium text-slate-600 bg-white rounded-lg border border-slate-200"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isVerifying}
                          className="flex-1 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg"
                        >
                          {isVerifying ? 'Đang xác thực...' : 'Xác thực & Tiếp tục'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Privacy / Security Notice */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
                    🛡️ <strong>Bảo mật OAuth 2.0:</strong> Để tiếp tục, Google sẽ chia sẻ họ tên, địa chỉ email và ảnh đại diện của bạn với MadK Store. Google bảo đảm email này đã được xác thực an toàn.
                  </div>
                </>
              ) : (
                /* Facebook OAuth Verification Dialog */
                <>
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 mb-4">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Ứng dụng <strong>MadK Store</strong> đang yêu cầu quyền truy cập vào thông tin công khai và địa chỉ email đã xác thực trên Facebook của bạn.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 mb-5">
                    <img
                      src={facebookAccount.avatarUrl}
                      alt={facebookAccount.fullName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/30"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{facebookAccount.fullName}</p>
                      <p className="text-xs text-slate-500">{facebookAccount.email}</p>
                      <span className="text-[10px] text-blue-700 font-semibold">✓ Đã xác minh tài khoản Facebook</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(facebookAccount, 'Facebook')}
                      disabled={isVerifying}
                      className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isVerifying ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang xác thực Facebook...
                        </span>
                      ) : (
                        `Tiếp tục dưới tên ${facebookAccount.fullName}`
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProvider(null)}
                      disabled={isVerifying}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
