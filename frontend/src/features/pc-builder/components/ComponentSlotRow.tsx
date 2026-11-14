import React from 'react';
import { ComponentSlotConfig, SelectedPart } from '../types';
import { formatVND } from '../../../utils/format';

interface ComponentSlotRowProps {
  slot: ComponentSlotConfig;
  selectedPart?: SelectedPart;
  onOpenModal: (slot: ComponentSlotConfig) => void;
  onRemovePart: (slotId: ComponentSlotConfig['id']) => void;
  onUpdateQuantity: (slotId: ComponentSlotConfig['id'], quantity: number) => void;
}

export const ComponentSlotRow: React.FC<ComponentSlotRowProps> = ({
  slot,
  selectedPart,
  onOpenModal,
  onRemovePart,
  onUpdateQuantity,
}) => {
  return (
    <div
      className={`p-3.5 transition-colors border border-[#E5E7EB] rounded-lg ${
        selectedPart ? 'bg-white hover:bg-gray-50/50' : 'bg-gray-50/70 hover:bg-gray-100/70'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Slot Info & Icon */}
        <div className="flex items-center gap-3 sm:w-1/3 min-w-[200px]">
          <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-base flex-shrink-0 border border-gray-200">
            {slot.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{slot.name}</h3>
              {slot.required && (
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  Bắt buộc
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{slot.description}</p>
          </div>
        </div>

        {/* Selected Part Details OR Empty Placeholder */}
        {selectedPart ? (
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedPart.thumbnailUrl}
                alt={selectedPart.name}
                className="w-12 h-12 rounded object-contain bg-gray-50 border border-[#E5E7EB] flex-shrink-0 p-0.5"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-xs line-clamp-1 hover:text-[#1D4ED8] transition-colors">
                  {selectedPart.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                  {selectedPart.sku && (
                    <span className="font-mono text-[10px] text-gray-400">SKU: {selectedPart.sku}</span>
                  )}
                  {selectedPart.specs?.warrantyMonths && (
                    <span className="text-gray-500">• BH {selectedPart.specs.warrantyMonths}T</span>
                  )}
                  {selectedPart.specs?.tdpWatt && (
                    <span className="text-amber-600">• {selectedPart.specs.tdpWatt}W TDP</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Quantity & Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
              {/* Quantity stepper */}
              <div className="flex items-center border border-[#E5E7EB] rounded bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(slot.id, Math.max(1, selectedPart.quantity - 1))}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                  title="Giảm số lượng"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-gray-900">
                  {selectedPart.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(slot.id, selectedPart.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                  title="Tăng số lượng"
                >
                  +
                </button>
              </div>

              {/* Price */}
              <div className="text-right min-w-[95px]">
                <div className="text-sm font-bold text-[#D70018]">
                  {formatVND(selectedPart.price * selectedPart.quantity)}
                </div>
                {selectedPart.quantity > 1 && (
                  <div className="text-[10px] text-gray-400">
                    {formatVND(selectedPart.price)}/cái
                  </div>
                )}
              </div>

              {/* Replace / Remove button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenModal(slot)}
                  className="h-7 px-2.5 bg-white border border-[#1D4ED8] text-[#1D4ED8] hover:bg-blue-50 text-[11px] font-semibold rounded transition-colors"
                  title="Đổi linh kiện khác"
                >
                  Thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => onRemovePart(slot.id)}
                  className="h-7 w-7 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 rounded flex items-center justify-center transition-colors"
                  title="Xóa linh kiện này"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between py-1">
            <span className="text-xs text-gray-400 italic">Chưa chọn linh kiện cho mục này</span>
            <button
              type="button"
              onClick={() => onOpenModal(slot)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Chọn linh kiện</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
