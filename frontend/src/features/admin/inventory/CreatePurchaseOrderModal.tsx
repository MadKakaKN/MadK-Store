import React, { useState, useEffect } from 'react';
import { SupplierDto, VariantInventoryItemDto, CreatePurchaseOrderItemDto } from '../../../types/inventory';
import { adminInventoryApi } from '../../../api/adminInventoryApi';
import { FormField, AdminInput, AdminSelect } from '../components/common/AdminForm';
import { useToast } from '../components/common/ToastContext';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  variants: VariantInventoryItemDto[];
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItemRow {
  variantId: string;
  quantity: number;
  unitCost: number;
  notes: string;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  variants,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      const initialCode = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setCode(initialCode);
      setNotes('Nhập hàng định kỳ từ nhà phân phối');
      if (variants.length > 0) {
        setItems([
          {
            variantId: variants[0].variantId,
            quantity: 10,
            unitCost: variants[0].costPrice || 1000000,
            notes: '',
          },
        ]);
      }
    }
  }, [isOpen, variants]);

  const loadSuppliers = async () => {
    try {
      const res = await adminInventoryApi.getSuppliers();
      if (res.isSuccess && res.data) {
        setSuppliers(res.data);
        if (res.data.length > 0 && !selectedSupplierId) {
          setSelectedSupplierId(res.data[0].id);
        }
      }
    } catch {
      // Mock fallback will handle it
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (variants.length === 0) return;
    const defaultVar = variants[0];
    setItems((prev) => [
      ...prev,
      {
        variantId: defaultVar.variantId,
        quantity: 10,
        unitCost: defaultVar.costPrice || 1000000,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemRow, value: unknown) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'variantId') {
          const v = variants.find((x) => x.variantId === value);
          if (v && v.costPrice) {
            updated.unitCost = v.costPrice;
          }
        }
        return updated;
      })
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleSubmit = async (receiveImmediately = false) => {
    if (!selectedSupplierId) {
      toast.warning('Vui lòng chọn nhà cung cấp.', 'Cảnh báo');
      return;
    }

    if (items.length === 0) {
      toast.warning('Vui lòng thêm ít nhất 1 sản phẩm nhập.', 'Cảnh báo');
      return;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        toast.warning('Số lượng nhập của mọi sản phẩm phải lớn hơn 0.', 'Cảnh báo');
        return;
      }
      if (item.unitCost < 0) {
        toast.warning('Giá vốn không được âm.', 'Cảnh báo');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payloadItems: CreatePurchaseOrderItemDto[] = items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        unitCost: i.unitCost,
        notes: i.notes || undefined,
      }));

      const res = await adminInventoryApi.createPurchaseOrder({
        supplierId: selectedSupplierId,
        code: code.trim(),
        notes: notes.trim(),
        items: payloadItems,
      });

      if (!res.isSuccess || !res.data) {
        toast.error(res.error || 'Tạo phiếu nhập hàng thất bại.', 'Lỗi');
        return;
      }

      const createdPo = res.data;

      if (receiveImmediately) {
        // Nhận hàng ngay lập tức
        const receiveRes = await adminInventoryApi.receivePurchaseOrder(createdPo.id);
        if (receiveRes.isSuccess) {
          toast.success(
            `Đã nhập kho ${items.length} mặt hàng từ phiếu ${code}! Tồn kho và giá vốn đã được cập nhật.`,
            'Nhập kho thành công'
          );
        } else {
          toast.error(receiveRes.error || 'Lỗi khi nhận hàng vào kho.', 'Cảnh báo');
        }
      } else {
        toast.success(`Đã tạo phiếu nhập ${code} dạng bản nháp.`, 'Thành công');
      }

      onSuccess();
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra khi tạo phiếu nhập hàng.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tạo phiếu nhập hàng (Purchasing)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận nhà cung cấp, thiết lập giá vốn (Cost Price) và tăng tồn kho
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Supplier & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nhà cung cấp" required>
              <AdminSelect
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </AdminSelect>
            </FormField>

            <FormField label="Mã phiếu nhập" required>
              <AdminInput
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PO-YYYYMMDD-XXXX"
              />
            </FormField>
          </div>

          <FormField label="Ghi chú đợt nhập hàng">
            <AdminInput
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Hàng mới về cảng Hải Phòng, nguyên seal..."
            />
          </FormField>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh sách sản phẩm nhập ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg transition-colors"
              >
                + Thêm sản phẩm
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.unitCost;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 relative group"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Biến thể / SKU</label>
                        <AdminSelect
                          value={item.variantId}
                          onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                        >
                          {variants.map((v) => (
                            <option key={v.variantId} value={v.variantId}>
                              {v.productName} - {v.variantName} ({v.sku})
                            </option>
                          ))}
                        </AdminSelect>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Số lượng</label>
                        <AdminInput
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Giá vốn nhập (VNĐ)
                        </label>
                        <AdminInput
                          type="number"
                          min={0}
                          step={1000}
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Thành tiền</label>
                        <p className="text-xs font-bold text-slate-900 mt-2">
                          {lineTotal.toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <input
                        type="text"
                        placeholder="Ghi chú cho món hàng này (tùy chọn)..."
                        value={item.notes}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        className="text-xs border-0 bg-transparent text-slate-600 focus:ring-0 p-0 flex-1 placeholder:text-slate-400"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 ml-2"
                        >
                          Xóa dòng
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total summary */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Tổng giá trị đơn nhập hàng:</span>
            <span className="text-lg font-black text-amber-400">
              {totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all"
          >
            {isSubmitting ? 'Đang xử lý...' : '✓ Nhập kho ngay (Tăng tồn)'}
          </button>
        </div>
      </div>
    </div>
  );
};
