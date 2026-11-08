import React, { useState, useEffect, useRef, useMemo } from 'react';
import { adminPosApi, PosProductVariant, PosCustomer, PosOrderReceipt } from '../../../api/adminPosApi';
import { useAuth } from '../../auth/context/AuthContext';
import { formatVND } from '../../../utils/format';
import {
  IconBarcode,
  IconReceipt,
  IconCheck,
  IconTag,
  IconUsers,
} from '../../../components/common/Icons';

interface CartItem {
  variant: PosProductVariant;
  quantity: number;
}

export const AdminPosPage: React.FC = () => {
  const { user } = useAuth();

  // State danh mục và sản phẩm
  const [products, setProducts] = useState<PosProductVariant[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Barcode input ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Giỏ hàng
  const [cart, setCart] = useState<CartItem[]>([]);

  // Khách hàng
  const [customerMode, setCustomerMode] = useState<'GUEST' | 'MEMBER'>('GUEST');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<PosCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Thanh toán
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer' | 'PosCard'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [staffNote, setStaffNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hóa đơn vừa tạo để in K80
  const [receipt, setReceipt] = useState<PosOrderReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Tải danh sách sản phẩm
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await adminPosApi.getProducts(searchQuery);
      setProducts(data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery]);

  // Tìm khách hàng
  useEffect(() => {
    if (customerMode === 'MEMBER' && customerSearch.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await adminPosApi.searchCustomers(customerSearch);
          setCustomerResults(res || []);
        } catch {
          setCustomerResults([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch, customerMode]);

  // Thêm sản phẩm vào giỏ
  const addToCart = (variant: PosProductVariant) => {
    if (variant.stockQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.variant.variantId === variant.variantId);
      if (existing) {
        if (existing.quantity >= variant.stockQuantity) return prev;
        return prev.map((i) =>
          i.variant.variantId === variant.variantId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [{ variant, quantity: 1 }, ...prev];
    });
  };

  // Cập nhật số lượng
  const updateQuantity = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.variant.variantId === variantId) {
          const clampedQty = Math.min(qty, i.variant.stockQuantity);
          return { ...i, quantity: clampedQty };
        }
        return i;
      })
    );
  };

  // Xóa khỏi giỏ
  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant.variantId !== variantId));
  };

  // Xử lý quét mã vạch (Barcode Scanner Gun / Enter key)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.trim().toLowerCase();
    const matched = products.find(
      (p) => p.sku.toLowerCase() === term || p.productName.toLowerCase().includes(term)
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery('');
    }
  };

  // Tính toán tài chính
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.variant.salePrice * item.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - couponDiscount);
  }, [subtotal, couponDiscount]);

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'Cash' || cashTendered <= 0) return 0;
    return Math.max(0, cashTendered - totalAmount);
  }, [paymentMethod, cashTendered, totalAmount]);

  // Đặt tiền khách đưa
  const setExactCash = () => {
    setCashTendered(totalAmount);
  };

  const addCash = (amount: number) => {
    setCashTendered((prev) => prev + amount);
  };

  // Thực hiện checkout POS
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Cash' && cashTendered < totalAmount) {
      alert(`Tiền khách đưa (${formatVND(cashTendered)}) chưa đủ tổng tiền đơn hàng (${formatVND(totalAmount)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          variantId: i.variant.variantId,
          quantity: i.quantity,
        })),
        paymentMethod,
        cashTendered: paymentMethod === 'Cash' ? cashTendered : totalAmount,
        cashChange: paymentMethod === 'Cash' ? cashChange : 0,
        customerName: selectedCustomer ? selectedCustomer.fullName : guestName.trim() || 'Khách lẻ tại quầy',
        customerPhone: selectedCustomer ? selectedCustomer.phoneNumber : guestPhone.trim() || undefined,
        customerEmail: selectedCustomer?.email || undefined,
        customerId: selectedCustomer?.id || undefined,
        couponCode: couponCode.trim() || undefined,
        staffNote: staffNote.trim() || undefined,
      };

      const result = await adminPosApi.checkout(payload);

      setReceipt(result);
      setShowReceiptModal(true);

      // Reset giỏ hàng
      setCart([]);
      setCashTendered(0);
      setCouponDiscount(0);
      setCouponCode('');
      setStaffNote('');
      setSelectedCustomer(null);
      setGuestName('');
      setGuestPhone('');

      // Tải lại tồn kho
      loadProducts();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi không xác định khi thanh toán POS';
      alert(`Thanh toán thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // In hóa đơn nhiệt K80
  const triggerPrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-3 sm:p-5 flex flex-col gap-4">
      {/* ──── 1. TOP CASHIER BAR & BARCODE SEARCH ──── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:px-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <IconReceipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">Quầy Bán Hàng (POS)</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Trực tiếp tại quầy
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thu ngân: <span className="font-bold text-slate-800">{user?.fullName || user?.email}</span> • Ca trực hôm nay
            </p>
          </div>
        </div>

        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-xl relative">
          <div className="relative">
            <IconBarcode className="w-5 h-5 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quét mã vạch (Barcode / SKU) hoặc nhập tên sản phẩm... (Enter để thêm)"
              className="w-full pl-11 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        <button
          onClick={loadProducts}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
          title="Tải lại tồn kho"
        >
          <svg className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin text-blue-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới kho</span>
        </button>
      </div>

      {/* ──── 2. MAIN 2-COLUMN POS LAYOUT ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* LEFT COLUMN (7 COLS): PRODUCT CATALOG & VARIANT SELECTOR */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <IconTag className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Danh mục sản phẩm</span>
            </div>
            <span className="text-xs text-slate-400">{products.length} sản phẩm khả dụng</span>
          </div>

          {/* Product grid */}
          {loadingProducts ? (
            <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải danh mục hàng hóa...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              {products.map((item) => {
                const inCart = cart.find((c) => c.variant.variantId === item.variantId);
                const isOutOfStock = item.stockQuantity <= 0;

                return (
                  <div
                    key={item.variantId}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed'
                        : inCart
                          ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/20 cursor-pointer shadow-2xs hover:shadow-md'
                          : 'border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Thumbnail with stock badge */}
                      <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-2">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                            SP
                          </div>
                        )}
                        <span
                          className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isOutOfStock
                              ? 'bg-rose-600 text-white'
                              : item.stockQuantity <= 5
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isOutOfStock ? 'Hết hàng' : `Kho: ${item.stockQuantity}`}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.variantName}
                      </p>
                      <p className="text-[10px] font-mono text-blue-600 truncate mt-0.5">
                        {item.sku}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 block">
                          {formatVND(item.salePrice)}
                        </span>
                        {item.hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatVND(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : inCart
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                        }`}
                      >
                        {inCart ? inCart.quantity : '+'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 COLS): POS CASH REGISTER / CART TERMINAL */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* A. Customer Info Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <IconUsers className="w-4 h-4 text-blue-600" />
                <span>Khách hàng</span>
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('GUEST');
                    setSelectedCustomer(null);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    customerMode === 'GUEST' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Khách lẻ
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('MEMBER')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    customerMode === 'MEMBER' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Thành viên
                </button>
              </div>
            </div>

            {customerMode === 'GUEST' ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tên khách hàng (tùy chọn)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại (tùy chọn)"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            ) : selectedCustomer ? (
              <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-blue-900">{selectedCustomer.fullName}</p>
                  <p className="text-[11px] text-blue-700">
                    {selectedCustomer.phoneNumber} • Hạng: <span className="font-bold">{selectedCustomer.loyaltyTier}</span> ({selectedCustomer.loyaltyPoints.toLocaleString()} điểm)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Đổi
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập SĐT hoặc tên thành viên để tìm..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                {customerResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {customerResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs"
                      >
                        <p className="font-bold text-slate-900">{c.fullName} ({c.phoneNumber})</p>
                        <p className="text-[11px] text-slate-500">
                          Hạng {c.loyaltyTier} • Tích lũy: {c.loyaltyPoints.toLocaleString()} điểm
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* B. Cart Items Terminal */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hóa đơn bán hàng</span>
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Giỏ hàng trống. Quét mã vạch hoặc chọn sản phẩm từ danh mục bên trái.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.variant.variantId} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {item.variant.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.variant.variantName} • <span className="font-mono text-blue-600">{formatVND(item.variant.salePrice)}</span>
                        </p>
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 shrink-0 bg-slate-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variant.variantId, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 font-bold text-xs flex items-center justify-center text-slate-700 shadow-2xs"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-black text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variant.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stockQuantity}
                          className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 font-bold text-xs flex items-center justify-center text-slate-700 shadow-2xs disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[70px]">
                        <p className="font-black text-xs text-slate-900">
                          {formatVND(item.variant.salePrice * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variant.variantId)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors mt-0.5"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* C. Payment & Checkout Panel */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {/* Financial calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-bold text-slate-900">{formatVND(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá coupon:</span>
                    <span className="font-bold">-{formatVND(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-slate-100 font-black">
                  <span className="text-slate-900">TỔNG CẦN THANH TOÁN:</span>
                  <span className="text-blue-600 text-base">{formatVND(totalAmount)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2 rounded-lg transition-all ${
                    paymentMethod === 'Cash' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  💵 Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BankTransfer')}
                  className={`py-2 rounded-lg transition-all ${
                    paymentMethod === 'BankTransfer' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  📱 VietQR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PosCard')}
                  className={`py-2 rounded-lg transition-all ${
                    paymentMethod === 'PosCard' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  💳 Quẹt thẻ
                </button>
              </div>

              {/* Cash denomination chips */}
              {paymentMethod === 'Cash' && totalAmount > 0 && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Tiền khách đưa:</span>
                    <input
                      type="number"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      placeholder="0"
                      className="w-32 px-2.5 py-1 text-right font-black text-slate-900 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={setExactCash}
                      className="px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold"
                    >
                      Đúng số tiền
                    </button>
                    {[100000, 200000, 500000, 1000000, 2000000, 5000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => addCash(val)}
                        className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        +{val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="font-bold text-slate-600">Tiền thừa trả khách:</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {formatVND(cashChange)}
                    </span>
                  </div>
                </div>
              )}

              {/* VietQR Live Box */}
              {paymentMethod === 'BankTransfer' && totalAmount > 0 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3">
                  <img
                    src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${totalAmount}&addInfo=POS%20MADK`}
                    alt="VietQR"
                    className="w-20 h-20 rounded-lg border border-white shadow-xs shrink-0"
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-blue-950">Quét mã VietQR Napas 247</p>
                    <p className="text-[11px] text-blue-800">
                      Chuyển đúng: <span className="font-black text-rose-600">{formatVND(totalAmount)}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Mã QR tích hợp sẵn số tiền để khách thanh toán nhanh qua App ngân hàng.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleCheckout}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Đang xử lý đơn hàng...</span>
                  ) : (
                    <>
                      <IconCheck className="w-5 h-5 text-white" />
                      <span>THANH TOÁN & IN HÓA ĐƠN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──── 3. THERMAL RECEIPT MODAL (KHỔ K80 PRINT PREVIEW) ──── */}
      {showReceiptModal && receipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm">Hóa Đơn Bán Lẻ (K80)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Thermal Receipt Body (Formatted for 80mm thermal paper) */}
            <div id="thermal-receipt" className="p-6 text-slate-900 font-mono text-xs space-y-4 bg-white">
              {/* Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-black uppercase tracking-wider">MADK STORE</h2>
                <p className="text-[10px] text-slate-600">Showroom High-Tech & Gaming Gear</p>
                <p className="text-[10px] text-slate-600">Hotline: 1900 6868 • Website: mad-k-store.vercel.app</p>
                <h3 className="text-xs font-black uppercase pt-2">PHIẾU THANH TOÁN</h3>
                <p className="text-[10px] text-slate-500">Mã HĐ: {receipt.orderNumber}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(receipt.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Cashier & Customer Info */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Thu ngân:</span>
                  <span className="font-bold">{user?.fullName || 'Thu ngân'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span className="font-bold">{receipt.customerName || 'Khách lẻ'}</span>
                </div>
                {receipt.customerPhone && (
                  <div className="flex justify-between">
                    <span>SĐT:</span>
                    <span>{receipt.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 pb-1 border-b border-slate-200">
                  <span>Tên sản phẩm</span>
                  <span>T.Tiền</span>
                </div>
                {receipt.items?.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="font-bold text-slate-900 leading-tight">{it.productName}</p>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{it.quantity} x {formatVND(it.unitPrice)}</span>
                      <span className="font-bold text-slate-900">{formatVND(it.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatVND(receipt.subtotalAmount)}</span>
                </div>
                {receipt.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá:</span>
                    <span>-{formatVND(receipt.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                  <span>TỔNG THANH TOÁN:</span>
                  <span>{formatVND(receipt.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Hình thức:</span>
                  <span className="font-bold">{receipt.paymentMethod}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center space-y-1 pt-2 text-[10px] text-slate-500">
                <p className="font-bold text-slate-800">CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI!</p>
                <p>Bảo hành chính hãng 12-24 tháng theo tiêu chuẩn nhà sản xuất.</p>
                <p className="font-mono text-[9px] pt-1">Powered by MadK Retail POS</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={triggerPrintReceipt}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <IconReceipt className="w-4 h-4 text-white" />
                <span>In hóa đơn (K80)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Đóng / Đơn mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosPage;
