import React, { useState } from 'react';
import { OrderDto } from '../../../../types/order';
import orderApi from '../../../../api/orderApi';

interface CancelOrderModalProps {
  order: OrderDto;
  isOpen: boolean;
  onClose: () => void;
  onCancelled: (updatedOrder: OrderDto) => void;
}

const COMMON_REASONS = [
  'Tôi muốn thay đổi thông tin người nhận hoặc địa chỉ giao hàng',
  'Tôi muốn đổi sang sản phẩm/phiên bản/màu switch khác',
  'Tôi tìm thấy sản phẩm có giá tốt hơn ở nơi khác',
  'Thời gian giao hàng dự kiến không phù hợp với tôi',
  'Tôi đổi ý, không có nhu cầu mua sản phẩm này nữa',
  'Lý do khác (vui lòng ghi rõ bên dưới)',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onCancelled,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOther = selectedReason === COMMON_REASONS[COMMON_REASONS.length - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalReason = isOther ? customReason.trim() : selectedReason;
    if (!finalReason) {
      setErrorMessage('Vui lòng nhập lý do cụ thể để shop hỗ trợ tốt hơn.');
      return;
    }

    setIsSubmitting(true);
    const res = await orderApi.cancelOrder(order.orderNumber, finalReason);
    setIsSubmitting(false);

    if (res.isSuccess && res.data) {
      onCancelled(res.data);
      onClose();
    } else {
      setErrorMessage(res.error || 'Hủy đơn hàng thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden relative animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Xác nhận Hủy Đơn Hàng</h2>
              <p className="text-xs text-slate-500 font-mono">Đơn hàng #{order.orderNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <span className="text-base leading-none">💡</span>
          <div>
            <p className="font-bold">Lưu ý về quy trình hoàn kho:</p>
            <p className="mt-0.5 text-amber-800">
              Khi hủy đơn, toàn bộ sản phẩm đang được giữ trước cho bạn sẽ lập tức được hoàn trả lại tồn kho bán chung. Bạn sẽ không thể khôi phục lại đơn hàng này sau khi đã xác nhận hủy.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span>❌</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Vui lòng chọn lý do hủy đơn:
          </label>

          <div className="space-y-2">
            {COMMON_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  selectedReason === r
                    ? 'bg-brand-50/60 border-brand-300 text-brand-900 font-semibold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {isOther && (
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Chi tiết lý do khác:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do chi tiết của bạn..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                required
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Giữ lại đơn hàng
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Đang xử lý hoàn kho...</span>
                </>
              ) : (
                <span>Xác nhận Hủy Đơn</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
