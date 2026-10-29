import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface GuestRouteProps {
  children: React.ReactElement;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const redirectParam = searchParams.get('redirect') || searchParams.get('returnUrl');
    const safeRedirect = redirectParam && !redirectParam.startsWith('/auth') ? redirectParam : '/';
    const targetUrl = user?.roles?.includes('Admin') && (!redirectParam || redirectParam === '/')
      ? '/admin'
      : safeRedirect;

    return <Navigate to={targetUrl} replace />;
  }

  return children;
};

export default GuestRoute;
