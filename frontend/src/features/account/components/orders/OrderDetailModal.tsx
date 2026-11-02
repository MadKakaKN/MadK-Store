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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldName ? null : prev));
    }, 2000);
  };

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

  const isBankTransfer =
    order.paymentMethod === 'BankTransfer' || (order.paymentMethod as unknown) === 3;
  const isMoMo =
    order.paymentMethod === 'MoMo' || (order.paymentMethod as unknown) === 4;
  const isUnpaidOnline =
    (isBankTransfer || isMoMo) && order.paymentStatus === 'Pending' && order.status !== 'Cancelled';

  const paymentMeta = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
    label: order.paymentStatus,
    color: 'text-slate-600 bg-slate-100',
  };

  const paymentStatusLabel =
    order.paymentStatus === 'Paid'
      ? 'Đã thanh toán'
      : isBankTransfer && order.paymentStatus === 'Pending'
      ? 'Chờ chuyển khoản VietQR'
      : isMoMo && order.paymentStatus === 'Pending'
      ? 'Chờ chuyển tiền MoMo'
      : order.paymentMethod === 'COD' && order.paymentStatus === 'Pending'
      ? 'Chờ thanh toán khi nhận hàng (COD)'
      : paymentMeta.label;

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
                      {order.paymentMethod === 'BankTransfer'
                        ? 'Chuyển khoản VietQR (Techcombank)'
                        : order.paymentMethod === 'MoMo'
                        ? 'Ví điện tử MoMo'
                        : order.paymentMethod === 'VNPay'
                        ? 'Cổng VNPay'
                        : 'Thanh toán khi nhận hàng (COD)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Trạng thái thanh toán:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-md ${paymentMeta.color}`}>
                      {paymentStatusLabel}
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

          {/* VietQR / MoMo Payment Box if order is awaiting online payment */}
          {isUnpaidOnline && (
            <section
              id="order-detail-qr-payment"
              className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-7 text-white border border-indigo-500/30 shadow-xl shadow-indigo-950/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl flex-shrink-0">
                    {isBankTransfer ? '🏦' : '📱'}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>{isBankTransfer ? 'Quét mã VietQR (Techcombank) để thanh toán' : 'Thanh toán qua Ví điện tử MoMo'}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Vui lòng thanh toán để đơn hàng được nhân viên xác nhận và đóng gói giao ngay.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Chờ nhận thanh toán</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-5">
                {/* QR Code */}
                <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-white inline-block">
                    {isBankTransfer ? (
                      <img
                        src={`https://img.vietqr.io/image/TCB-19050430057012-compact2.png?amount=${Math.round(order.totalAmount)}&addInfo=${encodeURIComponent(`MADK ${order.orderNumber}`)}&accountName=${encodeURIComponent('NGUYEN HOANG KHANG')}`}
                        alt="Mã VietQR Techcombank"
                        className="w-48 sm:w-56 h-auto object-contain rounded-xl"
                      />
                    ) : (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`2|99|0901316434|NGUYEN HOANG KHANG||0|0|${Math.round(order.totalAmount)}|MADK ${order.orderNumber}|transfer_p2p`)}`}
                        alt="Mã QR MoMo"
                        className="w-48 sm:w-56 h-auto object-contain rounded-xl"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium max-w-xs leading-relaxed">
                    {isBankTransfer
                      ? 'Mở App Ngân hàng bất kỳ (VCB, TCB, MB, ACB, BIDV...) quét mã để tự điền số tiền & nội dung'
                      : 'Mở ứng dụng MoMo và chọn Quét mã QR'}
                  </p>
                  <a
                    href={`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-300 hover:text-white underline font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Mở trang thanh toán riêng biệt</span>
                    <span>↗</span>
                  </a>
                </div>

                {/* Transfer Details with 1-Click Copy */}
                <div className="md:col-span-7 space-y-2.5 text-xs">
                  {isBankTransfer ? (
                    <>
                      {/* Ngân hàng & STK */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Số tài khoản Techcombank</span>
                          <span className="text-base font-mono font-black text-emerald-400 mt-0.5 block tracking-wider">
                            19050430057012
                          </span>
                          <span className="text-[11px] text-slate-300">Chủ TK: NGUYEN HOANG KHANG</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('19050430057012', 'stk')}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
                        >
                          <span>{copiedField === 'stk' ? '✓ Đã chép' : '📋 Chép STK'}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* MoMo SĐT */}
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Số điện thoại MoMo</span>
                          <span className="text-base font-mono font-black text-pink-400 mt-0.5 block tracking-wider">
                            0901316434
                          </span>
                          <span className="text-[11px] text-slate-300">Chủ ví: NGUYEN HOANG KHANG</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('0901316434', 'momo_phone')}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
                        >
                          <span>{copiedField === 'momo_phone' ? '✓ Đã chép' : '📋 Chép SĐT'}</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Số tiền cần thanh toán */}
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Số tiền cần chuyển</span>
                      <span className="text-base font-mono font-black text-amber-400 mt-0.5 block">
                        {formatVnd(order.totalAmount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(Math.round(order.totalAmount).toString(), 'amount')}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span>{copiedField === 'amount' ? '✓ Đã chép' : '📋 Chép số tiền'}</span>
                    </button>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Nội dung chuyển khoản (bắt buộc)
                      </span>
                      <span className="text-base font-mono font-black text-emerald-300 mt-0.5 block tracking-wider">
                        MADK {order.orderNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`MADK ${order.orderNumber}`, 'note')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm flex-shrink-0"
                    >
                      <span>{copiedField === 'note' ? '✓ Đã chép' : '📋 Chép nội dung'}</span>
                    </button>
                  </div>

                  {/* Lưu ý */}
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400">💡</span>
                    <p className="leading-snug">
                      Vui lòng chuyển <strong>chính xác nội dung</strong> để hệ thống tự động gán thanh toán vào đơn hàng này.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Items Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📦</span>
              <span>Chi tiết sản phẩm ({order.items.length} món)</span>
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {order.items.map((item) => {
                const productName = item.productName || item.productNameSnapshot || 'Sản phẩm công nghệ';
                const variantName = item.variantName || item.variantNameSnapshot || '';
                const sku = item.sku || item.skuSnapshot || '';
                const unitPrice = item.unitPrice ?? item.unitPriceSnapshot ?? (item.quantity > 0 ? item.totalPrice / item.quantity : 0);
                const thumbnail = item.thumbnailUrl || item.thumbnailUrlSnapshot;

                return (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">📱</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {productName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Phân loại: <strong className="text-slate-700">{variantName}</strong>
                        </p>
                        {sku && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {sku}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-brand-600">
                        {formatVnd(unitPrice)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        x <span className="font-bold text-slate-900">{item.quantity}</span>
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">
                        {formatVnd(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
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
                    } catch {
                      // Bỏ qua lỗi cú pháp JSON không hợp lệ
                    }
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
