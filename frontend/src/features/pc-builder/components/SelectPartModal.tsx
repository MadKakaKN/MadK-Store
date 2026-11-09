import React, { useState, useEffect } from 'react';
import { ComponentSlotConfig, SelectedPart } from '../types';
import { DEFAULT_PARTS_CATALOG } from '../pcBuilderData';
import catalogApi from '../../../api/catalogApi';
import { formatVND } from '../../../utils/format';

interface SelectPartModalProps {
  isOpen: boolean;
  slot: ComponentSlotConfig | null;
  onClose: () => void;
  onSelectPart: (slotId: ComponentSlotConfig['id'], part: SelectedPart) => void;
}

export const SelectPartModal: React.FC<SelectPartModalProps> = ({
  isOpen,
  slot,
  onClose,
  onSelectPart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [parts, setParts] = useState<SelectedPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');

  useEffect(() => {
    if (!isOpen || !slot) return;
    setSearchTerm('');

    const defaultList = DEFAULT_PARTS_CATALOG[slot.id] || [];

    // Attempt to query real catalog API for any matching products
    setLoading(true);
    catalogApi
      .getProducts({
        search: slot.id === 'gear' ? 'gaming' : slot.categorySlug,
        pageSize: 12,
      })
      .then((res: any) => {
        const liveItems = (res.items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.slug.toUpperCase(),
          price: item.basePrice || item.minPrice || 1000000,
          thumbnailUrl: item.thumbnailUrl || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
          categorySlug: slot.categorySlug,
          quantity: 1,
          variantId: undefined,
          specs: {
            warrantyMonths: 36,
            tdpWatt: slot.id === 'cpu' ? 100 : slot.id === 'vga' ? 200 : undefined,
            wattage: slot.id === 'psu' ? 750 : undefined,
          },
        }));

        // Merge default realistic parts with any live backend products
        const combined = [...defaultList];
        for (const live of liveItems) {
          if (!combined.some((c) => c.name.toLowerCase() === live.name.toLowerCase())) {
            combined.push(live);
          }
        }
        setParts(combined);
      })
      .catch(() => {
        setParts(defaultList);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, slot]);

  if (!isOpen || !slot) return null;

  const filteredParts = parts
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      return b.price - a.price;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3.5xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
              {slot.icon}
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Chọn {slot.name}
              </h3>
              <p className="text-xs text-slate-500">Khám phá các mã sản phẩm tương thích chính hãng</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-200/60 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3 bg-white">
          <div className="relative flex-1 w-full">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Tìm kiếm ${slot.name} theo tên, mã SKU, hãng...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Product Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Đang tải danh sách linh kiện...
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Không tìm thấy linh kiện phù hợp với từ khóa "{searchTerm}".
            </div>
          ) : (
            filteredParts.map((part) => (
              <div
                key={part.id}
                className="group p-3.5 sm:p-4 rounded-2.5xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={part.thumbnailUrl}
                    alt={part.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                      {part.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        {part.sku}
                      </span>
                      {part.specs?.socket && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                          Socket {part.specs.socket}
                        </span>
                      )}
                      {part.specs?.ramType && (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                          {part.specs.ramType}
                        </span>
                      )}
                      {part.specs?.tdpWatt && (
                        <span className="text-amber-600">⚡ {part.specs.tdpWatt}W TDP</span>
                      )}
                      {part.specs?.wattage && (
                        <span className="text-emerald-600">🔋 {part.specs.wattage}W Công suất</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black text-blue-700">
                      {formatVND(part.price)}
                    </div>
                    {part.originalPrice && part.originalPrice > part.price && (
                      <div className="text-[11px] text-slate-400 line-through">
                        {formatVND(part.originalPrice)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPart(slot.id, part);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Chọn
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
