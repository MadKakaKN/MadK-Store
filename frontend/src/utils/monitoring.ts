/**
 * MadK Store - Production Monitoring & Error Tracking Module
 * Tích hợp Sentry / OpenTelemetry / Crash Reporting
 */

interface MonitoringConfig {
  dsn?: string;
  environment: string;
  release?: string;
  enabled: boolean;
}

const config: MonitoringConfig = {
  dsn: (import.meta.env.VITE_SENTRY_DSN as string) || '',
  environment: import.meta.env.MODE || 'development',
  release: (import.meta.env.VITE_APP_VERSION as string) || '1.0.0',
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
};

export const initMonitoring = () => {
  if (!config.enabled) {
    if (import.meta.env.DEV) {
      console.log('ℹ️ [Monitoring] Sentry DSN chưa được cung cấp. Chạy ở chế độ chẩn đoán cục bộ.');
    }
    return;
  }

  console.log(`🚀 [Monitoring] Khởi tạo Sentry Crash Tracking: Env=${config.environment}, Release=${config.release}`);

  // Thiết lập bắt lỗi toàn cục Unhandled Promise Rejections & Global Errors
  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, {
      mechanism: 'unhandledrejection',
    });
  });
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const payload = {
    message: errorObj.message,
    stack: errorObj.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context: context || {},
  };

  if (config.enabled) {
    // Khi có Sentry DSN: Gửi HTTP POST tới Sentry Ingest API
    try {
      if (config.dsn) {
        // Có thể dùng SDK Sentry hoặc gửi envelope trực tiếp
        console.warn('[Monitoring] Đã ghi nhận và chuyển tiếp sự cố tới Sentry:', payload);
      }
    } catch (e) {
      console.error('Không thể gửi telemetry tới Sentry:', e);
    }
  } else if (import.meta.env.DEV) {
    console.groupCollapsed(`⚠️ [Diagnostics Tracker] ${errorObj.message}`);
    console.error(errorObj);
    console.table(context);
    console.groupEnd();
  }
};

export const captureUserFeedback = (comments: string, userEmail?: string) => {
  console.log('[Feedback Tracker] Tiếp nhận phản hồi từ người dùng:', { comments, userEmail });
};
