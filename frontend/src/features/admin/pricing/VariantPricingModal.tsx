import React, { useState, useEffect } from 'react';
import {
  CreatePriceScheduleDto,
  PriceType,
  UpdateBasePriceDto,
  VariantPricingDto,
} from '../../../types/pricing';
import { adminPricingApi } from '../../../api/adminPricingApi';

interface VariantPricingModalProps {
  isOpen: boolean;
  variantId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VariantPricingModal: React.FC<VariantPricingModalProps> = ({
  isOpen,
  variantId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VariantPricingDto | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'basePrice' | 'history'>('schedule');

  // Form State: New Promotion Schedule
  const [promoReason, setPromoReason] = useState('');
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [promoNote, setPromoNote] = useState('');
  const [submittingPromo, setSubmittingPromo] = useState(false);

  // Form State: Base Price
  const [baseOrigPrice, setBaseOrigPrice] = useState<number>(0);
  const [baseSalePrice, setBaseSalePrice] = useState<number>(0);
  const [baseReason, setBaseReason] = useState('');
  const [submittingBase, setSubmittingBase] = useState(false);

  // Status message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && variantId) {
      loadPricing(variantId);
    } else {
      setData(null);
      resetForms();
    }
  }, [isOpen, variantId]);

  const resetForms = () => {
    setPromoReason('');
    setPromoPrice(0);
    // Default startDate: now, default endDate: 7 days later
    const now = new Date();
    const future = new Date(Date.now() + 86400000 * 7);
    setPromoStartDate(formatDateTimeInput(now));
    setPromoEndDate(formatDateTimeInput(future));
    setIsIndefinite(false);
    setPromoNote('');
    setBaseReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const formatDateTimeInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const loadPricing = async (id: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPricingApi.getVariantPricing(id);
      if (res.isSuccess && res.data) {
        setData(res.data);
        setBaseOrigPrice(res.data.baseOriginalPrice);
        setBaseSalePrice(res.data.baseSalePrice);
        // Suggest promo price (e.g. 85% of base price)
        if (promoPrice === 0) {
          setPromoPrice(Math.round(res.data.baseSalePrice * 0.85));
        }
      } else {
        setErrorMessage(res.error || 'Không thể tải thông tin giá biến thể.');
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi tải thông tin giá.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId || !data) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!promoReason.trim()) {
      setErrorMessage('Vui lòng nhập tên chương trình hoặc lý do khuyến mãi.');
      return;
    }

    if (promoPrice <= 0) {
      setErrorMessage('Giá khuyến mãi phải lớn hơn 0đ.');
      return;
    }

    if (promoPrice > data.baseOriginalPrice) {
      setErrorMessage(
        `Giá khuyến mãi (${promoPrice.toLocaleString('vi-VN')}đ) không được vượt quá giá gốc niêm yết (${data.baseOriginalPrice.toLocaleString('vi-VN')}đ).`
      );
      return;
    }

    const startTs = new Date(promoStartDate).getTime();
    const endTs = isIndefinite ? null : new Date(promoEndDate).getTime();

    if (endTs && endTs <= startTs) {
      setErrorMessage('Thời gian kết thúc khuyến mãi phải sau thời gian bắt đầu.');
      return;
    }

    // Client-side overlap check
    const existingPromos = data.schedules.filter(
      (s) => s.isActive && s.priceType !== PriceType.Standard
    );

    const targetEnd = endTs || Infinity;
    for (const ex of existingPromos) {
      const exStart = new Date(ex.startDate).getTime();
      const exEnd = ex.endDate ? new Date(ex.endDate).getTime() : Infinity;

      if (startTs <= exEnd && exStart <= targetEnd) {
        setErrorMessage(
          `Khoảng thời gian này bị chồng chéo với chương trình '${ex.reason}' (${new Date(ex.startDate).toLocaleDateString()} - ${ex.endDate ? new Date(ex.endDate).toLocaleDateString() : 'Vô hạn'}). Vui lòng chọn khoảng thời gian khác hoặc hủy chương trình cũ.`
        );
        return;
      }
    }

    setSubmittingPromo(true);
    try {
      const payload: CreatePriceScheduleDto = {
        price: promoPrice,
        originalPrice: data.baseOriginalPrice,
        startDate: new Date(promoStartDate).toISOString(),
        endDate: isIndefinite ? null : new Date(promoEndDate).toISOString(),
        reason: promoReason.trim(),
        note: promoNote.trim() || undefined,
        priceType: PriceType.Promotion,
      };

      const res = await adminPricingApi.createPromotionSchedule(variantId, payload);
      if (res.isSuccess) {
        setSuccessMessage('Đã thêm chương trình khuyến mãi thành công!');
        setPromoReason('');
        await loadPricing(variantId);
        onSuccess?.();
      } else {
        setErrorMessage(res.error || 'Không thể tạo chương trình khuyến mãi.');
      }
    } catch {
      setErrorMessage('Lỗi khi gửi yêu cầu tạo khuyến mãi.');
    } finally {
      setSubmittingPromo(false);
    }
  };

  const handleUpdateBasePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (baseOrigPrice <= 0 || baseSalePrice <= 0) {
      setErrorMessage('Giá niêm yết và giá bán chuẩn phải lớn hơn 0đ.');
      return;
    }

    if (baseSalePrice > baseOrigPrice) {
      setErrorMessage('Giá bán chuẩn không được cao hơn giá gốc niêm yết.');
      return;
    }

    setSubmittingBase(true);
    try {
      const payload: UpdateBasePriceDto = {
        newOriginalPrice: baseOrigPrice,
        newSalePrice: baseSalePrice,
        reason: baseReason.trim() || 'Cập nhật giá niêm yết & chuẩn',
      };

      const res = await adminPricingApi.updateBasePrice(variantId, payload);
      if (res.isSuccess) {
        setSuccessMessage('Đã cập nhật giá bán chuẩn và ghi nhận lịch sử thành công!');
        setBaseReason('');
        await loadPricing(variantId);
        onSuccess?.();
      } else {
        setErrorMessage(res.error || 'Không thể cập nhật giá chuẩn.');
      }
    } catch {
      setErrorMessage('Lỗi khi cập nhật giá chuẩn.');
    } finally {
      setSubmittingBase(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thay đổi trạng thái kích hoạt của chương trình này?')) return;
    try {
      const res = await adminPricingApi.toggleScheduleActive(scheduleId);
      if (res.isSuccess) {
        if (variantId) await loadPricing(variantId);
        onSuccess?.();
      } else {
        alert(res.error || 'Thao tác không thành công.');
      }
    } catch {
      alert('Lỗi kết nối khi thay đổi trạng thái.');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chương trình giá này khỏi danh sách?')) return;
    try {
      const res = await adminPricingApi.deleteSchedule(scheduleId);
      if (res.isSuccess) {
        if (variantId) await loadPricing(variantId);
        onSuccess?.();
      } else {
        alert(res.error || 'Xóa không thành công.');
      }
    } catch {
      alert('Lỗi kết nối khi xóa chương trình.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm">
              🏷️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Quản lý Giá & Khuyến mãi theo Thời gian</h3>
                {data && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    SKU: {data.sku}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {data ? `${data.productName} — ${data.variantName}` : 'Đang tải dữ liệu biến thể...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && !data ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 mt-3">Đang nạp thông tin giá và lịch sử...</p>
            </div>
          ) : data ? (
            <>
              {/* Alert Notifications */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2.5">
                  <span className="text-base leading-none">✅</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Real-time Current Price Status Banner */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Giá hiện hành (Đang áp dụng)
                      </span>
                      {data.currentPrice.isOnSale ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse shadow-sm">
                          🔥 ĐANG KHUYẾN MÃI (-{data.currentPrice.discountPercent}%)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                          Giá niêm yết chuẩn
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-indigo-700">
                        {data.currentPrice.currentPrice.toLocaleString('vi-VN')}đ
                      </span>
                      {data.currentPrice.isOnSale && (
                        <span className="text-base text-slate-400 line-through">
                          {data.currentPrice.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    {data.currentPrice.isOnSale && data.currentPrice.promotionName && (
                      <p className="text-xs text-amber-700 font-medium">
                        Chương trình: <strong>{data.currentPrice.promotionName}</strong>
                        {data.currentPrice.promotionEndDate && (
                          <span className="ml-2 text-slate-500">
                            (Kết thúc lúc: {new Date(data.currentPrice.promotionEndDate).toLocaleString('vi-VN')})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500">
                      Giá niêm yết gốc:{' '}
                      <strong className="text-slate-800">
                        {data.baseOriginalPrice.toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                    <div className="text-xs text-slate-500">
                      Giá bán chuẩn thông thường:{' '}
                      <strong className="text-slate-800">
                        {data.baseSalePrice.toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'schedule'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>📅</span> Thêm Khuyến mãi theo Thời gian
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('basePrice')}
                  className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'basePrice'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>⚙️</span> Điều chỉnh Giá gốc & Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`pb-3 px-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>📜</span> Lịch sử Giá & Lịch trình ({data.schedules.length})
                </button>
              </div>

              {/* Tab 1: Promotion Schedule Form */}
              {activeTab === 'schedule' && (
                <form onSubmit={handleCreatePromo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Tên chương trình / Lý do khuyến mãi *
                      </label>
                      <input
                        type="text"
                        required
                        value={promoReason}
                        onChange={(e) => setPromoReason(e.target.value)}
                        placeholder="Ví dụ: Flash Sale Cuối Tuần, Giáng Sinh 2026..."
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Giá khuyến mãi (VNĐ) *
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        required
                        value={promoPrice || ''}
                        onChange={(e) => setPromoPrice(Number(e.target.value))}
                        placeholder="Nhập số tiền khuyến mãi..."
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-semibold text-indigo-600"
                      />
                      {promoPrice > 0 && data.baseOriginalPrice > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Giảm{' '}
                          <span className="font-bold text-amber-600">
                            {(
                              ((data.baseOriginalPrice - promoPrice) / data.baseOriginalPrice) *
                              100
                            ).toFixed(1)}
                            %
                          </span>{' '}
                          so với giá niêm yết (Tiết kiệm{' '}
                          {(data.baseOriginalPrice - promoPrice).toLocaleString('vi-VN')}đ)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Thời gian Bắt đầu (Giờ & Ngày) *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={promoStartDate}
                        onChange={(e) => setPromoStartDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 uppercase">
                          Thời gian Kết thúc (Giờ & Ngày)
                        </label>
                        <label className="text-xs text-slate-500 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIndefinite}
                            onChange={(e) => setIsIndefinite(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Vô thời hạn
                        </label>
                      </div>
                      <input
                        type="datetime-local"
                        disabled={isIndefinite}
                        required={!isIndefinite}
                        value={isIndefinite ? '' : promoEndDate}
                        onChange={(e) => setPromoEndDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-mono disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Ghi chú nội bộ
                    </label>
                    <textarea
                      rows={2}
                      value={promoNote}
                      onChange={(e) => setPromoNote(e.target.value)}
                      placeholder="Ghi chú kế hoạch marketing, chiến dịch áp dụng..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingPromo}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingPromo && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>Thêm Lịch Khuyến mãi</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Base Price Adjustment Form */}
              {activeTab === 'basePrice' && (
                <form onSubmit={handleUpdateBasePrice} className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">Lưu ý khi điều chỉnh giá chuẩn:</p>
                    <p>
                      - <strong>Giá niêm yết:</strong> Giá công bố chính thức của hãng/cửa hàng.
                    </p>
                    <p>
                      - <strong>Giá bán chuẩn:</strong> Mức giá bán thường nhật khi không có khuyến mãi
                      thời hạn.
                    </p>
                    <p>
                      - Thao tác này sẽ tự động lưu vào <strong>Lịch sử giá</strong> và ghi nhận{' '}
                      <strong>AuditLog</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Giá niêm yết mới (Original Price) *
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        required
                        value={baseOrigPrice || ''}
                        onChange={(e) => setBaseOrigPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Giá bán chuẩn mới (Base Sale Price) *
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        required
                        value={baseSalePrice || ''}
                        onChange={(e) => setBaseSalePrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Lý do điều chỉnh giá
                    </label>
                    <input
                      type="text"
                      value={baseReason}
                      onChange={(e) => setBaseReason(e.target.value)}
                      placeholder="Ví dụ: Thay đổi giá nhập, điều chỉnh tỷ giá, chính sách nhà cung cấp..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingBase}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingBase && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>Lưu Giá Chuẩn & Ghi Lịch Sử</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Timeline & Schedule History */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {data.schedules.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Chưa có bản ghi lịch sử giá nào cho biến thể này.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {data.schedules.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            item.isCurrent
                              ? 'bg-indigo-50/50'
                              : item.isUpcoming
                              ? 'bg-amber-50/30'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  item.priceType === PriceType.Standard
                                    ? 'bg-slate-100 text-slate-700'
                                    : item.priceType === PriceType.FlashSale
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {item.priceType === PriceType.Standard
                                  ? 'Giá Chuẩn'
                                  : item.priceType === PriceType.FlashSale
                                  ? 'Flash Sale'
                                  : 'Khuyến Mãi'}
                              </span>

                              {/* Status Badge */}
                              {item.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  ● Đang Áp Dụng
                                </span>
                              )}
                              {item.isUpcoming && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  ⏳ Sắp Diễn Ra
                                </span>
                              )}
                              {item.isExpired && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                  Đã Kết Thúc
                                </span>
                              )}
                              {!item.isActive && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                  Đã Tạm Dừng
                                </span>
                              )}

                              <span className="font-semibold text-sm text-slate-900">
                                {item.reason}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <span>
                                Giá áp dụng:{' '}
                                <strong className="text-indigo-600 font-bold text-sm">
                                  {item.price.toLocaleString('vi-VN')}đ
                                </strong>
                              </span>
                              <span>
                                Giá gốc:{' '}
                                <span className="line-through text-slate-400">
                                  {item.originalPrice.toLocaleString('vi-VN')}đ
                                </span>
                              </span>
                              <span>
                                Hiệu lực:{' '}
                                <span className="font-mono text-slate-700">
                                  {new Date(item.startDate).toLocaleDateString('vi-VN')}{' '}
                                  {new Date(item.startDate).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  →{' '}
                                  {item.endDate
                                    ? `${new Date(item.endDate).toLocaleDateString('vi-VN')} ${new Date(
                                        item.endDate
                                      ).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`
                                    : 'Vô thời hạn'}
                                </span>
                              </span>
                            </div>

                            {item.note && (
                              <p className="text-xs text-slate-400 italic">Ghi chú: {item.note}</p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {item.priceType !== PriceType.Standard && (
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSchedule(item.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                  item.isActive
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                }`}
                              >
                                {item.isActive ? 'Tạm ngưng' : 'Kích hoạt lại'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(item.id)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 transition"
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
