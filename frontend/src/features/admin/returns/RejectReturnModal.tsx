import React, { useState } from 'react';
import { ReturnRequestDto } from '../../../types/return';
import adminReturnApi from '../../../api/adminReturnApi';
import { useToast } from '../components/common/ToastContext';

interface RejectReturnModalProps {
  returnRequest: ReturnRequestDto | null;
  isOpen: boolean;
  onClose: () => void;
  onRejected: (updated: ReturnRequestDto) => void;
}

const REJECT_REASON_PRESETS = [
  'Sản phẩm đã quá hạn quy định đổi trả (7 ngày kể từ khi nhận hàng)',
  'Lỗi phát sinh do tác động vật lý của người dùng (rơi vỡ, vô nước, can thiệp mạch PCB)',
  'Sản phẩm không thuộc đơn hàng hoặc không khớp với số serial/SKU đã xuất kho',
  'Khách hàng không cung cấp đủ bằng chứng xác thực hư hại của sản phẩm',
  'Sản phẩm quà tặng hoặc thuộc chương trình thanh lý không áp dụng đổi trả',
];

export const RejectReturnModal: React.FC<RejectReturnModalProps> = ({
  returnRequest,
  isOpen,
  onClose,
  onRejected,
}) => {
  const toast = useToast();
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !returnRequest) return null;

  const isValid = rejectionReason.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const updated = await adminReturnApi.rejectReturnRequest(returnRequest.id, {
        rejectionReason: rejectionReason.trim(),
      });
      toast.success(
        `Đã từ chối yêu cầu đổi trả cho đơn #${returnRequest.orderNumber}. Đơn hàng đã hoàn về trạng thái Giao thành công (Completed).`,
        'Từ chối thành công'
      );
      onRejected(updated);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Từ chối yêu cầu đổi trả thất bại.',
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
        aria-labelledby="reject-modal-title"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xl shrink-0">
            ✕
          </div>
          <div>
            <h3 id="reject-modal-title" className="text-base font-bold text-slate-900">
              Từ chối yêu cầu đổi trả
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đơn hàng: <strong className="font-mono text-slate-800">#{returnRequest.orderNumber}</strong> • Khách: {returnRequest.customerName || returnRequest.customerEmail || 'Khách hàng'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> Chú ý về quy trình hệ thống:
          </p>
          <p>• Yêu cầu đổi trả sẽ chuyển thành <strong className="text-rose-700">Bị từ chối (Rejected)</strong>.</p>
          <p>• Trạng thái đơn hàng sẽ được khôi phục về <strong className="text-emerald-700">Giao thành công (Completed)</strong>.</p>
          <p>• Khách hàng sẽ thấy lý do từ chối này trong giao diện tra cứu đơn hàng.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Lý do mẫu thường dùng:
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {REJECT_REASON_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className={`w-full text-left p-2 rounded-xl text-[11px] border transition-all ${
                    rejectionReason === preset
                      ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  • {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reject-reason" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lý do từ chối cụ thể <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Nhập lý do chi tiết (tối thiểu 5 ký tự)..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-2xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none resize-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{isValid ? '✓ Lý do hợp lệ' : 'Tối thiểu 5 ký tự'}</span>
              <span>{rejectionReason.length}/500</span>
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
              disabled={!isValid || isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span>✕</span> Xác nhận từ chối
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectReturnModal;
