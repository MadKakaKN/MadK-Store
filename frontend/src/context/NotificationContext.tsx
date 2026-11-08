import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signalRManager,
  playNotificationChime,
  RealtimeOrderPayload,
  RealtimeStatusPayload,
  RealtimePaymentPayload,
  RealtimeLowStockPayload,
} from '../services/signalrService';

export interface AppNotification {
  id: string;
  type: 'ORDER' | 'STATUS' | 'PAYMENT' | 'STOCK' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  linkUrl?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  activeToast: AppNotification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const item: AppNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [item, ...prev.slice(0, 49)]); // Giữ tối đa 50 thông báo gần nhất
    setActiveToast(item);
    playNotificationChime();

    // Tự tắt popup sau 5 giây
    setTimeout(() => {
      setActiveToast((current) => (current?.id === item.id ? null : current));
    }, 6000);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupSignalR = async () => {
      const conn = await signalRManager.startConnection();
      if (!conn || !isMounted) return;

      // 1. Nhận thông báo đơn hàng mới
      conn.on('ReceiveNewOrder', (payload: RealtimeOrderPayload) => {
        if (!isMounted) return;
        addNotification({
          type: 'ORDER',
          title: payload.title || 'Đơn hàng mới!',
          message: payload.message || `Đơn hàng #${payload.orderNumber} vừa được tạo thành công.`,
          linkUrl: `/admin/orders?search=${encodeURIComponent(payload.orderNumber)}`,
        });
      });

      // 2. Nhận thông báo chuyển trạng thái đơn hàng
      conn.on('ReceiveOrderStatusChanged', (payload: RealtimeStatusPayload) => {
        if (!isMounted) return;
        addNotification({
          type: 'STATUS',
          title: payload.title || 'Cập nhật đơn hàng',
          message: payload.message || `Đơn hàng #${payload.orderNumber} đổi sang '${payload.newStatus}'.`,
          linkUrl: `/admin/orders?search=${encodeURIComponent(payload.orderNumber)}`,
        });
      });

      // 3. Nhận thông báo thanh toán thành công
      conn.on('ReceivePaymentReceived', (payload: RealtimePaymentPayload) => {
        if (!isMounted) return;
        addNotification({
          type: 'PAYMENT',
          title: payload.title || 'Thanh toán thành công!',
          message: payload.message || `Đã nhận tiền cho đơn #${payload.orderNumber}.`,
          linkUrl: `/admin/orders?search=${encodeURIComponent(payload.orderNumber)}`,
        });
      });

      // 4. Nhận cảnh báo tồn kho thấp
      conn.on('ReceiveLowStockAlert', (payload: RealtimeLowStockPayload) => {
        if (!isMounted) return;
        addNotification({
          type: 'STOCK',
          title: payload.title || 'Cảnh báo sắp hết hàng!',
          message: payload.message || `Sản phẩm '${payload.productName}' (${payload.sku}) chỉ còn ${payload.availableQuantity} chiếc.`,
          linkUrl: `/admin/inventory?search=${encodeURIComponent(payload.sku)}`,
        });
      });
    };

    setupSignalR();

    return () => {
      isMounted = false;
    };
  }, [addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        activeToast,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Real-time Toast Notification (Góc trên bên phải) */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              {activeToast.type === 'ORDER' && <span>🛒</span>}
              {activeToast.type === 'PAYMENT' && <span>💰</span>}
              {activeToast.type === 'STOCK' && <span>⚠️</span>}
              {activeToast.type === 'STATUS' && <span>📦</span>}
              {activeToast.type === 'SYSTEM' && <span>🔔</span>}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-blue-300 uppercase tracking-wider">
                {activeToast.title}
              </p>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed line-clamp-2">
                {activeToast.message}
              </p>
              {activeToast.linkUrl && (
                <a
                  href={activeToast.linkUrl}
                  onClick={() => {
                    markAsRead(activeToast.id);
                    dismissToast();
                  }}
                  className="inline-block mt-2 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Xem chi tiết &rarr;
                </a>
              )}
            </div>

            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors text-xs shrink-0"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
