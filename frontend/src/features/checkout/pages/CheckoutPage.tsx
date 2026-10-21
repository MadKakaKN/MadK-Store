import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../cart/context/CartContext';
import { useAuth } from '../../auth/context/AuthContext';
import { addressApi } from '../../../api/addressApi';
import orderApi from '../../../api/orderApi';
import paymentApi from '../../../api/paymentApi';
import { couponApi } from '../../../api/couponApi';
import { formatVND } from '../../../utils/format';
import type { ProvinceDto, DistrictDto, WardDto, AddressDto } from '../../../types/address';
import type { CheckoutCodRequestDto, ShippingAddressInputDto } from '../../../types/order';

export const CheckoutPage: React.FC = () => {
  const { items, totalAmount, itemCount, isLoading: isCartLoading, refreshCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Khóa Idempotency sinh một lần cho mỗi phiên checkout để chống bấm đặt hàng nhiều lần
  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10)
  );

  // Trạng thái địa chỉ người dùng đã đăng nhập
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isUsingNewAddress, setIsUsingNewAddress] = useState<boolean>(false);

  // Form địa chỉ nhập mới / khách vãng lai
  const [recipientName, setRecipientName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [provinceCode, setProvinceCode] = useState<string>('');
  const [provinceName, setProvinceName] = useState<string>('');
  const [districtCode, setDistrictCode] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [wardCode, setWardCode] = useState<string>('');
  const [wardName, setWardName] = useState<string>('');
  const [detailedAddress, setDetailedAddress] = useState<string>('');

  // Dropdown địa giới hành chính
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [wards, setWards] = useState<WardDto[]>([]);

  // Ghi chú & Phương thức thanh toán
  const [customerNote, setCustomerNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPay'>('COD');

  // Trạng thái Coupon & Phí Vận Chuyển
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string | null;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);

  // Phí vận chuyển và thông tin giao hàng ước tính
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [carrierName, setCarrierName] = useState<string>('MadK Express');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('1 - 3 ngày làm việc');
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(false);

  // Trạng thái Submit & Error Handling
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStockError, setIsStockError] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // 1. Tải danh sách tỉnh thành (dữ liệu mở)
  useEffect(() => {
    let isMounted = true;
    addressApi.getProvinces().then((list) => {
      if (isMounted) setProvinces(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải địa chỉ đã lưu nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      addressApi
        .getMyAddresses()
        .then((list) => {
          setSavedAddresses(list);
          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(defaultAddr.id);
            setIsUsingNewAddress(false);
          } else {
            setIsUsingNewAddress(true);
          }
        });

      if (user) {
        setRecipientName(user.fullName || '');
        setPhoneNumber(user.phoneNumber || '');
        setRecipientEmail(user.email || '');
      }
    } else {
      setIsUsingNewAddress(true);
    }
  }, [isAuthenticated, user]);

  // 3. Cascading Dropdown: Tỉnh -> Huyện
  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      setDistrictCode('');
      setDistrictName('');
      setWards([]);
      setWardCode('');
      setWardName('');
      return;
    }

    const p = provinces.find((item) => item.code === provinceCode);
    if (p) setProvinceName(p.name);

    addressApi.getDistricts(provinceCode).then((list) => {
      setDistricts(list);
      setDistrictCode('');
      setDistrictName('');
      setWards([]);
      setWardCode('');
      setWardName('');
    });
  }, [provinceCode, provinces]);

  // 4. Cascading Dropdown: Huyện -> Xã
  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      setWardCode('');
      setWardName('');
      return;
    }

    const d = districts.find((item) => item.code === districtCode);
    if (d) setDistrictName(d.name);

    addressApi.getWards(districtCode).then((list) => {
      setWards(list);
      setWardCode('');
      setWardName('');
    });
  }, [districtCode, districts]);

  // 5. Cập nhật WardName khi chọn xã
  const handleWardChange = (code: string) => {
    setWardCode(code);
    const w = wards.find((item) => item.code === code);
    if (w) setWardName(w.name);
  };

  // Ước tính phí vận chuyển & áp dụng mã giảm giá realtime
  const fetchEstimate = async (couponToApply?: string | null) => {
    if (items.length === 0) return;

    let shippingAddressPayload: ShippingAddressInputDto | null = null;
    let addressIdPayload: string | null = null;

    if (isAuthenticated && !isUsingNewAddress && selectedAddressId) {
      addressIdPayload = selectedAddressId;
    } else if (provinceName) {
      shippingAddressPayload = {
        recipientName: recipientName.trim() || 'Người nhận',
        phoneNumber: phoneNumber.trim() || '0900000000',
        provinceCode,
        provinceName,
        districtCode,
        districtName,
        wardCode,
        wardName,
        detailedAddress: detailedAddress.trim() || 'Địa chỉ',
      };
    }

    const codeToTest = couponToApply !== undefined ? couponToApply : appliedCoupon?.code;

    try {
      const res = await couponApi.estimateCheckout({
        addressId: addressIdPayload,
        shippingAddress: shippingAddressPayload,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: codeToTest || undefined,
      });

      if (res.isSuccess && res.data) {
        setShippingFee(res.data.shippingFee);
        setCarrierName(res.data.carrierName || 'MadK Express');
        setEstimatedDelivery(res.data.estimatedDelivery || '1 - 3 ngày');
        setIsFreeShipping(res.data.isFreeShipping);

        if (codeToTest) {
          if (res.data.isCouponValid) {
            setAppliedCoupon({
              code: res.data.couponCode || codeToTest,
              discountAmount: res.data.discountAmount,
              description: res.data.couponDescription,
            });
            setCouponError(null);
          } else {
            setAppliedCoupon(null);
            setCouponError(res.data.couponErrorMessage || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện.');
          }
        } else {
          setAppliedCoupon(null);
          setCouponError(null);
        }
      }
    } catch {
      // ignore transient estimate error
    }
  };

  // Tự động tính toán lại khi địa chỉ hoặc giỏ hàng thay đổi
  useEffect(() => {
    fetchEstimate();
  }, [selectedAddressId, isUsingNewAddress, provinceName, totalAmount]);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá.');
      return;
    }
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      await fetchEstimate(couponInput.trim().toUpperCase());
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponInput('');
    setAppliedCoupon(null);
    setCouponError(null);
    await fetchEstimate(null);
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = Math.max(0, totalAmount - discountAmount + shippingFee);

  // Validate form địa chỉ trước khi submit
  const validateForm = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (isUsingNewAddress || !isAuthenticated) {
      if (!recipientName.trim()) {
        errs.recipientName = 'Vui lòng nhập họ và tên người nhận.';
      }
      if (!phoneNumber.trim()) {
        errs.phoneNumber = 'Vui lòng nhập số điện thoại nhận hàng.';
      } else if (!/^0[0-9]{9,10}$/.test(phoneNumber.trim().replace(/\s/g, ''))) {
        errs.phoneNumber = 'Số điện thoại không hợp lệ (cần bắt đầu bằng 0, gồm 10 chữ số).';
      }
      if (!provinceCode) {
        errs.provinceCode = 'Vui lòng chọn Tỉnh/Thành phố.';
      }
      if (!districtCode) {
        errs.districtCode = 'Vui lòng chọn Quận/Huyện.';
      }
      if (!wardCode) {
        errs.wardCode = 'Vui lòng chọn Phường/Xã.';
      }
      if (!detailedAddress.trim()) {
        errs.detailedAddress = 'Vui lòng nhập số nhà, tên đường hoặc tòa nhà.';
      }
    } else {
      if (!selectedAddressId) {
        errs.selectedAddress = 'Vui lòng chọn một địa chỉ nhận hàng từ sổ địa chỉ.';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Xử lý gửi đơn đặt hàng COD
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsStockError(false);

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let shippingAddressPayload: ShippingAddressInputDto | null = null;
      let addressIdPayload: string | null = null;

      if (isAuthenticated && !isUsingNewAddress && selectedAddressId) {
        addressIdPayload = selectedAddressId;
      } else {
        shippingAddressPayload = {
          recipientName: recipientName.trim(),
          phoneNumber: phoneNumber.trim(),
          recipientEmail: recipientEmail.trim() || null,
          provinceCode,
          provinceName,
          districtCode,
          districtName,
          wardCode,
          wardName,
          detailedAddress: detailedAddress.trim(),
        };
      }

      const checkoutPayload: CheckoutCodRequestDto = {
        addressId: addressIdPayload,
        shippingAddress: shippingAddressPayload,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        customerNote: customerNote.trim() || null,
        idempotencyKey: idempotencyKeyRef.current,
        couponCode: appliedCoupon?.code || null,
      };

      if (paymentMethod === 'VNPay') {
        const vnpayRes = await paymentApi.checkoutVnpay(checkoutPayload);
        if (vnpayRes.isSuccess && vnpayRes.data?.paymentUrl) {
          await clearCart();
          await refreshCart();
          // Chuyển hướng người dùng sang cổng thanh toán VNPay Sandbox
          window.location.href = vnpayRes.data.paymentUrl;
          return;
        } else {
          const errorText = vnpayRes.error || 'Khởi tạo thanh toán VNPay không thành công. Vui lòng kiểm tra lại.';
          setErrorMessage(errorText);
          if (
            errorText.toLowerCase().includes('tồn kho') ||
            errorText.toLowerCase().includes('hết hàng') ||
            errorText.toLowerCase().includes('không đủ')
          ) {
            setIsStockError(true);
          }
          return;
        }
      }

      // Thanh toán COD
      const res = await orderApi.checkoutCod(checkoutPayload);

      if (res.isSuccess && res.data) {
        // Đặt hàng thành công!
        await clearCart();
        await refreshCart();
        navigate(`/checkout/success?orderNumber=${encodeURIComponent(res.data.orderNumber)}`, {
          replace: true,
          state: { order: res.data },
        });
      } else {
        const errorText = res.error || 'Đặt hàng không thành công. Vui lòng kiểm tra lại.';
        setErrorMessage(errorText);

        // Phát hiện lỗi tồn kho giữa chừng
        if (
          errorText.toLowerCase().includes('tồn kho') ||
          errorText.toLowerCase().includes('hết hàng') ||
          errorText.toLowerCase().includes('không đủ')
        ) {
          setIsStockError(true);
        }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ khi tạo đơn.';
      setErrorMessage(`Mất kết nối tới hệ thống: ${msg}. Vui lòng thử lại.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trạng thái giỏ hàng rỗng
  if (!isCartLoading && items.length === 0) {
    return (
      <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-inner">
          🛒
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Giỏ hàng của bạn đang trống</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Không có sản phẩm nào trong giỏ để thanh toán. Hãy chọn những mẫu bàn phím cơ và phụ kiện yêu thích trước nhé!
          </p>
        </div>
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all"
        >
          <span>Khám phá sản phẩm ngay</span>
          <span>&rarr;</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-2">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>&rsaquo;</span>
        <Link to="/cart" className="hover:text-brand-600 transition-colors">
          Giỏ hàng
        </Link>
        <span>&rsaquo;</span>
        <span className="font-semibold text-slate-900">Thanh toán & Đặt hàng</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span>Xác nhận thông tin & Đặt hàng</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Thanh toán COD
          </span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Vui lòng kiểm tra địa chỉ giao hàng và danh sách sản phẩm trước khi xác nhận đơn.
        </p>
      </div>

      {/* Error Banners */}
      {errorMessage && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border text-xs sm:text-sm space-y-2 animate-shake shadow-sm ${
            isStockError
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{isStockError ? '🚫' : '⚠️'}</span>
            <div className="flex-1">
              <p className="font-bold">{isStockError ? 'Hết hàng khả dụng giữa chừng:' : 'Lỗi xử lý đơn hàng:'}</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          {isStockError && (
            <div className="pt-2 pl-8 flex items-center gap-3">
              <Link
                to="/cart"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Quay lại giỏ hàng để cập nhật số lượng &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left (Forms) & Right (Order Summary) */}
      <form onSubmit={handleSubmitOrder} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Shipping Address & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Shipping Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-black text-sm flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Địa chỉ nhận hàng
                  </h2>
                </div>

                {isAuthenticated && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsUsingNewAddress(!isUsingNewAddress)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {isUsingNewAddress ? '← Chọn từ sổ địa chỉ' : '+ Giao tới địa chỉ khác'}
                  </button>
                )}
              </div>

              {/* Mode A: Chọn từ sổ địa chỉ đã lưu */}
              {isAuthenticated && !isUsingNewAddress && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Chọn địa chỉ giao hàng của bạn:
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <label
                          key={addr.id}
                          className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            value={addr.id}
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-brand-600 focus:ring-brand-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{addr.recipientName}</span>
                              <span className="text-slate-400">|</span>
                              <span className="font-mono text-slate-700">{addr.phoneNumber}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full ml-auto">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">
                              {addr.detailedAddress}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {formErrors.selectedAddress && (
                    <p className="text-xs text-rose-500 font-medium">{formErrors.selectedAddress}</p>
                  )}
                </div>
              )}

              {/* Mode B: Form nhập địa chỉ mới (Dành cho khách hoặc nhập địa chỉ mới) */}
              {(isUsingNewAddress || !isAuthenticated) && (
                <div className="space-y-4">
                  {!isAuthenticated && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <span>Bạn đã có tài khoản?</span>
                      <Link to="/auth/login" className="font-bold text-brand-600 hover:underline">
                        Đăng nhập để dùng sổ địa chỉ &rarr;
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Họ và tên người nhận <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                      />
                      {formErrors.recipientName && (
                        <p className="mt-1 text-xs text-rose-500">{formErrors.recipientName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                      />
                      {formErrors.phoneNumber && (
                        <p className="mt-1 text-xs text-rose-500">{formErrors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Địa chỉ Email (Nhận mã đơn & hóa đơn)
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="email@example.com (không bắt buộc)"
                      className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    />
                  </div>

                  {/* Cascading Location Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={provinceCode}
                        onChange={(e) => setProvinceCode(e.target.value)}
                        className="w-full px-3 py-3 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white"
                      >
                        <option value="">-- Chọn Tỉnh/Thành --</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.provinceCode && (
                        <p className="mt-1 text-[11px] text-rose-500">{formErrors.provinceCode}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Quận / Huyện <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={districtCode}
                        onChange={(e) => setDistrictCode(e.target.value)}
                        disabled={!provinceCode || districts.length === 0}
                        className="w-full px-3 py-3 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">-- Chọn Quận/Huyện --</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.districtCode && (
                        <p className="mt-1 text-[11px] text-rose-500">{formErrors.districtCode}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phường / Xã <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={wardCode}
                        onChange={(e) => handleWardChange(e.target.value)}
                        disabled={!districtCode || wards.length === 0}
                        className="w-full px-3 py-3 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">-- Chọn Phường/Xã --</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.wardCode && (
                        <p className="mt-1 text-[11px] text-rose-500">{formErrors.wardCode}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Địa chỉ cụ thể (Số nhà, tên đường, tòa nhà) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={detailedAddress}
                      onChange={(e) => setDetailedAddress(e.target.value)}
                      placeholder="Ví dụ: Tầng 4, Tòa Keangnam, đường Phạm Hùng"
                      className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    />
                    {formErrors.detailedAddress && (
                      <p className="mt-1 text-xs text-rose-500">{formErrors.detailedAddress}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-black text-sm flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                {/* COD Option */}
                <label
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer flex items-start gap-4 transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💵</span>
                      <span className="font-extrabold text-sm text-slate-900">
                        Thanh toán tiền mặt khi nhận hàng (COD)
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full ml-auto">
                        Tiền mặt
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      Bạn chỉ cần thanh toán khi nhân viên bưu tá giao kiện hàng đến tận nơi. Được kiểm tra tem niêm phong và đóng gói bên ngoài.
                    </p>
                  </div>
                </label>

                {/* VNPay Option (Active Sandbox) */}
                <label
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer flex items-start gap-4 transition-all ${
                    paymentMethod === 'VNPay'
                      ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPay"
                    checked={paymentMethod === 'VNPay'}
                    onChange={() => setPaymentMethod('VNPay')}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <span className="font-extrabold text-sm text-slate-900">
                        Thanh toán trực tuyến VNPay / QR Code
                      </span>
                      <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full ml-auto">
                        Sandbox
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      Quét mã VNPAY-QR, thẻ ATM nội địa hoặc thẻ quốc tế Visa/Mastercard. Giữ hàng tạm 15 phút an toàn tuyệt đối.
                    </p>
                  </div>
                </label>
              </div>
            </div>


            {/* Step 3: Customer Note */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-black text-sm flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Ghi chú cho đơn hàng
                </h2>
              </div>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ghi chú thêm về thời gian giao hàng, hướng dẫn người giao hàng..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Placement CTA (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900">
                  Đơn hàng ({itemCount} sản phẩm)
                </h2>
                <Link
                  to="/cart"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Sửa giỏ hàng
                </Link>
              </div>

              {/* Items List Preview */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">⌨️</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.variantName} × <strong className="text-slate-800">{item.quantity}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 flex-shrink-0">
                      {formatVND(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mã giảm giá / Voucher */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Mã ưu đãi / Voucher</span>
                  {appliedCoupon && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Đã áp dụng
                    </span>
                  )}
                </label>

                {appliedCoupon ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg text-xs">
                          {appliedCoupon.code}
                        </span>
                        <span className="font-bold text-emerald-700">
                          - {formatVND(appliedCoupon.discountAmount)}
                        </span>
                      </div>
                      {appliedCoupon.description && (
                        <p className="mt-1 text-[11px] text-emerald-700/80 truncate">
                          {appliedCoupon.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-[11px] transition-colors flex-shrink-0"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        placeholder="Nhập mã (VD: MADK2026, WELCOME50K)"
                        className="flex-1 px-3.5 py-2.5 rounded-2xl text-xs uppercase font-mono tracking-wider border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
                      >
                        {isValidatingCoupon ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Áp dụng'
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                        <span>⚠️</span> {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatVND(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>Phí vận chuyển:</span>
                    <span className="text-[10px] text-slate-400">
                      {carrierName} • {estimatedDelivery}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-semibold ${
                      isFreeShipping || shippingFee === 0 ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isFreeShipping || shippingFee === 0 ? '0 ₫ (Miễn phí)' : formatVND(shippingFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Giảm giá voucher:</span>
                  <span
                    className={`font-mono font-semibold ${
                      discountAmount > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {discountAmount > 0 ? `- ${formatVND(discountAmount)}` : '0 ₫'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-slate-900">
                  <div>
                    <span className="text-sm font-black block">Tổng thanh toán:</span>
                    <span className="text-[11px] text-slate-400 font-normal">Đã gồm VAT & Phí vận chuyển</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-brand-600 font-mono">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Submit CTA Button with Anti-Double-Click Protection */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>
                      {paymentMethod === 'VNPay'
                        ? 'Đang khởi tạo cổng VNPay...'
                        : 'Đang kiểm tra tồn kho & tạo đơn...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'VNPay'
                        ? 'Chuyển sang Cổng Thanh toán VNPay'
                        : 'Xác nhận Đặt hàng (COD)'}
                    </span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>


              {/* Reassurance notes */}
              <div className="text-[11px] text-slate-400 space-y-1.5 text-center">
                <p>🔒 Bằng việc đặt hàng, bạn đồng ý với Điều khoản mua sắm của MadK Store.</p>
                <p>📦 Tồn kho sẽ được giữ trước cho bạn ngay khi tạo đơn thành công.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
