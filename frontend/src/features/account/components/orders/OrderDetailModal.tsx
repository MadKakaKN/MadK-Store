import React, { useCallback, useEffect, useState } from 'react';
import {
  OrderDto,
  ShippingAddressSnapshotDto,
  PAYMENT_STATUS_CONFIG,
} from '../../../../types/order';
import { ReturnRequestDto, isActiveReturn } from '../../../../types/return';
import returnApi from '../../../../api/returnApi';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderHistoryTimeline } from './OrderHistoryTimeline';
import { ReturnRequestsPanel } from './ReturnRequestsPanel';

interface OrderDetailModalProps {
  order: OrderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestCancel: (order: OrderDto) => void;
  onRequestReturn?: (order: OrderDto) => void;
  /** Tăng giá trị này để buộc tải lại danh sách yêu cầu đổi trả (sau khi tạo mới) */
  returnsRefreshKey?: number;
}

/** Các trạng thái đơn có thể đã phát sinh yêu cầu đổi trả */
const RETURN_RELEVANT_STATUSES = ['Completed', 'ReturnRequested', 'Returned'];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onRequestCancel,
  onRequestReturn,
  returnsRefreshKey = 0,
}) => {
  const [returns, setReturns] = useState<ReturnRequestDto[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsError, setReturnsError] = useState<string | null>(null);

  const orderNumber = order?.orderNumber;
  const shouldLoadReturns = !!order && isOpen && RETURN_RELEVANT_STATUSES.includes(order.status);

  const loadReturns = useCallback(async () => {
    if (!orderNumber) return;
    setReturnsLoading(true);
    setReturnsError(null);
    try {
      setReturns(await returnApi.getReturnRequestsByOrder(orderNumber));
    } catch (err) {
      setReturnsError(err instanceof Error ? err.message : 'Không thể tải yêu cầu đổi trả.');
    } finally {
      setReturnsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (shouldLoadReturns) {
      loadReturns();
    } else {
      setReturns([]);
      setReturnsError(null);
    }
  }, [shouldLoadReturns, loadReturns, returnsRefreshKey]);

  if (!isOpen || !order) return null;

  // Phân tích Shipping Address Snapshot
  let address: ShippingAddressSnapshotDto | null = null;
  try {
    if (order.shippingAddressSnapshot) {
      address = JSON.parse(order.shippingAddressSnapshot);
    }
  } catch {
    address = null;
  }

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

  const isCancellable =
    order.status === 'Pending' ||
    order.status === 'Confirmed' ||
    order.status === 'PendingPayment';

  const hasActiveReturn = returns.some(isActiveReturn);
  const canRequestReturn =
    !!onRequestReturn && order.status === 'Completed' && !returnsLoading && !hasActiveReturn;

  const paymentMeta = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
    label: order.paymentStatus,
    color: 'text-slate-600 bg-slate-100',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col relative animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 font-mono tracking-tight">
                #{order.orderNumber}
              </h2>
              <OrderStatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Ngày đặt hàng:</span>
              <strong className="text-slate-700 font-mono">{formatDate(order.createdAt)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canRequestReturn && (
              <button
                type="button"
                id="order-detail-request-return"
                onClick={() => onRequestReturn?.(order)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5"
              >
                <span>↩️</span> Yêu cầu đổi trả
              </button>
            )}
            {isCancellable && (
              <button
                type="button"
                onClick={() => onRequestCancel(order)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 shadow-2xs"
              >
                Hủy đơn hàng
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-6 py-6">
          {/* Return / Refund Requests */}
          {shouldLoadReturns && (returnsLoading || returnsError || returns.length > 0) && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>↩️</span>
                <span>Yêu cầu đổi trả & hoàn tiền</span>
              </h3>
              <ReturnRequestsPanel
                requests={returns}
                isLoading={returnsLoading}
                error={returnsError}
                onRetry={loadReturns}
              />
            </section>
          )}

          {/* Cancellation Notice if Cancelled */}
          {order.status === 'Cancelled' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                <span>✕</span>
                <span>Đơn hàng đã bị hủy</span>
                {order.cancelledAt && (
                  <span className="text-xs font-normal text-rose-600">
                    vào lúc {formatDate(order.cancelledAt)}
                  </span>
                )}
              </div>
              {order.cancelReason && (
                <p className="mt-1 text-rose-700">
                  <strong>Lý do hủy:</strong> {order.cancelReason}
                </p>
              )}
            </div>
          )}

          {/* Delivery & Payment Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Address */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>📍</span>
                <span>Địa chỉ nhận hàng (Snapshot)</span>
              </h3>
              {address ? (
                <div className="space-y-1 text-xs text-slate-700">
                  <p className="font-bold text-sm text-slate-900">{address.recipientName}</p>
                  <p className="font-mono text-slate-600">📞 {address.phoneNumber}</p>
                  <p className="text-slate-600 leading-relaxed pt-1">
                    {address.detailedAddress}, {address.wardName}, {address.districtName},{' '}
                    {address.provinceName}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Không có thông tin địa chỉ.</p>
              )}
            </div>

            {/* Payment & Delivery Method */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>💳</span>
                  <span>Phương thức & Thanh toán</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Hình thức:</span>
                    <span className="font-bold text-slate-900">
                      {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Trạng thái thanh toán:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-md ${paymentMeta.color}`}>
                      {paymentMeta.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vận chuyển:</span>
                    <span className="font-semibold text-emerald-600">Giao hàng tiêu chuẩn (Miễn phí)</span>
                  </div>
                </div>
              </div>

              {order.customerNote && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Ghi chú của bạn:</span>
                  <p className="text-slate-700 italic mt-0.5">&ldquo;{order.customerNote}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📦</span>
              <span>Chi tiết sản phẩm ({order.items.length} món)</span>
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.thumbnailUrlSnapshot ? (
                        <img
                          src={item.thumbnailUrlSnapshot}
                          alt={item.productNameSnapshot}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">⌨️</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.productNameSnapshot}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Phân loại: <strong className="text-slate-700">{item.variantNameSnapshot}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        SKU: {item.skuSnapshot}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-brand-600">
                      {formatVnd(item.unitPriceSnapshot)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      x <span className="font-bold text-slate-900">{item.quantity}</span>
                    </p>
                    <p className="text-xs font-extrabold text-slate-900 mt-1">
                      {formatVnd(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-sm ml-auto space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Tạm tính hàng hóa:</span>
              <span className="font-mono font-medium text-slate-900">{formatVnd(order.subtotalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-600">
                <span className="flex items-center gap-1.5">
                  <span>Giảm giá:</span>
                  {(() => {
                    try {
                      if (order.couponSnapshot) {
                        const snap = JSON.parse(order.couponSnapshot);
                        if (snap.code) {
                          return <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">{snap.code}</span>;
                        }
                      }
                    } catch {}
                    return <span>(Voucher)</span>;
                  })()}
                </span>
                <span className="font-mono font-medium">-{formatVnd(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-mono font-medium text-emerald-600">
                {order.shippingFee === 0 ? '0 ₫ (Miễn phí)' : formatVnd(order.shippingFee)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
              <span>Tổng thanh toán:</span>
              <span className="text-brand-600 text-base font-black font-mono">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Audit Trail: Status History Timeline */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🕒</span>
              <span>Lịch sử chuyển trạng thái (Audit Trail)</span>
            </h3>
            <OrderHistoryTimeline history={order.statusHistory} />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
