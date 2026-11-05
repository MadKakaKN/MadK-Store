import React from 'react';
import { OrderDto } from '../../../../types/order';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: OrderDto;
  onViewDetails: (order: OrderDto) => void;
  onRequestCancel: (order: OrderDto) => void;
  onRequestReturn?: (order: OrderDto) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onRequestCancel,
  onRequestReturn,
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

  const isBankTransfer =
    order.paymentMethod === 'BankTransfer' || (order.paymentMethod as unknown) === 3;
  const isMoMo =
    order.paymentMethod === 'MoMo' || (order.paymentMethod as unknown) === 4;
  const isUnpaidOnline =
    (isBankTransfer || isMoMo) && order.paymentStatus === 'Pending' && order.status !== 'Cancelled';

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
        {order.items.slice(0, 3).map((item) => {
          const productName = item.productName || item.productNameSnapshot || 'Sản phẩm công nghệ';
          const variantName = item.variantName || item.variantNameSnapshot || '';
          const thumbnail = item.thumbnailUrl || item.thumbnailUrlSnapshot;

          return (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">📱</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {productName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {variantName} <span className="text-slate-400">× {item.quantity}</span>
                  </p>
                </div>
              </div>
              <span className="font-bold text-slate-800 flex-shrink-0 font-mono">
                {formatVnd(item.totalPrice)}
              </span>
            </div>
          );
        })}

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
          <p className="text-base font-black text-blue-600 font-mono mt-0.5">
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

          {onRequestReturn && order.status === 'Completed' && (
            <button
              type="button"
              id={`order-card-return-${order.orderNumber}`}
              onClick={() => onRequestReturn(order)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200 flex items-center gap-1"
            >
              <span>↩️</span> Đổi trả
            </button>
          )}

          {order.status === 'Completed' && order.items.length > 0 && order.items[0]?.productId && (
            <a
              href={`/products/${order.items[0].productId}?tab=reviews`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200 flex items-center gap-1"
            >
              <span>⭐</span>
              <span>Đánh giá</span>
            </a>
          )}

          {isUnpaidOnline && (
            <button
              type="button"
              onClick={() => onViewDetails(order)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>{isBankTransfer ? '🏦 Quét VietQR' : '📱 Trả qua MoMo'}</span>
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
