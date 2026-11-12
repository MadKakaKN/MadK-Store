import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COMPONENT_SLOTS, PREBUILT_CONFIGS } from '../pcBuilderData';
import { ComponentSlotConfig, ComponentSlotId, SelectedPart, PrebuiltConfig } from '../types';
import { ComponentSlotRow } from '../components/ComponentSlotRow';
import { SelectPartModal } from '../components/SelectPartModal';
import { WattageCalculatorCard } from '../components/WattageCalculatorCard';
import { GamingFpsPredictorCard } from '../components/GamingFpsPredictorCard';
import { PrintQuoteView } from '../components/PrintQuoteView';
import { useCart } from '../../cart/context/CartContext';
import { formatVND } from '../../../utils/format';
import SEOHead from '../../../components/common/SEOHead';

export const PcBuilderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [selectedParts, setSelectedParts] = useState<Partial<Record<ComponentSlotId, SelectedPart>>>(() => {
    // Check if preset param is passed in URL
    const presetId = searchParams.get('preset');
    if (presetId) {
      const match = PREBUILT_CONFIGS.find((p) => p.id === presetId);
      if (match) return match.parts;
    }
    // Default to the first popular preset
    return PREBUILT_CONFIGS[0].parts;
  });

  const [activeSlotModal, setActiveSlotModal] = useState<ComponentSlotConfig | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddingCart, setIsAddingCart] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectPart = (slotId: ComponentSlotId, part: SelectedPart) => {
    setSelectedParts((prev) => ({
      ...prev,
      [slotId]: part,
    }));
    showToast(`Đã thêm ${part.name.slice(0, 35)}... vào cấu hình`);
  };

  const handleRemovePart = (slotId: ComponentSlotId) => {
    setSelectedParts((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const handleUpdateQuantity = (slotId: ComponentSlotId, quantity: number) => {
    setSelectedParts((prev) => {
      const current = prev[slotId];
      if (!current) return prev;
      return {
        ...prev,
        [slotId]: { ...current, quantity },
      };
    });
  };

  const handleApplyPreset = (preset: PrebuiltConfig) => {
    setSelectedParts(preset.parts);
    setSearchParams({ preset: preset.id });
    showToast(`Đã tải cấu hình mẫu: ${preset.name}`);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới toàn bộ cấu hình?')) {
      setSelectedParts({});
      setSearchParams({});
      showToast('Đã làm mới cấu hình máy tính.');
    }
  };

  // Calculate totals
  const totalPartsCount = Object.values(selectedParts).reduce((acc, p) => acc + (p?.quantity || 0), 0);
  const totalPrice = Object.values(selectedParts).reduce(
    (acc, p) => acc + (p ? p.price * p.quantity : 0),
    0
  );

  // Add all parts to Cart
  const handleAddAllToCart = async () => {
    const partsArray = Object.values(selectedParts).filter(Boolean) as SelectedPart[];
    if (partsArray.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 linh kiện trước khi thêm vào giỏ hàng.');
      return;
    }

    setIsAddingCart(true);
    let successCount = 0;

    for (const part of partsArray) {
      try {
        // Fallback variantId or part id
        const targetId = part.variantId || part.id;
        const res = await addToCart(targetId, part.quantity, part.price);
        if (res.success) {
          successCount++;
        }
      } catch {
        // Ignore single item error to allow partial add
      }
    }

    setIsAddingCart(false);
    showToast(`Đã thêm toàn bộ ${partsArray.length} linh kiện dàn PC vào giỏ hàng!`);
  };

  // Share Configuration link
  const handleShareConfig = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Đã sao chép liên kết cấu hình vào bộ nhớ tạm!');
    } else {
      prompt('Sao chép liên kết cấu hình dưới đây:', shareUrl);
    }
  };

  // Ask MadK Neural AI
  const handleConsultAi = () => {
    const partsSummary = Object.entries(selectedParts)
      .map(([slot, part]) => `${slot.toUpperCase()}: ${part?.name}`)
      .join(', ');

    const promptText = `Hãy đánh giá hiệu năng dàn PC này của tôi xem có bị nghẽn cổ chai không và chơi game/làm việc tốt ở mức nào: ${partsSummary} (Tổng giá: ${formatVND(totalPrice)})`;

    // Dispatch custom event to open chat box with prefilled query
    window.dispatchEvent(
      new CustomEvent('madk:open-ai-chat', {
        detail: { prompt: promptText },
      })
    );
    showToast('Đã chuyển cấu hình sang MadK Neural AI!');
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 pb-32">
      <SEOHead
        title="Xây Dựng Cấu Hình PC - MadK PC Builder Pro"
        description="Công cụ tự build PC gaming và đồ họa chuyên nghiệp của MadK Store. Tự động tính toán công suất nguồn (Wattage), kiểm tra tương thích phần cứng và in báo giá nhanh chóng."
        canonicalUrl="https://madk.store/pc-builder"
        keywords="build pc, xây dựng cấu hình máy tính, linh kiện máy tính, tự ráp pc, tdp calculator, báo giá pc"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            ✓
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="rounded-3.5xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-500/15 text-blue-300 border border-blue-400/30">
              <span>🖥️</span>
              <span>MADK PC BUILDER PRO 2026</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Xây dựng cấu hình máy tính{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                theo ý bạn
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tự tay chọn từng linh kiện chính hãng, bộ đo công suất nguồn tự động (TDP Watt), cảnh báo tương thích thông minh và xuất bảng báo giá chuẩn chỉ với 1 click.
            </p>
          </div>

          {/* Quick preset selector buttons */}
          <div className="flex flex-col gap-2.5 flex-shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hoặc chọn nhanh cấu hình mẫu:
            </span>
            <div className="flex flex-wrap gap-2">
              {PREBUILT_CONFIGS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition-all shadow-sm hover:scale-102 flex items-center gap-2"
                >
                  <span>⚡</span>
                  <span>{preset.name}</span>
                  <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-200">
                    {formatVND(preset.estimatedPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Component Slots on Left & Calculator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Component Slots List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Danh sách linh kiện máy tính</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                {Object.keys(selectedParts).length} / {COMPONENT_SLOTS.length} mục
              </span>
            </h2>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              <span>🗑️</span>
              <span>Làm mới cấu hình</span>
            </button>
          </div>

          <div className="space-y-3">
            {COMPONENT_SLOTS.map((slot) => (
              <ComponentSlotRow
                key={slot.id}
                slot={slot}
                selectedPart={selectedParts[slot.id]}
                onOpenModal={setActiveSlotModal}
                onRemovePart={handleRemovePart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Wattage Meter & Summary Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Wattage & Compatibility Widget */}
          <WattageCalculatorCard selectedParts={selectedParts} />

          {/* AI Gaming FPS Predictor & Bottleneck Analyzer */}
          <GamingFpsPredictorCard selectedParts={selectedParts} />

          {/* Pricing & 1-Click Order Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Chi phí dự tính
              </span>
              <div className="text-3xl font-black text-blue-700 tracking-tight">
                {formatVND(totalPrice)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Đã bao gồm VAT, công ráp máy & cài đặt hoàn toàn miễn phí.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {/* Primary CTA: Add All to Cart */}
              <button
                type="button"
                disabled={isAddingCart || totalPartsCount === 0}
                onClick={handleAddAllToCart}
                className="w-full py-4 rounded-2.5xl font-black text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 shadow-xl shadow-blue-600/25 transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
              >
                <span>🛒</span>
                <span>{isAddingCart ? 'Đang thêm linh kiện...' : 'Thêm cả bộ vào giỏ hàng'}</span>
              </button>

              {/* Print / Export PDF Quote */}
              <button
                type="button"
                disabled={totalPartsCount === 0}
                onClick={() => setShowPrintView(true)}
                className="w-full py-3 rounded-2xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>🖨️</span>
                <span>In bảng báo giá / Lưu PDF</span>
              </button>

              {/* Consult Neural AI */}
              <button
                type="button"
                onClick={handleConsultAi}
                className="w-full py-3 rounded-2xl font-bold text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>✨</span>
                <span>Hỏi MadK Neural AI chấm điểm cấu hình</span>
              </button>

              {/* Share link */}
              <button
                type="button"
                onClick={handleShareConfig}
                className="w-full py-2.5 rounded-2xl font-medium text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🔗</span>
                <span>Sao chép liên kết chia sẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Select Part Modal */}
      <SelectPartModal
        isOpen={!!activeSlotModal}
        slot={activeSlotModal}
        onClose={() => setActiveSlotModal(null)}
        onSelectPart={handleSelectPart}
      />

      {/* Print / Quotation View Modal */}
      {showPrintView && (
        <PrintQuoteView
          selectedParts={selectedParts}
          totalPrice={totalPrice}
          onClose={() => setShowPrintView(false)}
        />
      )}
    </div>
  );
};

export default PcBuilderPage;
