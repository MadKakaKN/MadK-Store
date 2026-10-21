import React, { useState } from 'react';
import { VariantInventoryItemDto } from '../../../types/inventory';
import { adminInventoryApi } from '../../../api/adminInventoryApi';
import { FormField, AdminInput, AdminSelect } from '../components/common/AdminForm';
import { useToast } from '../components/common/ToastContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  variant: VariantInventoryItemDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'Hàng lỗi / hỏng hóc trong kho',
  'Mất mát / thất thoát khi kiểm kê',
  'Thừa hàng thực tế so với sổ sách',
  'Xuất làm hàng mẫu / quà tặng reviewer',
  'Hoàn trả nhà cung cấp do lỗi sản xuất',
  'Khác (nhập chi tiết bên dưới)',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  variant,
  onClose,
  onSuccess,
}) => {
  const [direction, setDirection] = useState<'increase' | 'decrease'>('decrease');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen || !variant) return null;

  const qtyChange = direction === 'increase' ? Math.abs(quantity) : -Math.abs(quantity);
  const isOverAvailable = direction === 'decrease' && Math.abs(quantity) > variant.availableQuantity;
  const newOnHand = variant.onHandQuantity + qtyChange;
  const newAvailable = Math.max(0, newOnHand - variant.reservedQuantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      toast.warning('Số lượng điều chỉnh phải lớn hơn 0.', 'Cảnh báo');
      return;
    }

    if (direction === 'decrease' && Math.abs(quantity) > variant.availableQuantity) {
      toast.error(
        `Số lượng điều chỉnh giảm (${quantity}) vượt quá tồn khả dụng (${variant.availableQuantity}). Vui lòng kiểm tra lại!`,
        'Vi phạm tồn khả dụng'
      );
      return;
    }

    const finalReason = selectedReason === 'Khác (nhập chi tiết bên dưới)'
      ? customReason.trim()
      : selectedReason + (customReason.trim() ? ` - ${customReason.trim()}` : '');

    if (!finalReason) {
      toast.warning('Vui lòng cung cấp lý do điều chỉnh tồn kho.', 'Thiếu thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminInventoryApi.adjustStock({
        variantId: variant.variantId,
        quantityChange: qtyChange,
        reason: finalReason,
        referenceType: 'StockAdjustment',
      });

      if (res.isSuccess) {
        toast.success(
          `Đã điều chỉnh ${qtyChange > 0 ? '+' : ''}${qtyChange} sản phẩm cho SKU: ${variant.sku}`,
          'Điều chỉnh thành công'
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || 'Điều chỉnh tồn kho thất bại.', 'Lỗi');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi gửi yêu cầu điều chỉnh.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Điều chỉnh tồn kho</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật số lượng vật lý kèm lý do giải trình kiểm toán
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

        {/* Product Context Banner */}
        <div className="px-6 py-3 bg-brand-50/40 border-b border-brand-100/60 flex items-center gap-3">
          {variant.thumbnailUrl && (
            <img
              src={variant.thumbnailUrl}
              alt={variant.variantName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">{variant.productName}</h4>
            <p className="text-xs text-slate-600 truncate">{variant.variantName}</p>
            <span className="font-mono text-[11px] font-semibold text-brand-700 bg-brand-100/80 px-1.5 py-0.5 rounded">
              SKU: {variant.sku}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Stock Metrics summary */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Tồn thực (OnHand)</span>
              <p className="text-base font-bold text-slate-900">{variant.onHandQuantity}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-600 uppercase">Đang giữ (Reserved)</span>
              <p className="text-base font-bold text-amber-600">{variant.reservedQuantity}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase">Khả dụng (Available)</span>
              <p className="text-base font-bold text-emerald-600">{variant.availableQuantity}</p>
            </div>
          </div>

          {/* Direction toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại điều chỉnh</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('decrease')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all border ${
                  direction === 'decrease'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔻 Giảm số lượng (Xuất hủy / Mất)
              </button>
              <button
                type="button"
                onClick={() => setDirection('increase')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all border ${
                  direction === 'increase'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔺 Tăng số lượng (Thừa khi kiểm)
              </button>
            </div>
          </div>

          {/* Quantity */}
          <FormField
            label="Số lượng điều chỉnh"
            required
            error={
              isOverAvailable
                ? `Vượt quá tồn khả dụng (${variant.availableQuantity}). Hệ thống bảo vệ không cho phép tồn khả dụng âm.`
                : undefined
            }
          >
            <AdminInput
              type="number"
              min={1}
              max={direction === 'decrease' ? variant.availableQuantity : undefined}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className={isOverAvailable ? 'border-rose-400 focus:ring-rose-400' : ''}
            />
          </FormField>

          {/* Projection Preview */}
          <div className="p-3 rounded-xl bg-slate-100/70 text-xs flex items-center justify-between">
            <span className="text-slate-600">Dự kiến sau điều chỉnh:</span>
            <div className="space-x-3">
              <span>
                OnHand: <strong className={direction === 'decrease' ? 'text-rose-600' : 'text-emerald-600'}>{newOnHand}</strong>
              </span>
              <span>
                Available: <strong className={isOverAvailable ? 'text-rose-600 font-extrabold' : 'text-slate-900'}>{newAvailable}</strong>
              </span>
            </div>
          </div>

          {/* Reason selection */}
          <FormField label="Lý do điều chỉnh" required>
            <AdminSelect
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </AdminSelect>
          </FormField>

          <FormField label="Ghi chú chi tiết / Mã biên bản">
            <AdminInput
              type="text"
              placeholder="Nhập chi tiết biên bản kiểm kê hoặc lý do cụ thể..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </FormField>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverAvailable || quantity <= 0}
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-md ${
                isOverAvailable || quantity <= 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : direction === 'decrease'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận điều chỉnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
