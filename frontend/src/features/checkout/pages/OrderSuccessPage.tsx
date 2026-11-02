import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { OrderDto } from '../../../types/order';
import orderApi from '../../../api/orderApi';
import { formatVND } from '../../../utils/format';
import { OrderStatusBadge } from '../../account/components/orders/OrderStatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const OrderSuccess3DCanvas = React.lazy(() => import('../components/OrderSuccess3DCanvas'));

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const queryOrderNumber = searchParams.get('orderNumber');
  const stateOrder = location.state?.order as OrderDto | undefined;

  const [order, setOrder] = useState<OrderDto | null>(stateOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!stateOrder && !!queryOrderNumber);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  useEffect(() => {
    if (!order && queryOrderNumber) {
      setIsLoading(true);
      orderApi.getOrderByNumber(queryOrderNumber).then((res) => {
        if (res.isSuccess && res.data) {
          setOrder(res.data);
        }
        setIsLoading(false);
      });
    }
  }, [queryOrderNumber, order]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Đang tải xác nhận đơn hàng..." size="lg" />
      </div>
    );
  }

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const parseAddress = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  const parseJsonSafe = (raw?: string | object | null): Record<string, unknown> | null => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw as Record<string, unknown>;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const address = order ? parseAddress(order.shippingAddressSnapshot) : null;

  return (
    <div className="min-h-screen py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header & Congratulations Banner */}
      <div className="text-center space-y-4">
        {/* Hiệu ứng 3D nhẹ mừng đặt hàng thành công kèm fallback 2D */}
        <div
          id="order-success-3d-scene"
          className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-brand-500/10 border border-emerald-300/30 shadow-xl shadow-emerald-500/10 group overflow-hidden"
          title="Mô hình quà mừng 3D - MadK Store"
        >
          <React.Suspense
            fallback={
              <div className="relative flex flex-col items-center justify-center">
                <div className="text-5xl sm:text-6xl select-none animate-bounce">🎉</div>
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2" />
              </div>
            }
          >
            <OrderSuccess3DCanvas />
          </React.Suspense>
          <span className="absolute bottom-2 px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-sm text-[10px] font-bold text-white shadow-xs pointer-events-none">
            {order?.paymentMethod === 'BankTransfer'
              ? 'VietQR Chờ chuyển khoản'
              : order?.paymentMethod === 'MoMo'
              ? 'MoMo Chờ chuyển tiền'
              : 'COD Đã ghi nhận'}
          </span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
            <span>✓</span> Đặt hàng thành công
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Cảm ơn bạn đã tin chọn MadK Store!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            {order?.paymentMethod === 'BankTransfer'
              ? 'Đơn hàng của bạn đã được ghi nhận. Vui lòng quét mã VietQR hoặc chuyển khoản theo thông tin bên dưới để đơn hàng được chuẩn bị và giao sớm nhất.'
              : order?.paymentMethod === 'MoMo'
              ? 'Đơn hàng của bạn đã được ghi nhận. Vui lòng chuyển tiền qua ứng dụng MoMo theo hướng dẫn bên dưới để đơn hàng được duyệt giao nhanh nhất.'
              : 'Kiện hàng của bạn đang được nhân viên kho chuẩn bị đóng gói cẩn thận. Bạn sẽ thanh toán khi nhận hàng tận nơi.'}
          </p>
        </div>
      </div>

      {/* 2. Order Number & Status Highlight Card */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Mã đơn hàng duy nhất
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                #{order.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                title="Sao chép mã đơn"
              >
                <span>{copied ? '✓ Đã chép' : '📋 Chép'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thời gian đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <OrderStatusBadge status={order.status} size="lg" />
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Dự kiến giao: 2 - 4 ngày làm việc
            </span>
          </div>
        </div>
      )}

      {/* 2.5. VietQR or MoMo Payment Action Card (If Online Payment) */}
      {order && (order.paymentMethod === 'BankTransfer' || order.paymentMethod === 'MoMo') && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/20 border border-slate-700/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {order.paymentMethod === 'BankTransfer' ? '🏛️' : '📱'}
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {order.paymentMethod === 'BankTransfer'
                    ? 'Quét mã VietQR - Techcombank để hoàn tất'
                    : 'Chuyển tiền qua Ví điện tử MoMo'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Quý khách vui lòng chuyển khoản theo thông tin dưới đây để đơn hàng được chuẩn bị và bàn giao vận chuyển sớm nhất.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                ⏳ Chờ nhận thanh toán
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Dynamic QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative p-3 bg-white rounded-2xl shadow-2xl border-4 border-white">
                {order.paymentMethod === 'BankTransfer' ? (
                  <img
                    src={`https://img.vietqr.io/image/TCB-19050430057012-compact2.png?amount=${Math.round(order.totalAmount)}&addInfo=${encodeURIComponent(`MADK ${order.orderNumber}`)}&accountName=${encodeURIComponent('NGUYEN HOANG KHANG')}`}
                    alt="Mã VietQR thanh toán Techcombank"
                    className="w-56 h-auto sm:w-64 object-contain rounded-xl"
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`2|99|0901316434|NGUYEN HOANG KHANG||0|0|${Math.round(order.totalAmount)}|MADK ${order.orderNumber}|transfer_p2p`)}`}
                    alt="Mã QR thanh toán MoMo"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed">
                {order.paymentMethod === 'BankTransfer'
                  ? 'Quét mã bằng bất kỳ App Ngân hàng nào (Techcombank, VCB, MB, VietinBank, VPBank...)'
                  : 'Mở ứng dụng MoMo và chọn Quét mã QR'}
              </p>
              {order.paymentMethod === 'MoMo' && (
                <a
                  href="https://me.momo.vn/0901316434"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors flex items-center gap-2 shadow-md shadow-pink-600/30"
                >
                  <span>Mở app MoMo trên điện thoại</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            {/* Right: Payment Details with 1-Click Copy Buttons */}
            <div className="md:col-span-7 space-y-3 text-xs">
              {order.paymentMethod === 'BankTransfer' ? (
                <>
                  {/* Ngân hàng */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Ngân hàng thụ hưởng</span>
                      <span className="text-sm font-extrabold text-white mt-0.5 block">Techcombank (TCB)</span>
                      <span className="text-[11px] text-slate-400">Ngân hàng TMCP Kỹ Thương Việt Nam</span>
                    </div>
                  </div>

                  {/* Số tài khoản */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Số tài khoản</span>
                      <span className="text-base sm:text-lg font-mono font-black text-emerald-400 mt-0.5 block tracking-wider">
                        19050430057012
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('19050430057012', 'stk')}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>{copiedField === 'stk' ? '✓ Đã chép' : '📋 Chép STK'}</span>
                    </button>
                  </div>

                  {/* Tên chủ tài khoản */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tên chủ tài khoản</span>
                      <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block uppercase">
                        NGUYEN HOANG KHANG
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Ví MoMo */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Hình thức</span>
                      <span className="text-sm font-extrabold text-pink-400 mt-0.5 block">Ví điện tử MoMo</span>
                    </div>
                  </div>

                  {/* SĐT MoMo */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Số điện thoại MoMo</span>
                      <span className="text-base sm:text-lg font-mono font-black text-pink-400 mt-0.5 block tracking-wider">
                        0901316434
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('0901316434', 'momo_phone')}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>{copiedField === 'momo_phone' ? '✓ Đã chép' : '📋 Chép SĐT'}</span>
                    </button>
                  </div>

                  {/* Tên người nhận */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tên người nhận</span>
                      <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block uppercase">
                        NGUYEN HOANG KHANG
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Số tiền cần thanh toán */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Số tiền chính xác</span>
                  <span className="text-base sm:text-lg font-mono font-black text-amber-400 mt-0.5 block">
                    {formatVND(order.totalAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(Math.round(order.totalAmount).toString(), 'amount')}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>{copiedField === 'amount' ? '✓ Đã chép' : '📋 Chép số tiền'}</span>
                </button>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Nội dung chuyển khoản (bắt buộc)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-emerald-300 mt-0.5 block tracking-wider">
                    MADK {order.orderNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`MADK ${order.orderNumber}`, 'note')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>{copiedField === 'note' ? '✓ Đã chép' : '📋 Chép nội dung'}</span>
                </button>
              </div>

              {/* Ghi chú nhắc nhở */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                <span className="text-amber-400 text-base">⚠️</span>
                <p>
                  Vui lòng giữ <strong>chính xác nội dung chuyển khoản</strong> để hệ thống tự động ghi nhận thanh toán nhanh nhất. Sau khi chuyển xong, đơn hàng sẽ được cập nhật và đóng gói giao cho bạn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delivery & Payment Details Card */}
      {order && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>📍</span> Thông tin người nhận
            </h2>
            {address ? (
              <div className="space-y-1.5 text-xs text-slate-700">
                <p className="font-extrabold text-sm text-slate-900">{address.recipientName}</p>
                <p className="font-mono text-slate-600">📞 {address.phoneNumber}</p>
                {address.recipientEmail && (
                  <p className="text-slate-500">✉️ {address.recipientEmail}</p>
                )}
                <p className="text-slate-600 pt-1 leading-relaxed">
                  {address.detailedAddress}, {address.wardName}, {address.districtName},{' '}
                  {address.provinceName}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Địa chỉ đã lưu tại thời điểm đặt hàng.</p>
            )}

            {order.customerNote && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Ghi chú giao hàng:</span>
                <p className="italic mt-0.5">&ldquo;{order.customerNote}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>💳</span> Hình thức thanh toán
              </h2>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phương thức:</span>
                  <span className="font-bold text-slate-900">
                    {order.paymentMethod === 'BankTransfer'
                      ? 'Chuyển khoản ngân hàng (VietQR - Techcombank)'
                      : order.paymentMethod === 'MoMo'
                      ? 'Ví điện tử MoMo'
                      : order.paymentMethod === 'VNPay'
                      ? 'Thanh toán trực tuyến VNPay'
                      : 'Thanh toán khi nhận hàng (COD)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phí giao hàng toàn quốc:</span>
                  <span className="font-bold text-emerald-600">0 ₫ (Miễn phí)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trạng thái thanh toán:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md ${
                      order.paymentStatus === 'Paid'
                        ? 'text-emerald-700 bg-emerald-50'
                        : order.paymentMethod === 'BankTransfer' || order.paymentMethod === 'MoMo'
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-slate-700 bg-slate-100'
                    }`}
                  >
                    {order.paymentStatus === 'Paid'
                      ? 'Đã thanh toán thành công'
                      : order.paymentMethod === 'BankTransfer'
                      ? 'Chờ chuyển khoản VietQR'
                      : order.paymentMethod === 'MoMo'
                      ? 'Chờ chuyển tiền MoMo'
                      : 'Chờ thanh toán khi nhận hàng'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {order.paymentMethod === 'COD' ? 'Tổng tiền thu hộ (COD):' : 'Tổng thanh toán:'}
              </span>
              <span className="text-xl font-black text-brand-600 font-mono">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Products Ordered List */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>📦</span> Sản phẩm trong đơn hàng ({order.items.length} món)
          </h2>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {order.items.map((item) => {
              const productName = item.productName || item.productNameSnapshot || 'Sản phẩm công nghệ chính hãng';
              const variantName = item.variantName || item.variantNameSnapshot || '';
              const sku = item.sku || item.skuSnapshot || '';
              const unitPrice = item.unitPrice ?? item.unitPriceSnapshot ?? (item.quantity > 0 ? item.totalPrice / item.quantity : 0);
              const thumbnail = item.thumbnailUrl || item.thumbnailUrlSnapshot;
              const attributes = parseJsonSafe(item.attributes || item.attributesSnapshot);
              const specs = parseJsonSafe(item.specifications || item.specificationsSnapshot);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-600 text-2xl font-bold">
                          📱
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {productName}
                      </p>
                      {variantName && (
                        <p className="text-xs text-slate-600">
                          Phân loại: <strong className="text-slate-800 font-semibold">{variantName}</strong>
                        </p>
                      )}
                      {/* Attributes tags */}
                      {attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {Object.entries(attributes).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200/60"
                            >
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Specifications overview */}
                      {specs && typeof specs === 'object' && (
                        <p className="text-[11px] text-slate-400 font-normal">
                          {[
                            specs.screen_size && `Màn hình ${specs.screen_size}`,
                            specs.refresh_rate && `${specs.refresh_rate}`,
                            specs.ram && `RAM ${specs.ram}`,
                            specs.storage && `Bộ nhớ ${specs.storage}`,
                            specs.chip && `Chip ${specs.chip}`,
                          ].filter(Boolean).join(' • ')}
                        </p>
                      )}
                      {sku && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: <span className="text-slate-500 font-medium">{sku}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-baseline sm:items-end">
                    <span className="text-xs font-semibold text-slate-400 sm:hidden">Giá & Số lượng:</span>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-600 font-mono">
                        {formatVND(unitPrice)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Số lượng: <strong className="text-slate-900 font-mono font-bold">{item.quantity}</strong>
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                        {formatVND(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Action Buttons (Optimized for Mobile) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/account?tab=orders"
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
        >
          Theo dõi đơn hàng của tôi &rarr;
        </Link>
        <Link
          to="/categories"
          className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors text-center"
        >
          Tiếp tục mua sắm
        </Link>
      </div>

      {/* 6. Support Strip */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
        <span>Cần hỗ trợ về đơn hàng?</span>
        <span className="text-slate-300">•</span>
        <span className="font-semibold text-slate-700">Hotline: 1900 8888 (8h00 - 21h30)</span>
        <span className="text-slate-300">•</span>
        <span className="font-semibold text-slate-700">Email: support@madk.store</span>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
