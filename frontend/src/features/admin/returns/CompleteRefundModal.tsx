import React, { useState } from 'react';
import { ReturnRequestDto } from '../../../types/return';
import adminReturnApi from '../../../api/adminReturnApi';
import { useToast } from '../components/common/ToastContext';

interface CompleteRefundModalProps {
  returnRequest: ReturnRequestDto | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (updated: ReturnRequestDto) => void;
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const CompleteRefundModal: React.FC<CompleteRefundModalProps> = ({
  returnRequest,
  isOpen,
  onClose,
  onCompleted,
}) => {
  const toast = useToast();
  const [refundAmount, setRefundAmount] = useState<number>(returnRequest?.refundAmount || 0);
  const [restockInventory, setRestockInventory] = useState<boolean>(true);
  const [note, setNote] = useState<string>('Đã kiểm tra sản phẩm hoàn trả và thực hiện hoàn tiền.');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    returnRequest ? `REFUND_${returnRequest.id.substring(0, 8)}_${Date.now()}` : ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (returnRequest) {
      setRefundAmount(returnRequest.refundAmount);
      setIdempotencyKey(`REFUND_${returnRequest.id.substring(0, 8)}_${Date.now()}`);
    }
  }, [returnRequest]);

  if (!isOpen || !returnRequest) return null;

  const isValidAmount = refundAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;

    setIsSubmitting(true);
    try {
      const updated = await adminReturnApi.completeReturnAndRefund(returnRequest.id, {
        refundAmount,
        restockInventory,
        note: note.trim() || undefined,
        idempotencyKey: idempotencyKey.trim() || undefined,
      });
      toast.success(
        `Đã hoàn tất hoàn tiền ${formatVnd(refundAmount)} cho đơn #${returnRequest.orderNumber} và cập nhật tồn kho.`,
        'Hoàn tất thành công'
      );
      onCompleted(updated);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Xử lý hoàn tiền thất bại.',
        'Lỗi giao dịch'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-modal-title"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            💸
          </div>
          <div>
            <h3 id="complete-modal-title" className="text-base font-bold text-slate-900">
              Nhận hàng & Hoàn tất hoàn tiền
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đơn hàng: <strong className="font-mono text-slate-800">#{returnRequest.orderNumber}</strong> • Khách: {returnRequest.customerName || returnRequest.customerEmail || 'Khách hàng'}
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-slate-50 border border-emerald-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Số tiền yêu cầu hoàn:</span>
            <p className="text-sm font-bold text-slate-800 font-mono">{formatVnd(returnRequest.refundAmount)}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Số lượng mặt hàng trả:</span>
            <p className="text-sm font-bold text-slate-800">{returnRequest.items?.length || 0} sản phẩm</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Refund amount input */}
          <div>
            <label htmlFor="refund-amount-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Số tiền hoàn thực tế (VND) <span className="text-rose-500">*</span>
            </label>
            <input
              id="refund-amount-input"
              type="number"
              min={1000}
              step={1000}
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
              required
            />
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Bằng chữ: {formatVnd(refundAmount)}
            </p>
          </div>

          {/* Restock Inventory Checkbox */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={restockInventory}
                onChange={(e) => setRestockInventory(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-emerald-600 shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900">
                  Nhập lại hàng vào kho (Restock Inventory)
                </span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Tự động tăng số lượng tồn thực tế (OnHand) của từng phân loại sản phẩm trong kho MadK Store tương ứng với số lượng hàng trả.
                </p>
              </div>
            </label>
          </div>

          {/* Note Input */}
          <div>
            <label htmlFor="refund-note-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú hoàn tiền / Chứng từ
            </label>
            <input
              id="refund-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập mã biên nhận kho, số GD ngân hàng hoặc ghi chú..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none"
              maxLength={300}
            />
          </div>

          {/* Idempotency Key */}
          <div>
            <label htmlFor="refund-idempotency-input" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Mã Idempotency (Chống hoàn trùng lặp)</span>
              <span className="text-[10px] text-slate-400 font-normal">Tự động sinh</span>
            </label>
            <input
              id="refund-idempotency-input"
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none"
              placeholder="REFUND_xxx"
            />
          </div>

          {/* Critical Warning */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <p className="font-bold">Hành động này sẽ thực hiện:</p>
              <p>• Yêu cầu đổi trả chuyển sang: <strong className="text-emerald-700">Đã hoàn tiền (Completed)</strong>.</p>
              <p>• Trạng thái đơn hàng chuyển sang: <strong className="text-slate-800">Đã hoàn trả (Returned)</strong>.</p>
              <p>• Giao dịch không thể hoàn tác.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang xử lý hoàn tiền...
                </>
              ) : (
                <>
                  <span>💸</span> Xác nhận nhập kho & Hoàn tiền
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteRefundModal;
