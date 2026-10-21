import React from 'react';
import {
  ReturnRequestDto,
  RETURN_STATUS_CONFIG,
  REFUND_STATUS_CONFIG,
} from '../../../../types/return';

interface ReturnRequestsPanelProps {
  requests: ReturnRequestDto[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (s?: string | null) => {
  if (!s) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(s));
  } catch {
    return s;
  }
};

/** Các bước của luồng đổi trả theo thứ tự hiển thị */
const STEPS = [
  { key: 'submitted', label: 'Đã gửi yêu cầu', icon: '📨' },
  { key: 'approved', label: 'Sales duyệt', icon: '✓' },
  { key: 'received', label: 'Nhận hàng & nhập kho', icon: '🏭' },
  { key: 'refunded', label: 'Hoàn tiền', icon: '💸' },
] as const;

function getStepIndex(r: ReturnRequestDto): number {
  switch (r.status) {
    case 'Pending':
      return 0;
    case 'Approved':
      return 1;
    case 'Completed':
      return 3;
    default:
      return 0;
  }
}

const ReturnProgress: React.FC<{ request: ReturnRequestDto }> = ({ request }) => {
  if (request.status === 'Rejected' || request.status === 'Cancelled') return null;
  const current = getStepIndex(request);
  return (
    <ol className="flex items-start w-full" aria-label="Tiến trình đổi trả">
      {STEPS.map((step, idx) => {
        const done = idx <= current;
        const isCurrent = idx === current && request.status !== 'Completed';
        return (
          <li key={step.key} className="flex-1 flex flex-col items-center relative">
            {idx > 0 && (
              <span
                className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-0 ${
                  idx <= current ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
                done
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white border-slate-300 text-slate-400'
              } ${isCurrent ? 'ring-4 ring-emerald-500/20 animate-pulse' : ''}`}
            >
              {done ? (idx === current ? step.icon : '✓') : idx + 1}
            </span>
            <span
              className={`mt-1.5 text-[10px] text-center leading-tight px-1 ${
                done ? 'text-slate-800 font-semibold' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export const ReturnRequestsPanel: React.FC<ReturnRequestsPanelProps> = ({
  requests,
  isLoading,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-40" />
        <div className="h-8 bg-slate-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
        <span>⚠️ {error}</span>
        <button type="button" onClick={onRetry} className="font-bold hover:underline">
          Thử lại
        </button>
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const meta = RETURN_STATUS_CONFIG[r.status];
        const refundMeta = REFUND_STATUS_CONFIG[r.refundStatus];
        return (
          <article
            key={r.id}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 overflow-hidden"
          >
            <header className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
                <span className="text-[11px] text-slate-500">Gửi lúc {formatDate(r.createdAt)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold mr-1.5">
                  {r.status === 'Completed' ? 'Đã hoàn' : 'Dự kiến hoàn'}
                </span>
                <span className="text-sm font-black text-orange-600 font-mono">{formatVnd(r.refundAmount)}</span>
              </div>
            </header>

            <div className="p-5 space-y-4">
              <ReturnProgress request={r} />

              <p className="text-xs text-slate-600 italic">{meta.description}</p>

              {r.status === 'Rejected' && r.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>Lý do từ chối:</strong> {r.rejectionReason}
                </div>
              )}

              {r.salesNote && r.status !== 'Rejected' && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                  <strong>Phản hồi từ MadK Store:</strong> {r.salesNote}
                </div>
              )}

              {r.status === 'Completed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Trạng thái hoàn tiền</p>
                    <p className={`mt-0.5 inline-block px-2 py-0.5 rounded-md font-semibold ${refundMeta.color}`}>
                      {refundMeta.label}
                    </p>
                    {r.refundedAt && <p className="text-[11px] text-emerald-800 mt-1">{formatDate(r.refundedAt)}</p>}
                  </div>
                  {r.refundTransactionNo && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Mã giao dịch hoàn</p>
                      <p className="mt-0.5 font-mono font-bold text-slate-800 break-all">{r.refundTransactionNo}</p>
                    </div>
                  )}
                </div>
              )}

              <details className="group">
                <summary className="text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900 list-none flex items-center gap-1">
                  <span className="transition-transform group-open:rotate-90">▸</span>
                  Chi tiết {r.items.length} sản phẩm & lý do
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-700">
                    <strong>Lý do:</strong> {r.reason}
                  </p>
                  {r.customerNote && (
                    <p className="text-xs text-slate-600">
                      <strong>Ghi chú:</strong> {r.customerNote}
                    </p>
                  )}
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                    {r.items.map((it) => (
                      <li key={it.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{it.productName}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {it.variantName} • <span className="font-mono">{it.sku}</span>
                            {it.condition && <> • {it.condition}</>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 font-mono">
                          <p className="text-slate-500">× {it.quantity}</p>
                          <p className="font-bold text-slate-900">{formatVnd(it.totalPrice)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ReturnRequestsPanel;
