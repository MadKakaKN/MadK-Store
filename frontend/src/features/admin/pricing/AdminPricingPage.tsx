import React, { useState, useEffect, useCallback } from 'react';
import { AdminPricingQueryParams, AdminVariantPriceItemDto } from '../../../types/pricing';
import { adminPricingApi } from '../../../api/adminPricingApi';
import { VariantPricingModal } from './VariantPricingModal';

export const AdminPricingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminVariantPriceItemDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [onlyOnSale, setOnlyOnSale] = useState(false);

  // Modal State
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPricingList = useCallback(async () => {
    setLoading(true);
    try {
      const params: AdminPricingQueryParams = {
        page,
        pageSize,
        search: search.trim() || undefined,
        onlyOnSale: onlyOnSale ? true : undefined,
      };

      const res = await adminPricingApi.getVariantPrices(params);
      if (res.isSuccess && res.data) {
        setItems(res.data.items);
        setTotalItems(res.data.totalItems);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      // Handled by handleApiError fallback
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, onlyOnSale]);

  useEffect(() => {
    fetchPricingList();
  }, [fetchPricingList]);

  const handleOpenPricingModal = (variantId: string) => {
    setSelectedVariantId(variantId);
    setIsModalOpen(true);
  };

  const handleClosePricingModal = () => {
    setIsModalOpen(false);
    setSelectedVariantId(null);
  };

  const countOnSale = items.filter((i) => i.isOnSale).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Quản lý Giá & Khuyến mãi theo Thời gian
            </h1>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm">
            Tính toán giá hiện hành tự động cho Storefront, Giỏ hàng, Đơn hàng; kiểm soát chống trùng lặp lịch trình khuyến mãi.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <span className="text-xs text-slate-300 block">Tổng SKU</span>
            <strong className="text-lg font-bold text-white">{totalItems}</strong>
          </div>
          <div className="px-4 py-2 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-center">
            <span className="text-xs text-amber-200 block">Đang Khuyến Mãi</span>
            <strong className="text-lg font-bold text-amber-300">{countOnSale}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo SKU, tên sản phẩm, biến thể..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-medium cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={onlyOnSale}
              onChange={(e) => {
                setOnlyOnSale(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Chỉ xem đang khuyến mãi 🔥</span>
          </label>

          <button
            onClick={() => fetchPricingList()}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5"
          >
            <span>🔄</span> Làm mới
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Biến thể & Sản phẩm</th>
                <th className="px-4 py-3.5">Phân loại</th>
                <th className="px-4 py-3.5 text-right">Giá niêm yết</th>
                <th className="px-4 py-3.5 text-right">Giá hiện hành</th>
                <th className="px-4 py-3.5">Trạng thái Khuyến mãi</th>
                <th className="px-4 py-3.5 text-center">Tồn kho</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách giá biến thể...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Không tìm thấy biến thể sản phẩm nào phù hợp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Variant & Product Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnailUrl || 'https://via.placeholder.com/80'}
                          alt={item.productName}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {item.variantName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.productName}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Brand */}
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{item.categoryName}</div>
                      <div className="text-slate-400">{item.brandName}</div>
                    </td>

                    {/* Original Price */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-slate-600">
                        {item.baseOriginalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    </td>

                    {/* Effective Price */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-indigo-700 text-base">
                        {item.effectivePrice.toLocaleString('vi-VN')}đ
                      </div>
                      {item.isOnSale && (
                        <div className="text-[11px] text-amber-600 font-semibold">
                          Giảm {item.discountPercent}%
                        </div>
                      )}
                    </td>

                    {/* Promotion Status */}
                    <td className="px-4 py-4">
                      {item.isOnSale ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            🔥 {item.activePromotionName || 'Khuyến mãi'}
                          </span>
                          {item.promotionEndDate && (
                            <p className="text-[11px] text-slate-400">
                              Đến: {new Date(item.promotionEndDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Giá bán chuẩn
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`text-xs font-semibold ${
                          item.stockQuantity <= 5 ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {item.stockQuantity}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleOpenPricingModal(item.variantId)}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition-colors shadow-sm"
                      >
                        ⚙️ Cài đặt giá
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị trang <strong>{page}</strong> trên <strong>{totalPages}</strong> (
              {totalItems} biến thể)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 transition"
              >
                ← Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 transition"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cài đặt giá biến thể */}
      <VariantPricingModal
        isOpen={isModalOpen}
        variantId={selectedVariantId}
        onClose={handleClosePricingModal}
        onSuccess={() => fetchPricingList()}
      />
    </div>
  );
};
