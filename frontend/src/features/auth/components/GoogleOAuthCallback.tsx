import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocialLoginRequestDto } from '../../../types/auth';

/**
 * Global Google OAuth callback handler.
 * After Google OAuth redirect, the access_token is in the URL hash (e.g., /#access_token=...).
 * Since redirect_uri = origin, the user lands on "/" (HomePage) which doesn't have SocialAuthButtons.
 * This component runs at the App level and handles the token from any page.
 */
export const GoogleOAuthCallback: React.FC = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const isProcessing = useRef(false);

  useEffect(() => {
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

    // Clean the URL hash immediately
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    // Fetch Google user profile and login
    (async () => {
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await profileRes.json();

        if (!profile.email) {
          throw new Error('Không thể lấy email từ tài khoản Google.');
        }

        const payload: SocialLoginRequestDto = {
          provider: 'Google',
          email: profile.email,
          fullName: profile.name || profile.given_name || profile.email.split('@')[0],
          avatarUrl: profile.picture,
          idToken: accessToken,
        };

        const res = await socialLogin(payload);
        if (res.success) {
          // Navigate to account page after successful login
          navigate('/account', { replace: true });
        } else {
          // On failure, redirect to login with error
          navigate('/auth/login', { replace: true });
        }
      } catch {
        navigate('/auth/login', { replace: true });
      } finally {
        isProcessing.current = false;
      }
    })();
  }, [socialLogin, navigate]);

  return null; // This component renders nothing
};

export default GoogleOAuthCallback;
