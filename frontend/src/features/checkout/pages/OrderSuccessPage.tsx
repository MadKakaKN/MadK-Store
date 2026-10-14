import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { OrderDto } from '../../../types/order';
import orderApi from '../../../api/orderApi';
import { formatVND } from '../../../utils/format';
import { OrderStatusBadge } from '../../account/components/orders/OrderStatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const queryOrderNumber = searchParams.get('orderNumber');
  const stateOrder = location.state?.order as OrderDto | undefined;

  const [order, setOrder] = useState<OrderDto | null>(stateOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!stateOrder && !!queryOrderNumber);
  const [copied, setCopied] = useState<boolean>(false);

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

  const address = order ? parseAddress(order.shippingAddressSnapshot) : null;

  return (
    <div className="min-h-screen py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header & Congratulations Banner */}
      <div className="text-center space-y-4">
        {/* Placeholder / Container cho hiệu ứng 3D nhẹ ở giai đoạn sau */}
        <div
          id="order-success-3d-scene"
          className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto flex items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-brand-500/20 border border-emerald-300/40 shadow-xl shadow-emerald-500/10 group cursor-default"
          title="Vị trí tích hợp hiệu ứng 3D nhẹ bàn phím/hộp quà trong giai đoạn sau"
        >
          {/* Subtle 2D animated pulse & celebratory icon */}
          <div className="absolute inset-0 rounded-3xl bg-emerald-400/10 animate-ping opacity-25"></div>
          <div className="relative z-10 text-5xl sm:text-6xl select-none transform group-hover:scale-110 transition-transform duration-300">
            🎉
          </div>
          <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
            COD Đã ghi nhận
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
            Kiện hàng bàn phím cơ của bạn đang được nhân viên kho chuẩn bị đóng gói cẩn thận. Bạn sẽ thanh toán khi nhận hàng tận nơi.
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
                  <span className="font-bold text-slate-900">Thanh toán khi nhận hàng (COD)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phí giao hàng toàn quốc:</span>
                  <span className="font-bold text-emerald-600">0 ₫ (Miễn phí)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trạng thái thanh toán:</span>
                  <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    Chờ thanh toán khi nhận hàng
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tổng tiền thu hộ (COD):</span>
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
            {order.items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors"
              >
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
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Phân loại: <strong className="text-slate-700">{item.variantNameSnapshot}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKU: {item.skuSnapshot}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-brand-600 font-mono">
                    {formatVND(item.unitPriceSnapshot)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Số lượng: <strong className="text-slate-900 font-mono">{item.quantity}</strong>
                  </p>
                  <p className="text-xs font-extrabold text-slate-900 mt-1 font-mono">
                    {formatVND(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
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
