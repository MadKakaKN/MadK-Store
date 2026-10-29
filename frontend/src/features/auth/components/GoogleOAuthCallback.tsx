import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokenStorage } from '../../../api/authApi';
import { SocialLoginRequestDto } from '../../../types/auth';

/**
 * Global Google OAuth callback handler.
 * 
 * Flow: Google OAuth redirects to origin (e.g., https://mad-k-store.vercel.app/#access_token=...)
 * This component intercepts the hash, fetches user info from Google, calls backend socialLogin,
 * and navigates to the appropriate page.
 * 
 * Runs at App level so it works regardless of which page the hash lands on.
 */
export const GoogleOAuthCallback: React.FC = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const isProcessing = useRef(false);

  useEffect(() => {
    // Check for access_token in URL hash (Google OAuth implicit flow response)
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=') || isProcessing.current) {
      return;
    }

    isProcessing.current = true;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (!accessToken) {
      isProcessing.current = false;
      return;
    }

    // Clean the URL hash immediately to prevent re-processing
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    // Fetch Google user profile and call backend social login
    const processGoogleLogin = async () => {
      try {
        // Step 1: Get user info from Google
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

        // Step 2: Call backend social login API
        const payload: SocialLoginRequestDto = {
          provider: 'Google',
          email: profile.email,
          fullName: profile.name || profile.given_name || profile.email.split('@')[0],
          avatarUrl: profile.picture,
          idToken: accessToken,
        };

        const res = await socialLogin(payload);
        
        if (res.success) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const currentUser = tokenStorage.getUser();
          const isAdmin = currentUser?.roles?.includes('Admin');
          if (isAdmin) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          console.error('[GoogleOAuth] Social login failed:', res.error);
          navigate('/auth/login?error=' + encodeURIComponent(res.error || 'Đăng nhập Google thất bại.'), { replace: true });
        }
      } catch (err) {
        console.error('[GoogleOAuth] Error processing Google login:', err);
        const msg = err instanceof Error ? err.message : 'Lỗi xử lý đăng nhập Google.';
        navigate('/auth/login?error=' + encodeURIComponent(msg), { replace: true });
      } finally {
        isProcessing.current = false;
      }
    };

    processGoogleLogin();
  }, [socialLogin, navigate]);

  return null;
};

export default GoogleOAuthCallback;
