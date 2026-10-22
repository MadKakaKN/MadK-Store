import { useState, useEffect } from 'react';

export interface WebGLSupportInfo {
  isSupported: boolean;
  isMobile: boolean;
  maxDpr: number;
  reason?: string;
}

/**
 * Detects WebGL/WebGL2 support and mobile device constraints
 * to optimize Three.js render loop and pixel ratio.
 */
export function useWebGLSupport(): WebGLSupportInfo {
  const [support, setSupport] = useState<WebGLSupportInfo>(() => {
    // Initial safe defaults (SSR safe)
    if (typeof window === 'undefined') {
      return { isSupported: true, isMobile: false, maxDpr: 1.5 };
    }

    const isMobile =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');

      if (!gl) {
        return {
          isSupported: false,
          isMobile,
          maxDpr: 1,
          reason: 'Trình duyệt hoặc phần cứng không hỗ trợ WebGL.',
        };
      }

      // Limit DPR on mobile to 1.5 to protect battery and maintain 60 FPS
      const rawDpr = window.devicePixelRatio || 1;
      const maxDpr = isMobile ? Math.min(rawDpr, 1.5) : Math.min(rawDpr, 2);

      return {
        isSupported: true,
        isMobile,
        maxDpr,
      };
    } catch (e) {
      return {
        isSupported: false,
        isMobile,
        maxDpr: 1,
        reason: (e as Error).message || 'Lỗi khởi tạo ngữ cảnh đồ họa WebGL.',
      };
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const rawDpr = window.devicePixelRatio || 1;
      const maxDpr = isMobile ? Math.min(rawDpr, 1.5) : Math.min(rawDpr, 2);

      setSupport((prev) => ({
        ...prev,
        isMobile,
        maxDpr,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return support;
}
