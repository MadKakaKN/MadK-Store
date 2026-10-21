import React, { useState } from 'react';
import { ReturnRequestDto } from '../../../types/return';
import adminReturnApi from '../../../api/adminReturnApi';
import { useToast } from '../components/common/ToastContext';

interface ApproveReturnModalProps {
  returnRequest: ReturnRequestDto | null;
  isOpen: boolean;
  onClose: () => void;
  onApproved: (updated: ReturnRequestDto) => void;
}

export const ApproveReturnModal: React.FC<ApproveReturnModalProps> = ({
  returnRequest,
  isOpen,
  onClose,
  onApproved,
}) => {
  const toast = useToast();
  const [salesNote, setSalesNote] = useState<string>('Yêu cầu đổi trả đã được chấp thuận. Quý khách vui lòng đóng gói hàng và gửi về kho MadK Store theo hướng dẫn.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !returnRequest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await adminReturnApi.approveReturnRequest(returnRequest.id, {
        salesNote: salesNote.trim() || undefined,
      });
      toast.success(
        `Yêu cầu đổi trả cho đơn #${returnRequest.orderNumber} đã được duyệt thành công.`,
        'Duyệt thành công'
      );
      onApproved(updated);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể duyệt yêu cầu đổi trả.',
        'Lỗi xử lý'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-modal-title"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center text-xl shrink-0">
            ✓
          </div>
          <div>
            <h3 id="approve-modal-title" className="text-base font-bold text-slate-900">
              Duyệt yêu cầu đổi trả
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đơn hàng: <strong className="font-mono text-slate-800">#{returnRequest.orderNumber}</strong> • Khách: {returnRequest.customerName || returnRequest.customerEmail || 'Khách hàng'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-sky-900 space-y-1">
          <p className="font-semibold">Lưu ý sau khi duyệt:</p>
          <p>• Trạng thái yêu cầu sẽ chuyển sang <strong className="font-semibold text-sky-700">Đã duyệt (Approved)</strong>.</p>
          <p>• Khách hàng sẽ thấy thông báo và gửi hàng về kho theo hướng dẫn phản hồi.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="approve-sales-note" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú phản hồi cho khách hàng
            </label>
            <textarea
              id="approve-sales-note"
              value={salesNote}
              onChange={(e) => setSalesNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Nhập hướng dẫn gửi hàng hoặc ghi chú nội bộ..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{salesNote.length}/500</p>
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang duyệt...
                </>
              ) : (
                <>
                  <span>✓</span> Xác nhận duyệt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveReturnModal;
