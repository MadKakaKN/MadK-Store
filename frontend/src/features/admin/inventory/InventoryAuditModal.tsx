import React, { useState, useEffect } from 'react';
import { VariantInventoryItemDto, CompleteInventoryAuditItemDto } from '../../../types/inventory';
import { adminInventoryApi } from '../../../api/adminInventoryApi';
import { FormField, AdminInput } from '../components/common/AdminForm';
import { useToast } from '../components/common/ToastContext';

interface InventoryAuditModalProps {
  isOpen: boolean;
  variants: VariantInventoryItemDto[];
  onClose: () => void;
  onSuccess: () => void;
}

interface AuditRow {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  systemQuantity: number;
  actualQuantity: number;
  reason: string;
}

export const InventoryAuditModal: React.FC<InventoryAuditModalProps> = ({
  isOpen,
  variants,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const generatedCode = `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setCode(generatedCode);
      setNotes('Kiểm kê kho định kỳ');
      setRows(
        variants.map((v) => ({
          variantId: v.variantId,
          sku: v.sku,
          productName: v.productName,
          variantName: v.variantName,
          systemQuantity: v.onHandQuantity,
          actualQuantity: v.onHandQuantity,
          reason: '',
        }))
      );
    }
  }, [isOpen, variants]);

  if (!isOpen) return null;

  const handleActualChange = (idx: number, val: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, actualQuantity: Math.max(0, val) } : r))
    );
  };

  const handleReasonChange = (idx: number, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, reason: val } : r)));
  };

  const totalDiscrepancies = rows.filter((r) => r.actualQuantity !== r.systemQuantity).length;

  const handleCompleteAudit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Tạo phiếu kiểm kê
      const createRes = await adminInventoryApi.createAudit({
        code: code.trim(),
        notes: notes.trim(),
        items: rows.map((r) => ({
          variantId: r.variantId,
          actualQuantity: r.actualQuantity,
          reason: r.reason || undefined,
        })),
      });

      if (!createRes.isSuccess || !createRes.data) {
        toast.error(createRes.error || 'Tạo phiếu kiểm kê thất bại.', 'Lỗi');
        return;
      }

      const auditId = createRes.data.id;

      // 2. Chốt kiểm kê & tự động cân bằng tồn kho
      const completePayload: CompleteInventoryAuditItemDto[] = rows.map((r) => ({
        variantId: r.variantId,
        actualQuantity: r.actualQuantity,
        reason: r.reason || undefined,
      }));

      const completeRes = await adminInventoryApi.completeAudit(auditId, {
        items: completePayload,
      });

      if (completeRes.isSuccess) {
        toast.success(
          `Đã hoàn tất đợt kiểm kê ${code}! Tồn kho của ${totalDiscrepancies} sản phẩm chênh lệch đã được tự động cân bằng.`,
          'Cân bằng kho thành công'
        );
        onSuccess();
        onClose();
      } else {
        toast.error(completeRes.error || 'Cân bằng kho thất bại.', 'Lỗi');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi thực hiện kiểm kê kho.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kiểm kê kho & Cân bằng tồn (Stock Audit)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So khớp số đếm thực tế với số liệu hệ thống và tự động tạo bút toán điều chỉnh
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Mã phiếu kiểm kê" required>
              <AdminInput
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="AUD-YYYYMMDD-XXXX"
              />
            </FormField>

            <FormField label="Mục đích / Ghi chú đợt kiểm kê">
              <AdminInput
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Kiểm kê quý 4, kiểm kho đột xuất..."
              />
            </FormField>
          </div>

          {/* Discrepancy Alert Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Tổng số mặt hàng kiểm đếm: <strong className="text-slate-900">{rows.length}</strong>
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                totalDiscrepancies > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {totalDiscrepancies > 0
                ? `⚠️ Có ${totalDiscrepancies} mặt hàng bị chênh lệch số lượng`
                : '✓ Toàn bộ khớp số liệu hệ thống'}
            </span>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Sản phẩm & SKU</th>
                  <th className="py-2.5 px-3 text-center">Tồn hệ thống</th>
                  <th className="py-2.5 px-3 text-center w-28">Đếm thực tế</th>
                  <th className="py-2.5 px-3 text-center">Lệch</th>
                  <th className="py-2.5 px-3">Lý do giải trình nếu lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const diff = row.actualQuantity - row.systemQuantity;
                  return (
                    <tr
                      key={row.variantId}
                      className={diff !== 0 ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/60'}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{row.productName}</div>
                        <div className="text-slate-500 text-[11px]">{row.variantName}</div>
                        <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600">
                          {row.sku}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {row.systemQuantity}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={row.actualQuantity}
                          onChange={(e) => handleActualChange(idx, parseInt(e.target.value) || 0)}
                          className="w-20 text-center font-bold text-xs py-1 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {diff === 0 ? (
                          <span className="text-[11px] font-semibold text-slate-400">0 (Khớp)</span>
                        ) : diff > 0 ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            +{diff} (Thừa)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            {diff} (Thiếu)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder={diff !== 0 ? 'Nhập nguyên nhân thừa/thiếu...' : 'Ghi chú (nếu có)...'}
                          value={row.reason}
                          onChange={(e) => handleReasonChange(idx, e.target.value)}
                          className={`w-full text-xs py-1 px-2 rounded-lg border ${
                            diff !== 0 && !row.reason
                              ? 'border-amber-300 bg-amber-50/50'
                              : 'border-slate-200'
                          } focus:ring-1 focus:ring-brand-500`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Khi bấm xác nhận, hệ thống sẽ tự động sinh các bút toán điều chỉnh tồn kho để cân bằng số liệu.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleCompleteAudit}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all"
            >
              {isSubmitting ? 'Đang cân bằng kho...' : '✓ Chốt kiểm kê & Cân bằng kho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
