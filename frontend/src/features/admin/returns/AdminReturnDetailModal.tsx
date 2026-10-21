import React from 'react';
import {
  ReturnRequestDto,
  RETURN_STATUS_CONFIG,
  REFUND_STATUS_CONFIG,
} from '../../../types/return';

interface AdminReturnDetailModalProps {
  returnRequest: ReturnRequestDto | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenApprove: (request: ReturnRequestDto) => void;
  onOpenReject: (request: ReturnRequestDto) => void;
  onOpenComplete: (request: ReturnRequestDto) => void;
  canManage: boolean;
  canRefund: boolean;
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

export const AdminReturnDetailModal: React.FC<AdminReturnDetailModalProps> = ({
  returnRequest,
  isOpen,
  onClose,
  onOpenApprove,
  onOpenReject,
  onOpenComplete,
  canManage,
  canRefund,
}) => {
  if (!isOpen || !returnRequest) return null;

  const statusMeta = RETURN_STATUS_CONFIG[returnRequest.status] || {
    label: returnRequest.status,
    icon: '📦',
    color: 'text-slate-600 bg-slate-100',
  };

  const refundMeta = REFUND_STATUS_CONFIG[returnRequest.refundStatus] || {
    label: returnRequest.refundStatus,
    color: 'text-slate-600 bg-slate-100',
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col relative animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-detail-title"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 id="return-detail-title" className="text-xl font-black text-slate-900 font-mono tracking-tight">
                Đổi trả #{returnRequest.orderNumber}
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.color}`}>
                {statusMeta.icon} {statusMeta.label}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${refundMeta.color}`}>
                {refundMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Mã yêu cầu:</span>
              <strong className="text-slate-700 font-mono">{returnRequest.id}</strong>
              <span>• Gửi lúc:</span>
              <strong className="text-slate-700 font-mono">{formatDate(returnRequest.createdAt)}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-6 py-6 text-xs">
          {/* Action Toolbar for Sales/Admin */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-brand-50/30 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Thao tác xử lý yêu cầu:</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {returnRequest.status === 'Pending' && 'Yêu cầu đang chờ Sales thẩm định & duyệt thông tin.'}
                {returnRequest.status === 'Approved' && 'Yêu cầu đã duyệt. Đang chờ hàng về kho để nhập kho & hoàn tiền.'}
                {returnRequest.status === 'Completed' && 'Yêu cầu đã hoàn tất nhập kho và hoàn tiền.'}
                {returnRequest.status === 'Rejected' && 'Yêu cầu đã bị từ chối.'}
                {returnRequest.status === 'Cancelled' && 'Khách hàng đã tự hủy yêu cầu.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {returnRequest.status === 'Pending' && canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenApprove(returnRequest)}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>✓</span> Duyệt yêu cầu
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenReject(returnRequest)}
                    className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                  >
                    <span>✕</span> Từ chối
                  </button>
                </>
              )}

              {returnRequest.status === 'Approved' && canRefund && (
                <button
                  type="button"
                  onClick={() => onOpenComplete(returnRequest)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
                >
                  <span>💸</span> Nhận hàng & Hoàn tiền
                </button>
              )}
            </div>
          </div>

          {/* Customer & Reason Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>👤</span>
                <span>Thông tin khách hàng</span>
              </h3>
              <div className="space-y-1.5 text-slate-700">
                <p>
                  <span className="text-slate-500">Tên:</span>{' '}
                  <strong className="text-slate-900">{returnRequest.customerName || 'Chưa cập nhật'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-mono text-slate-800">{returnRequest.customerEmail || '—'}</span>
                </p>
                <p>
                  <span className="text-slate-500">Điện thoại:</span>{' '}
                  <span className="font-mono text-slate-800">{returnRequest.customerPhone || '—'}</span>
                </p>
                {returnRequest.customerNote && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Ghi chú của khách:</span>
                    <p className="text-slate-800 italic mt-0.5">&ldquo;{returnRequest.customerNote}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>

            {/* Return Reason & Notes */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📝</span>
                  <span>Lý do đổi trả & Phản hồi</span>
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 font-medium">Lý do từ khách hàng:</span>
                    <p className="font-bold text-slate-900 mt-0.5 p-2.5 rounded-xl bg-white border border-slate-200">
                      {returnRequest.reason}
                    </p>
                  </div>
                  {returnRequest.rejectionReason && (
                    <div>
                      <span className="text-rose-600 font-bold">Lý do từ chối:</span>
                      <p className="font-medium text-rose-800 mt-0.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                        {returnRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                  {returnRequest.salesNote && (
                    <div>
                      <span className="text-sky-700 font-bold">Ghi chú của Sales:</span>
                      <p className="text-sky-900 mt-0.5 p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                        {returnRequest.salesNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3">
                <span className="text-slate-500">Số tiền hoàn:</span>
                <span className="text-base font-black text-brand-600 font-mono">
                  {formatVnd(returnRequest.refundAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Items to return */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📦</span>
              <span>Danh sách sản phẩm đổi trả ({returnRequest.items.length} món)</span>
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {returnRequest.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Phân loại: <strong className="text-slate-700">{item.variantName || 'Mặc định'}</strong> • SKU:{' '}
                      <span className="font-mono text-slate-600">{item.sku}</span>
                    </p>
                    {item.condition && (
                      <p className="text-[10px] text-amber-700 font-medium mt-1">
                        Tình trạng: <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">{item.condition}</span>
                      </p>
                    )}
                    {item.reason && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5">
                        Ghi chú món: &ldquo;{item.reason}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-slate-500">{formatVnd(item.unitPrice)}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Số lượng: <strong className="font-bold text-slate-900 font-mono">{item.quantity}</strong>
                    </p>
                    <p className="font-black text-slate-900 font-mono mt-1">
                      {formatVnd(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit / Timeline Details */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📜</span>
              <span>Nhật ký xử lý hệ thống (Audit Trail)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Người xử lý:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{returnRequest.processedByName || 'Chưa xử lý'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Thời gian xử lý:</span>
                <p className="font-mono text-slate-800 mt-0.5">{formatDate(returnRequest.processedAt)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Tồn kho đã nhập lại:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {returnRequest.isRestocked ? (
                    <span className="text-emerald-700 font-bold">✓ Đã nhập kho ({formatDate(returnRequest.restockedAt)})</span>
                  ) : (
                    <span className="text-slate-400">Chưa nhập kho</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Mã GD hoàn tiền:</span>
                <p className="font-mono text-slate-800 mt-0.5 truncate" title={returnRequest.refundTransactionNo || '—'}>
                  {returnRequest.refundTransactionNo || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReturnDetailModal;
