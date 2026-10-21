import React, { useMemo, useState } from 'react';
import { OrderDto, OrderItemDto } from '../../../../types/order';
import {
  ReturnRequestDto,
  RETURN_REASON_PRESETS,
  RETURN_CONDITION_OPTIONS,
} from '../../../../types/return';
import returnApi from '../../../../api/returnApi';

interface ReturnRequestModalProps {
  order: OrderDto;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (request: ReturnRequestDto) => void;
}

interface ItemSelection {
  selected: boolean;
  quantity: number;
  condition: string;
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  order,
  isOpen,
  onClose,
  onCreated,
}) => {
  const returnableItems = useMemo(
    () => order.items.filter((i): i is OrderItemDto & { variantId: string } => !!i.variantId),
    [order.items]
  );

  const [selections, setSelections] = useState<Record<string, ItemSelection>>(() => {
    const init: Record<string, ItemSelection> = {};
    for (const item of order.items) {
      init[item.id] = {
        selected: order.items.length === 1 && !!item.variantId,
        quantity: item.quantity,
        condition: 'Đã mở hộp',
      };
    }
    return init;
  });
  const [presetReason, setPresetReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedItems = returnableItems.filter((i) => selections[i.id]?.selected);
  const estimatedRefund = selectedItems.reduce(
    (sum, i) => sum + i.unitPriceSnapshot * (selections[i.id]?.quantity || 0),
    0
  );
  const finalReason = [presetReason, customReason.trim()].filter(Boolean).join(' — ');
  const canSubmit = selectedItems.length > 0 && finalReason.length >= 5 && agreed && !isSubmitting;

  const updateSelection = (itemId: string, patch: Partial<ItemSelection>) => {
    setSelections((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
  };

  const toggleAll = () => {
    const allSelected = returnableItems.every((i) => selections[i.id]?.selected);
    setSelections((prev) => {
      const next = { ...prev };
      for (const i of returnableItems) next[i.id] = { ...next[i.id], selected: !allSelected };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await returnApi.createReturnRequest(order.orderNumber, {
        reason: finalReason,
        customerNote: customerNote.trim() || undefined,
        items: selectedItems.map((i) => ({
          variantId: i.variantId,
          quantity: selections[i.id].quantity,
          condition: selections[i.id].condition,
        })),
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu đổi trả.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-8 max-h-[92vh] flex flex-col animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
      >
        {/* Header */}
        <div className="relative px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-t-3xl flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-orange-500/25">
                ↩️
              </div>
              <div>
                <h2 id="return-modal-title" className="text-lg font-black text-slate-900">
                  Yêu cầu đổi trả hàng
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đơn hàng <strong className="font-mono text-slate-800">#{order.orderNumber}</strong> •
                  Chọn sản phẩm và mô tả vấn đề bạn gặp phải
                </p>
              </div>
            </div>
            <button
              type="button"
              id="return-modal-close"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-500 flex items-center justify-center transition-colors border border-slate-200 disabled:opacity-50"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6 space-y-6">
          {/* Policy */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex gap-3">
            <span className="text-base">ℹ️</span>
            <ul className="space-y-1 leading-relaxed">
              <li>• Chỉ áp dụng cho đơn đã <strong>giao thành công</strong>. Mỗi đơn chỉ có 1 yêu cầu đang xử lý tại một thời điểm.</li>
              <li>• Sau khi được duyệt, vui lòng gửi hàng kèm đầy đủ phụ kiện về kho MadK Store.</li>
              <li>• Tiền hoàn sẽ không vượt quá số tiền bạn đã thanh toán cho đơn hàng.</li>
            </ul>
          </div>

          {/* Step 1: Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">1</span>
                Chọn sản phẩm cần đổi trả
              </h3>
              {returnableItems.length > 1 && (
                <button
                  type="button"
                  id="return-toggle-all"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  {returnableItems.every((i) => selections[i.id]?.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {order.items.map((item) => {
                const sel = selections[item.id];
                const disabled = !item.variantId;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 transition-all ${
                      sel?.selected
                        ? 'border-orange-400 bg-orange-50/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    } ${disabled ? 'opacity-50' : ''}`}
                  >
                    <label className={`flex items-center gap-3 p-3.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        id={`return-item-${item.id}`}
                        checked={!!sel?.selected}
                        disabled={disabled}
                        onChange={(e) => updateSelection(item.id, { selected: e.target.checked })}
                        className="w-4 h-4 rounded accent-orange-500 flex-shrink-0"
                      />
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.thumbnailUrlSnapshot ? (
                          <img src={item.thumbnailUrlSnapshot} alt={item.productNameSnapshot} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">⌨️</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.productNameSnapshot}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.variantNameSnapshot} • <span className="font-mono">{item.skuSnapshot}</span>
                        </p>
                        {disabled && (
                          <p className="text-[10px] text-rose-600 mt-0.5">Sản phẩm không còn trong hệ thống, vui lòng liên hệ CSKH.</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-slate-900 font-mono">{formatVnd(item.unitPriceSnapshot)}</p>
                        <p className="text-[11px] text-slate-500">Đã mua: {item.quantity}</p>
                      </div>
                    </label>

                    {sel?.selected && (
                      <div className="px-3.5 pb-3.5 pt-0 flex flex-wrap items-center gap-4 text-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Số lượng trả:</span>
                          <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden">
                            <button
                              type="button"
                              aria-label="Giảm số lượng"
                              disabled={sel.quantity <= 1}
                              onClick={() => updateSelection(item.id, { quantity: Math.max(1, sel.quantity - 1) })}
                              className="w-8 h-8 hover:bg-slate-100 disabled:opacity-40 font-bold"
                            >
                              −
                            </button>
                            <span className="w-9 text-center font-bold font-mono">{sel.quantity}</span>
                            <button
                              type="button"
                              aria-label="Tăng số lượng"
                              disabled={sel.quantity >= item.quantity}
                              onClick={() => updateSelection(item.id, { quantity: Math.min(item.quantity, sel.quantity + 1) })}
                              className="w-8 h-8 hover:bg-slate-100 disabled:opacity-40 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Tình trạng:</span>
                          <select
                            id={`return-condition-${item.id}`}
                            value={sel.condition}
                            onChange={(e) => updateSelection(item.id, { condition: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none"
                          >
                            {RETURN_CONDITION_OPTIONS.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <span className="ml-auto font-bold text-orange-700 font-mono">
                          = {formatVnd(item.unitPriceSnapshot * sel.quantity)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 2: Reason */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">2</span>
              Lý do đổi trả <span className="text-rose-500">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {RETURN_REASON_PRESETS.map((r, idx) => {
                const active = presetReason === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    id={`return-reason-preset-${idx}`}
                    onClick={() => setPresetReason(active ? '' : r.value)}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-xs border transition-all flex items-start gap-2 ${
                      active
                        ? 'border-orange-400 bg-orange-50 text-orange-900 font-semibold shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{r.icon}</span>
                    <span className="leading-snug">{r.value}</span>
                  </button>
                );
              })}
            </div>
            <textarea
              id="return-custom-reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Mô tả chi tiết vấn đề (ví dụ: phím W bị double-click sau 2 ngày sử dụng)..."
              className="w-full px-4 py-3 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 resize-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{finalReason.length < 5 ? 'Vui lòng chọn hoặc nhập lý do (tối thiểu 5 ký tự)' : '✓ Đã có lý do'}</span>
              <span>{customReason.length}/500</span>
            </div>
          </section>

          {/* Step 3: Note */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">3</span>
              Ghi chú thêm (tùy chọn)
            </h3>
            <input
              id="return-customer-note"
              type="text"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              maxLength={300}
              placeholder="Thời gian thuận tiện để nhân viên liên hệ, thông tin tài khoản nhận hoàn tiền..."
              className="w-full px-4 py-2.5 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10"
            />
          </section>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in" role="alert">
              <span>⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl flex-shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                id="return-agree-policy"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              Tôi xác nhận thông tin chính xác và đồng ý với chính sách đổi trả
            </label>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dự kiến hoàn</p>
              <p className="text-lg font-black text-orange-600 font-mono leading-tight">{formatVnd(estimatedRefund)}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              id="return-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              id="return-submit-btn"
              disabled={!canSubmit}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>Gửi yêu cầu ({selectedItems.length} sản phẩm)</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReturnRequestModal;
