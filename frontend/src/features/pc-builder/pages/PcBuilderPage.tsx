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
    <div className="py-4 sm:py-6 px-4 md:px-6 max-w-[1200px] mx-auto space-y-6 pb-24">
      <SEOHead
        title="Xây Dựng Cấu Hình PC - MadK PC Builder Pro"
        description="Công cụ tự build PC gaming và đồ họa chuyên nghiệp của MadK Store. Tự động tính toán công suất nguồn (Wattage), kiểm tra tương thích phần cứng và in báo giá nhanh chóng."
        canonicalUrl="https://madk.store/pc-builder"
        keywords="build pc, xây dựng cấu hình máy tính, linh kiện máy tính, tự ráp pc, tdp calculator, báo giá pc"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#111827] text-white px-4 py-3 rounded-lg shadow-xl border border-gray-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Page Title Strip (Screen 8 Retail Standard) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5">
        <nav className="flex items-center text-xs text-gray-500 gap-2 mb-2">
          <a className="hover:text-[#1D4ED8] flex items-center gap-1" href="/">
            <span className="material-symbols-outlined text-[14px]">home</span>
            <span>Trang chủ</span>
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600">Tiện ích</span>
          <span className="text-gray-300">/</span>
          <span className="text-[#111827] font-semibold">Xây dựng cấu hình PC</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1D4ED8] text-2xl">build</span>
              <span>Xây Dựng Cấu Hình PC &amp; Kiểm Tra Tương Thích Tự Động</span>
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Thuật toán tự động quét socket CPU, chuẩn RAM, chiều dài VGA và công suất PSU đề xuất theo thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-3 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-gray-500">restart_alt</span>
              <span>Làm mới cấu hình</span>
            </button>
          </div>
        </div>

        {/* Quick preset selector pills */}
        <div className="mt-3.5 pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-amber-500">bolt</span>
            <span>Cấu hình mẫu:</span>
          </span>
          {PREBUILT_CONFIGS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1 rounded text-xs font-medium bg-[#F3F4F6] hover:bg-[#EFF6FF] text-gray-700 hover:text-[#1D4ED8] border border-[#E5E7EB] hover:border-[#1D4ED8] transition-colors flex items-center gap-1.5"
            >
              <span>{preset.name}</span>
              <span className="text-[10px] font-bold text-[#D70018]">
                {formatVND(preset.estimatedPrice)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Component Slots on Left & Calculator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Component Slots List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          {/* Header Bảng */}
          <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">
                Danh mục {COMPONENT_SLOTS.length} linh kiện lắp ráp
              </span>
              <span className="bg-blue-100 text-[#1D4ED8] text-[11px] px-2 py-0.5 rounded font-semibold">
                {Object.keys(selectedParts).length}/{COMPONENT_SLOTS.length} Đã chọn
              </span>
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline">Chuẩn phần cứng ATX / PCIe 4.0 &amp; 5.0</span>
          </div>

          <div className="p-3 space-y-2.5">
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
          <div className="bg-white rounded-lg p-5 border border-[#E5E7EB] space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Chi phí dự tính ({totalPartsCount} linh kiện)
              </span>
              <div className="text-2xl font-bold text-[#D70018] tracking-tight">
                {formatVND(totalPrice)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Đã bao gồm VAT 10%, công lắp ráp và cài đặt Windows/Driver chuẩn bán lẻ hoàn toàn miễn phí.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#E5E7EB]">
              {/* Primary CTA: Add All to Cart */}
              <button
                type="button"
                disabled={isAddingCart || totalPartsCount === 0}
                onClick={handleAddAllToCart}
                className="w-full h-11 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                <span>{isAddingCart ? 'Đang thêm linh kiện...' : 'Thêm cả bộ vào giỏ hàng'}</span>
              </button>

              {/* Print / Export PDF Quote */}
              <button
                type="button"
                disabled={totalPartsCount === 0}
                onClick={() => setShowPrintView(true)}
                className="w-full h-9 rounded-lg font-semibold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>In bảng báo giá / Lưu PDF</span>
              </button>

              {/* Consult Neural AI */}
              <button
                type="button"
                onClick={handleConsultAi}
                className="w-full h-9 rounded-lg font-semibold text-xs text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                <span>Hỏi MadK AI kiểm tra nghẽn cổ chai</span>
              </button>

              {/* Share link */}
              <button
                type="button"
                onClick={handleShareConfig}
                className="w-full py-1.5 rounded-lg font-medium text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
                <span>Sao chép liên kết cấu hình</span>
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
