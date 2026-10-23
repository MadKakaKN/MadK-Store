import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocialLoginRequestDto } from '../../../types/auth';

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
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<'Google' | 'GitHub' | 'Facebook'>('Google');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const executeSocialLogin = async (data: SocialLoginRequestDto) => {
    setActiveProvider(data.provider);
    try {
      const res = await socialLogin(data);
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (onError) {
          onError(res.error || `Đăng nhập ${data.provider} không thành công.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Lỗi đăng nhập ${data.provider}.`;
      if (onError) {
        onError(msg);
      }
    } finally {
      setActiveProvider(null);
      setShowCustomModal(false);
    }
  };

  const handleQuickLogin = (provider: 'Google' | 'GitHub' | 'Facebook') => {
    // Demo accounts simulating standard OAuth2 identity payloads
    let payload: SocialLoginRequestDto;

    if (provider === 'Google') {
      payload = {
        provider: 'Google',
        email: 'user.google@gmail.com',
        fullName: 'Nguyễn Văn Minh (Google)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        idToken: 'mock_google_id_token_' + Date.now(),
      };
    } else if (provider === 'GitHub') {
      payload = {
        provider: 'GitHub',
        email: 'dev.github@users.noreply.github.com',
        fullName: 'MadK Developer (GitHub)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        accessToken: 'gho_mock_token_' + Date.now(),
      };
    } else {
      payload = {
        provider: 'Facebook',
        email: 'user.social@facebook.com',
        fullName: 'Minh Nguyễn (Facebook)',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        accessToken: 'fb_mock_token_' + Date.now(),
      };
    }

    executeSocialLogin(payload);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    executeSocialLogin({
      provider: selectedProvider,
      email: customEmail.trim(),
      fullName: customName.trim() || undefined,
      idToken: `custom_${selectedProvider.toLowerCase()}_${Date.now()}`,
    });
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
          {/* Primary Google Login Button */}
          <button
            type="button"
            onClick={() => handleQuickLogin('Google')}
            disabled={activeProvider !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {activeProvider === 'Google' ? (
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
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
            )}
            <span>Đăng nhập với Google</span>
          </button>

          {/* Secondary Row: GitHub & Facebook */}
          <div className="grid grid-cols-2 gap-3">
            {/* GitHub Button */}
            <button
              type="button"
              onClick={() => handleQuickLogin('GitHub')}
              disabled={activeProvider !== null}
              className="flex items-center justify-center gap-2.5 py-2.5 px-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs text-xs font-semibold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {activeProvider === 'GitHub' ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              )}
              <span>GitHub</span>
            </button>

            {/* Facebook Button */}
            <button
              type="button"
              onClick={() => handleQuickLogin('Facebook')}
              disabled={activeProvider !== null}
              className="flex items-center justify-center gap-2.5 py-2.5 px-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs text-xs font-semibold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {activeProvider === 'Facebook' ? (
                <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              <span>Facebook</span>
            </button>
          </div>

          {/* Option to test custom email */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="text-[11px] font-medium text-slate-400 hover:text-brand-600 transition-colors"
            >
              ⚙️ Tùy chỉnh tài khoản mạng xã hội để kiểm thử
            </button>
          </div>
        </div>
      ) : (
        /* Compact layout for Modals */
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleQuickLogin('Google')}
            disabled={activeProvider !== null}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
          >
            {activeProvider === 'Google' ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
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
            )}
            <span>Đăng nhập nhanh với Google</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('GitHub')}
              disabled={activeProvider !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
            >
              <svg className="w-3.5 h-3.5 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Facebook')}
              disabled={activeProvider !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
            >
              <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal to test custom social email */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Mô phỏng đăng nhập mạng xã hội</h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nền tảng</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Google', 'GitHub', 'Facebook'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedProvider(p)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        selectedProvider === p
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Địa chỉ Email {selectedProvider}
                </label>
                <input
                  type="email"
                  required
                  placeholder={`ban@${selectedProvider.toLowerCase()}.com`}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Họ tên hiển thị</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-xs"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
