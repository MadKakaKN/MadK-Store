import React from 'react';
import { OrderDto } from '../../../../types/order';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: OrderDto;
  onViewDetails: (order: OrderDto) => void;
  onRequestCancel: (order: OrderDto) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onRequestCancel,
}) => {
  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const isCancellable =
    order.status === 'Pending' ||
    order.status === 'Confirmed' ||
    order.status === 'PendingPayment';

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-5">
      {/* Top row: Order Number, Date, Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900 font-mono tracking-tight">
            #{order.orderNumber}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-mono">
            {formatDate(order.createdAt)}
          </span>
        </div>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      {/* Items Preview */}
      <div className="space-y-3">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.thumbnailUrlSnapshot ? (
                  <img
                    src={item.thumbnailUrlSnapshot}
                    alt={item.productNameSnapshot}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">⌨️</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">
                  {item.productNameSnapshot}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {item.variantNameSnapshot} <span className="text-slate-400">× {item.quantity}</span>
                </p>
              </div>
            </div>
            <span className="font-bold text-slate-800 flex-shrink-0 font-mono">
              {formatVnd(item.totalPrice)}
            </span>
          </div>
        ))}

        {order.items.length > 3 && (
          <p className="text-xs text-slate-400 italic text-center pt-1">
            + {order.items.length - 3} sản phẩm khác trong đơn hàng
          </p>
        )}
      </div>

      {/* Bottom Summary & Actions */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500">
            Tổng cộng ({totalQuantity} món):
          </span>
          <p className="text-base font-black text-brand-600 font-mono mt-0.5">
            {formatVnd(order.totalAmount)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCancellable && (
            <button
              type="button"
              onClick={() => onRequestCancel(order)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200"
            >
              Hủy đơn
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 shadow-2xs"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};
