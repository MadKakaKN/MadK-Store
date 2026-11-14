import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../auth/context/AuthContext';
import { formatVND } from '../../../utils/format';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    totalAmount,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'info'>('success');
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showToast = (msg: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number, stockQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    if (newQuantity > stockQuantity) {
      showToast(
        `Số lượng yêu cầu (${newQuantity}) vượt quá tồn kho khả dụng (${stockQuantity}).`,
        'warning'
      );
      return;
    }

    setActionItemId(itemId);
    const res = await updateQuantity(itemId, newQuantity);
    setActionItemId(null);

    if (!res.success) {
      showToast(res.error || 'Cập nhật số lượng không thành công.', 'warning');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setActionItemId(itemId);
    const res = await removeItem(itemId);
    setActionItemId(null);

    if (res.success) {
      showToast('Đã xóa sản phẩm khỏi giỏ hàng.');
    } else {
      showToast(res.error || 'Không thể xóa sản phẩm.', 'warning');
    }
  };

  const handleClearCart = async () => {
    setShowClearConfirm(false);
    const res = await clearCart();
    if (res.success) {
      showToast('Đã làm rỗng giỏ hàng.');
    } else {
      showToast(res.error || 'Không thể làm rỗng giỏ.', 'warning');
    }
  };

  
  // Trạng thái khách chưa đăng nhập
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <nav className="flex items-center text-xs text-gray-500 mb-6 gap-2">
          <Link to="/" className="hover:text-[#1D4ED8] transition-colors">
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-[#111827]">Giỏ hàng</span>
        </nav>

        <div className="bg-white rounded-lg p-8 sm:p-12 border border-[#E5E7EB] text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
              Vui lòng đăng nhập để xem giỏ hàng
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Bạn cần đăng nhập tài khoản để lưu trữ sản phẩm trong giỏ hàng, nhận ưu đãi độc quyền và tiến hành thanh toán an toàn.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth/login?redirect=/cart"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors"
            >
              <span>Đăng nhập ngay</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex items-center px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái giỏ hàng rỗng
  if (!isLoading && items.length === 0) {
    return (
      <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <nav className="flex items-center text-xs text-gray-500 mb-6 gap-2">
          <Link to="/" className="hover:text-[#1D4ED8] transition-colors">
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-[#111827]">Giỏ hàng</span>
        </nav>

        <div className="bg-white rounded-lg p-8 sm:p-12 border border-[#E5E7EB] text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">shopping_cart</span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
              Giỏ hàng của bạn đang trống
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các dòng Laptop, PC Gaming, linh kiện và phụ kiện chính hãng tại MadK Store!
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors"
            >
              <span>Khám phá sản phẩm ngay</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
            >
              Về trang chủ
            </Link>
          </div>

          <div className="pt-8 mt-6 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">local_shipping</span>
              <span>Miễn phí giao hàng GHN từ 1.000.000₫</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
              <span>Bảo hành chính hãng 24 tháng</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">published_with_changes</span>
              <span>Đổi mới 7 ngày nếu lỗi phần cứng</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 px-4 md:px-6 max-w-[1200px] mx-auto space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 sm:right-8 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-2.5 text-white ${
            toastType === 'warning'
              ? 'bg-amber-600 border-amber-500'
              : toastType === 'info'
              ? 'bg-blue-600 border-blue-500'
              : 'bg-[#111827] border-gray-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toastType === 'warning' ? 'warning' : 'check_circle'}
          </span>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-[#1D4ED8] hover:underline">Trang chủ</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#111827] font-semibold">Giỏ hàng &amp; Thanh toán</span>
      </nav>

      {/* STEP PROGRESSION BAR (Screen 7 Retail Stepper) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Step 1: Active */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#EFF6FF] border border-[#1D4ED8] text-left">
            <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-xs">1</div>
            <div className="leading-tight">
              <span className="text-[13px] font-bold text-[#1D4ED8] block">1. Giỏ hàng ({itemCount} sản phẩm)</span>
              <span className="text-[11px] text-blue-700 block">Xem lại cấu hình &amp; số lượng</span>
            </div>
          </div>
          {/* Step 2: Clickable */}
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-gray-50 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 border border-gray-300 flex items-center justify-center font-bold text-xs">2</div>
            <div className="leading-tight">
              <span className="text-[13px] font-semibold text-gray-800 block">2. Thông tin thanh toán &amp; Đặt hàng</span>
              <span className="text-[11px] text-gray-500 block">Địa chỉ giao GHN &amp; VietQR / COD</span>
            </div>
          </button>
          {/* Step 3: Inactive */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white border border-[#E5E7EB] text-left opacity-70">
            <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 border border-gray-300 flex items-center justify-center font-bold text-xs">3</div>
            <div className="leading-tight">
              <span className="text-[13px] font-semibold text-gray-700 block">3. Đặt hàng thành công</span>
              <span className="text-[11px] text-gray-500 block">Mã đơn &amp; hướng dẫn nhận máy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Cart Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Cart Line Items (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB] overflow-hidden">
            {/* Table Header */}
            <div className="px-4 py-3 bg-[#F9FAFB] flex items-center justify-between text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#111827]">Tất cả sản phẩm ({itemCount})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-gray-500 hover:text-[#D70018] text-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Xóa toàn bộ giỏ</span>
              </button>
            </div>

            {/* Item Rows */}
            {items.map((item) => {
              const isUpdating = actionItemId === item.id;
              const isLowStock = item.stockQuantity <= 5 && item.stockQuantity > 0;
              const isOutOfStock = item.stockQuantity <= 0;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/products/${item.productSlug}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white border border-[#E5E7EB] rounded-lg p-1 relative flex items-center justify-center group"
                  >
                    <img
                      src={item.thumbnailUrl || `/images/products/${item.productSlug}.png`}
                      alt={item.productName}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = '1';
                          target.src = `/images/products/${item.productSlug}.png`;
                        }
                      }}
                    />
                  </Link>

                  {/* Details & Controls */}
                  <div className="flex-1 w-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.productSlug}`}
                          className="text-sm font-semibold text-[#111827] hover:text-[#1D4ED8] transition-colors leading-snug line-clamp-2"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-[#D70018] p-1 rounded transition-colors"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>

                      {/* Variant and Stock Chips */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F3F4F6] text-gray-700 border border-[#E5E7EB]">
                          {item.variantName}
                        </span>
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Hết hàng
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Chỉ còn {item.stockQuantity} sp
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Sẵn sàng giao
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Stepper row */}
                    <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-[#D70018]">
                          {formatVND(item.price)}
                        </span>
                        {item.originalPrice > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatVND(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center border border-[#E5E7EB] rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            disabled={isUpdating || item.quantity <= 1}
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1, item.stockQuantity)
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <input
                            type="text"
                            readOnly
                            value={item.quantity}
                            className="w-10 h-8 border-0 text-center font-semibold text-[#111827] text-xs p-0 focus:ring-0"
                          />
                          <button
                            type="button"
                            disabled={isUpdating || item.quantity >= item.stockQuantity}
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1, item.stockQuantity)
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>

                        {/* Subtotal for line */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-[10px] text-gray-400 block leading-tight">Thành tiền</span>
                          <span className="text-xs font-bold text-[#111827]">
                            {formatVND(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Shopping Link */}
          <div className="flex items-center justify-between">
            <Link
              to="/categories"
              className="inline-flex items-center gap-1 text-[#1D4ED8] hover:underline text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Tiếp tục chọn thêm sản phẩm khác</span>
            </Link>
          </div>
        </div>

        {/* Right: Sticky Order Summary (4 Cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <h3 className="text-sm font-bold text-[#111827] pb-3 border-b border-[#E5E7EB]">
              Tóm tắt đơn hàng
            </h3>

            <div className="py-3 space-y-2.5 text-xs border-b border-[#E5E7EB]">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({itemCount} sản phẩm):</span>
                <span className="font-semibold text-[#111827]">{formatVND(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Phí vận chuyển GHN:</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1 rounded">2H FAST</span>
                </span>
                <span className="font-medium text-emerald-600">Miễn phí (0₫)</span>
              </div>
            </div>

            <div className="py-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-[#111827] block">Tổng tiền thanh toán:</span>
                  <span className="text-[11px] text-gray-500 block">(Đã gồm VAT 10% &amp; Phí bảo hiểm)</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#D70018]">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Primary Button */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full h-11 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Tiến hành đặt hàng ngay</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            {/* Retail Commitments */}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                <span>Kiểm tra hàng đồng kiểm trước khi thanh toán</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1D4ED8] text-[16px]">history</span>
                <span>Đổi mới trong 7 ngày nếu có lỗi phần cứng</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[16px]">headset_mic</span>
                <span>Hỗ trợ cài đặt Windows &amp; Driver trọn đời máy</span>
              </div>
            </div>
          </div>

          {/* Hotline Callout */}
          <div className="bg-gray-50 border border-[#E5E7EB] rounded-lg p-3 text-center">
            <p className="text-[12px] text-gray-600">Cần tư vấn xuất hóa đơn công ty hoặc cấu hình đặc biệt?</p>
            <p className="text-[13px] font-bold text-[#111827] mt-0.5">
              Gọi ngay Hotline: <a className="text-[#D70018] hover:underline" href="tel:18006868">1800 6868</a> (8h00 - 22h00)
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Cart */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-[#E5E7EB] shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Xóa toàn bộ giỏ hàng?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Tất cả các sản phẩm đã chọn sẽ bị xóa khỏi giỏ. Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                className="px-4 py-2 rounded-lg bg-[#D70018] hover:bg-red-700 text-white font-semibold text-xs transition-colors"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
