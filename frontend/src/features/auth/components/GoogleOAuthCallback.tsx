import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { tokenStorage } from '../../../api/authApi';
import { SocialLoginRequestDto } from '../../../types/auth';

/**
 * Global OAuth callback handler for Social Logins (Google & Facebook).
 * 
 * Flow: OAuth redirects to origin with access_token in hash:
 * - Google: https://mad-k-store.vercel.app/#access_token=...
 * - Facebook: https://mad-k-store.vercel.app/#access_token=...&state=facebook
 * 
 * Intercepts the hash, fetches user info from provider, calls backend socialLogin,
 * and navigates to the appropriate page.
 */
export const GoogleOAuthCallback: React.FC = () => {
  const { socialLogin } = useAuth();
  const isProcessing = useRef(false);

  useEffect(() => {
    // Check for access_token in URL hash
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=') || isProcessing.current) {
      return;
    }

    isProcessing.current = true;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const state = params.get('state');

    if (!accessToken) {
      isProcessing.current = false;
      return;
    }

    // Clean the URL hash immediately to prevent re-processing
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    const isFacebook = state === 'facebook' || hash.includes('state=facebook');

    const processOAuthLogin = async () => {
      try {
        let payload: SocialLoginRequestDto;

        if (isFacebook) {
          // Fetch Facebook User Profile from Graph API
          const fbRes = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture.width(200)&access_token=${accessToken}`
          );
          if (!fbRes.ok) {
            throw new Error('Graph API của Facebook trả về lỗi.');
          }
          const fbProfile = await fbRes.json();
          const email = fbProfile.email || `${fbProfile.id}@facebook.user`;

          payload = {
            provider: 'Facebook',
            email,
            fullName: fbProfile.name || 'Người dùng Facebook',
            avatarUrl: fbProfile.picture?.data?.url,
            idToken: accessToken,
          };
        } else {
          // Fetch Google User Profile
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!profileRes.ok) {
            throw new Error('Google API trả về lỗi.');
          }

          const profile = await profileRes.json();

          if (!profile.email) {
            throw new Error('Không thể lấy email từ tài khoản Google.');
          }

          payload = {
            provider: 'Google',
            email: profile.email,
            fullName: profile.name || profile.given_name || profile.email?.split('@')[0] || 'Google User',
            avatarUrl: profile.picture,
            idToken: accessToken,
          };
        }

        const res = await socialLogin(payload);

        if (res.success) {
          const currentUser = tokenStorage.getUser();
          const isAdmin = currentUser?.roles?.includes('Admin');
          window.location.href = isAdmin ? '/admin' : '/';
        } else {
          console.error('[OAuthCallback] Social login failed:', res.error);
          window.location.href = '/auth/login?error=' + encodeURIComponent(res.error || 'Đăng nhập mạng xã hội thất bại.');
        }
      } catch (err) {
        console.error('[OAuthCallback] Error processing login:', err);
        const msg = err instanceof Error ? err.message : 'Lỗi xử lý đăng nhập mạng xã hội.';
        window.location.href = '/auth/login?error=' + encodeURIComponent(msg);
      } finally {
        isProcessing.current = false;
      }
    };

    processOAuthLogin();
  }, [socialLogin]);

  return null;
};

export default GoogleOAuthCallback;

