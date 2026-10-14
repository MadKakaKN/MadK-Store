import React from 'react';
import { OrderStatusHistoryDto, ORDER_STATUS_CONFIG } from '../../../../types/order';

interface OrderHistoryTimelineProps {
  history: OrderStatusHistoryDto[];
}

export const OrderHistoryTimeline: React.FC<OrderHistoryTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-400 italic">
        Chưa có dữ liệu lịch sử trạng thái.
      </div>
    );
  }

  // Sắp xếp lịch sử theo thời gian từ mới nhất đến cũ nhất hoặc cũ nhất đến mới nhất
  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((item, index) => {
        const isLatest = index === sorted.length - 1;
        const config = ORDER_STATUS_CONFIG[item.toStatus] || {
          label: item.toStatus,
          icon: '•',
          badgeText: 'text-slate-700',
        };

        const isCancelled = item.toStatus === 'Cancelled';

        return (
          <div key={item.id} className="relative flex items-start gap-4 group">
            {/* Dot Indicator */}
            <div
              className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                isLatest
                  ? isCancelled
                    ? 'bg-rose-500 border-white text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-200'
                    : 'bg-brand-600 border-white text-white shadow-md shadow-brand-600/30 ring-2 ring-brand-200'
                  : 'bg-white border-slate-300 text-slate-500'
              }`}
            >
              {config.icon}
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/70 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {config.label}
                  </span>
                  {item.fromStatus && (
                    <span className="text-[11px] text-slate-400">
                      (từ {ORDER_STATUS_CONFIG[item.fromStatus]?.label || item.fromStatus})
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-500 font-mono">
                  {formatDate(item.createdAt)}
                </span>
              </div>

              {/* Actor & Reason */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  <span>👤</span>
                  <span>{item.changedByName || 'Hệ thống'}</span>
                </span>

                {item.reason && (
                  <span className="text-slate-600 italic">
                    Lý do: &ldquo;{item.reason}&rdquo;
                  </span>
                )}
              </div>

              {item.note && (
                <div className="mt-1.5 text-xs text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-600">Ghi chú:</span> {item.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
