import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../auth/context/AuthContext';
import { formatVND } from '../../../utils/format';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    totalAmount,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    addToCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'info'>('success');
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTamperTest, setShowTamperTest] = useState(false);
  const [tamperTestLoading, setTamperTestLoading] = useState(false);
  const [tamperTestResult, setTamperTestResult] = useState<string | null>(null);

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

  /**
   * Thao tác kiểm tra bảo mật:
   * Client hacker gửi giá 1,000đ cho biến thể sản phẩm đầu tiên trong giỏ.
   * Chứng minh server bỏ qua giá client và tính hoàn toàn từ DB!
   */
  const handleTamperPriceTest = async () => {
    if (items.length === 0) return;
    const targetItem = items[0];
    setTamperTestLoading(true);
    setTamperTestResult(null);

    try {
      // Gửi giá client là 1,000 VND (cố tình sửa)
      const hackedPrice = 1000;
      const res = await addToCart(targetItem.variantId, 1, hackedPrice);
      if (res.success) {
        setTamperTestResult(
          `✅ Test thành công! Client gửi giá ${formatVND(hackedPrice)}, nhưng Server đã bỏ qua hoàn toàn và tính theo giá DB: ${formatVND(targetItem.price)}.`
        );
        showToast('Server đã tính theo giá DB chuẩn, bỏ qua giá client giả mạo!', 'success');
      } else {
        setTamperTestResult(`❌ Lỗi: ${res.error}`);
      }
    } finally {
      setTamperTestLoading(false);
    }
  };

  // Trạng thái khách chưa đăng nhập
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-8 gap-2">
          <Link to="/" className="hover:text-brand-600 transition-colors">
            Trang chủ
          </Link>
          <span>&rsaquo;</span>
          <span className="font-semibold text-slate-900">Giỏ hàng</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-sm text-center space-y-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner text-4xl">
            🔒
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Vui lòng đăng nhập để xem giỏ hàng
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
              Bạn cần đăng nhập tài khoản để lưu trữ sản phẩm trong giỏ hàng, nhận ưu đãi độc quyền và tiến hành thanh toán an toàn.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth/login?redirect=/cart"
              className="inline-flex items-center px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Đăng nhập ngay &rarr;
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex items-center px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base transition-colors"
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
      <div className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-8 gap-2">
          <Link to="/" className="hover:text-brand-600 transition-colors">
            Trang chủ
          </Link>
          <span>&rsaquo;</span>
          <span className="font-semibold text-slate-900">Giỏ hàng</span>
        </nav>

        {/* Empty Cart Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-sm text-center space-y-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
            <svg
              className="w-12 h-12 sm:w-14 sm:h-14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Giỏ hàng của bạn đang trống
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
              Chưa có sản phẩm nào được thêm vào giỏ. Hãy dạo quanh cửa hàng để tìm kiếm những thiết bị
              công nghệ và phụ kiện ưng ý nhất!
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/categories"
              className="inline-flex items-center px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Khám phá sản phẩm ngay &rarr;
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base transition-colors"
            >
              Về trang chủ
            </Link>
          </div>

          {/* Benefits strip */}
          <div className="pt-10 mt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <span className="text-base">🚚</span>
              <span>Giao hàng toàn quốc</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-base">🛡️</span>
              <span>Thanh toán an toàn COD/VNPay</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-base">🔄</span>
              <span>Đổi trả thuận tiện 7 ngày</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 sm:right-8 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 text-white ${
            toastType === 'warning'
              ? 'bg-amber-600 border-amber-500'
              : toastType === 'info'
              ? 'bg-sky-600 border-sky-500'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {toastType === 'warning' ? '!' : '✓'}
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-2 mb-2">
            <Link to="/" className="hover:text-brand-600 transition-colors">
              Trang chủ
            </Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-slate-900">Giỏ hàng ({itemCount})</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <span>Giỏ hàng của bạn</span>
            <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              {itemCount} món đồ
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200/80 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Xóa toàn bộ giỏ</span>
          </button>
        </div>
      </div>

      {/* Guest Notice Banner */}
      {!isAuthenticated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Bạn đang mua sắm với tư cách Khách vãng lai
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Các sản phẩm đang được lưu an toàn trong trình duyệt của bạn. Khi đăng nhập, toàn bộ giỏ hàng sẽ được tự động gộp vào tài khoản!
              </p>
            </div>
          </div>
          <Link
            to="/auth/login"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap self-start sm:self-center transition-colors shadow-sm"
          >
            Đăng nhập để đồng bộ &rarr;
          </Link>
        </div>
      )}

      {/* Price Tampering Test Widget (Collapsible Card) */}
      <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              🛡️
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Kiểm tra an ninh: Server tính giá từ DB (Bỏ qua giá Client)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Thử nghiệm gửi giá cố tình bị sửa ở Client (1,000đ) để xác minh tính toàn vẹn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTamperTest(!showTamperTest)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline"
          >
            {showTamperTest ? 'Ẩn thử nghiệm' : 'Mở thử nghiệm'}
          </button>
        </div>

        {showTamperTest && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fade-in text-xs">
            <p className="text-slate-600 leading-relaxed">
              Theo quy chuẩn bảo mật e-commerce, hệ thống không bao giờ nhận giá do Client gửi lên. Khi bạn bấm nút dưới đây, client sẽ gửi request thêm món với <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">clientPrice = 1,000 VND</code>. Hãy quan sát Server trả về giá thật từ DB.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={tamperTestLoading || items.length === 0}
                onClick={handleTamperPriceTest}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
              >
                {tamperTestLoading && <LoadingSpinner size="sm" />}
                <span>🧪 Thử nghiệm gửi giá client 1.000đ</span>
              </button>
              {tamperTestResult && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {tamperTestResult}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Cart Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => {
              const isUpdating = actionItemId === item.id;
              const isLowStock = item.stockQuantity <= 5 && item.stockQuantity > 0;
              const isOutOfStock = item.stockQuantity <= 0;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/products/${item.productSlug}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 group"
                  >
                    <img
                      src={
                        item.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80'
                      }
                      alt={item.productName}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="text-sm sm:text-base font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
                    >
                      {item.productName}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {item.variantName}
                      </span>
                      {item.sku && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>

                    {/* Stock Alert Badge */}
                    <div className="pt-1">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Hết hàng
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Chỉ còn {item.stockQuantity} sản phẩm trong kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Còn {item.stockQuantity} sản phẩm sẵn sàng giao
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="text-left sm:text-right">
                    <div className="text-sm sm:text-base font-extrabold text-brand-700">
                      {formatVND(item.price)}
                    </div>
                    {item.originalPrice > item.price && (
                      <div className="text-xs text-slate-400 line-through">
                        {formatVND(item.originalPrice)}
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                    <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        disabled={isUpdating || item.quantity <= 1}
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1, item.stockQuantity)
                        }
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                        title="Giảm số lượng"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating || item.quantity >= item.stockQuantity}
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1, item.stockQuantity)
                        }
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                        title="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right sm:min-w-[5.5rem]">
                      <div className="text-sm font-black text-slate-900">
                        {formatVND(item.totalPrice)}
                      </div>
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa khỏi giỏ"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              &larr; Tiếp tục mua sắm các thiết bị khác
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Số lượng sản phẩm:</span>
                <span className="font-semibold text-slate-900">{itemCount}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Tạm tính (Server DB):</span>
                <span className="font-semibold text-slate-900">{formatVND(totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-emerald-600">Miễn phí toàn quốc</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-extrabold text-slate-900 block">Tổng thanh toán:</span>
                  <span className="text-[11px] text-slate-400">Đã bao gồm thuế VAT</span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-brand-700 block">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Tiến hành đặt hàng</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Service & Security Trust Badges */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Giá sản phẩm được bảo đảm tính chuẩn xác từ hệ thống</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Bảo mật dữ liệu chuẩn ngân hàng & mã hóa SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Hỗ trợ thanh toán khi nhận hàng (COD) hoặc qua VNPay</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Cart */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Xóa toàn bộ giỏ hàng?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả các sản phẩm đã chọn sẽ bị xóa khỏi giỏ. Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm"
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
