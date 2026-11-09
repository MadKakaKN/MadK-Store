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
      className={`rounded-2.5xl p-4 sm:p-5 transition-all duration-200 border ${
        selectedPart
          ? 'bg-white border-blue-200/80 shadow-xs hover:border-blue-400'
          : 'bg-slate-50/70 border-slate-200/70 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Slot Info & Icon */}
        <div className="flex items-start gap-3.5 sm:w-1/3 min-w-[220px]">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50 text-slate-700 flex items-center justify-center text-lg flex-shrink-0 border border-slate-200/60 shadow-xs">
            {slot.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">{slot.name}</h3>
              {slot.required && (
                <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Bắt buộc
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{slot.description}</p>
          </div>
        </div>

        {/* Selected Part Details OR Empty Placeholder */}
        {selectedPart ? (
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 p-3 sm:px-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={selectedPart.thumbnailUrl}
                alt={selectedPart.name}
                className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-blue-600 transition-colors">
                  {selectedPart.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                  <span className="bg-slate-200/60 px-2 py-0.5 rounded-md font-mono text-[10px]">
                    SKU: {selectedPart.sku}
                  </span>
                  {selectedPart.specs?.warrantyMonths && (
                    <span className="text-emerald-600">
                      🛡️ BH {selectedPart.specs.warrantyMonths}T
                    </span>
                  )}
                  {selectedPart.specs?.tdpWatt && (
                    <span className="text-amber-600">
                      ⚡ {selectedPart.specs.tdpWatt}W TDP
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Quantity & Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-3.5 sm:gap-5 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
              {/* Quantity stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(slot.id, Math.max(1, selectedPart.quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  title="Giảm số lượng"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900">
                  {selectedPart.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(slot.id, selectedPart.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  title="Tăng số lượng"
                >
                  +
                </button>
              </div>

              {/* Price */}
              <div className="text-right min-w-[110px]">
                <div className="text-sm font-black text-blue-700">
                  {formatVND(selectedPart.price * selectedPart.quantity)}
                </div>
                {selectedPart.quantity > 1 && (
                  <div className="text-[10px] text-slate-400 font-medium">
                    {formatVND(selectedPart.price)} / cái
                  </div>
                )}
              </div>

              {/* Replace / Remove button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenModal(slot)}
                  className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Đổi linh kiện khác"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onRemovePart(slot.id)}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Xóa linh kiện này"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between py-2">
            <span className="text-xs text-slate-400 italic">Chưa chọn linh kiện cho mục này</span>
            <button
              type="button"
              onClick={() => onOpenModal(slot)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:scale-102 active:scale-98 transition-all"
            >
              <span>+</span>
              <span>Chọn linh kiện</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
