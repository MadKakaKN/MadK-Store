import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../../../context/CompareContext';
import { useCart } from '../../cart/context/CartContext';
import catalogApi from '../../../api/catalogApi';
import { ProductDetailDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';

interface ParsedSpecs {
  [categoryOrKey: string]: any;
}

export const ComparePage: React.FC = () => {
  const { items, removeFromCompare, clearCompare, maxItems } = useCompare();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [details, setDetails] = useState<{ [slug: string]: ProductDetailDto }>({});
  const [loading, setLoading] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  // Tải chi tiết thông số kỹ thuật cho từng sản phẩm trong danh sách
  useEffect(() => {
    let isMounted = true;
    const fetchAllDetails = async () => {
      if (items.length === 0) return;
      setLoading(true);
      try {
        const results = await Promise.all(
          items.map(async (item) => {
            if (details[item.slug]) return { slug: item.slug, data: details[item.slug] };
            const res = await catalogApi.getProductBySlug(item.slug);
            return { slug: item.slug, data: res };
          })
        );
        if (isMounted) {
          const newMap: { [slug: string]: ProductDetailDto } = {};
          results.forEach((r) => {
            if (r.data) newMap[r.slug] = r.data;
          });
          setDetails((prev) => ({ ...prev, ...newMap }));
        }
      } catch (err) {
        console.error('Lỗi khi tải thông số sản phẩm so sánh:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllDetails();
    return () => {
      isMounted = false;
    };
  }, [items]);

  // Trích xuất danh sách tất cả các key thông số kỹ thuật có trong các sản phẩm
  const allSpecKeys = React.useMemo(() => {
    const keysSet = new Set<string>();
    items.forEach((item) => {
      const detail = details[item.slug];
      if (detail?.specifications) {
        try {
          const parsed: ParsedSpecs =
            typeof detail.specifications === 'string'
              ? JSON.parse(detail.specifications)
              : detail.specifications;

          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach((k) => keysSet.add(k));
          }
        } catch {
          // Bỏ qua lỗi parse JSON thông số
        }
      }
    });

    // Nếu không có spec dạng JSON, tạo các spec mặc định dựa trên đặc tính công nghệ phổ biến
    const defaultKeys = [
      'CPU / Vi xử lý',
      'RAM',
      'Ổ cứng / Bộ nhớ',
      'Màn hình',
      'Card đồ họa (VGA)',
      'Pin & Sạc',
      'Trọng lượng',
      'Hệ điều hành',
      'Bảo hành',
    ];

    return keysSet.size > 0 ? Array.from(keysSet) : defaultKeys;
  }, [items, details]);

  // Lấy giá trị thông số cho 1 sản phẩm
  const getSpecValue = (detail: ProductDetailDto | undefined, key: string): string => {
    if (!detail) return '—';
    if (!detail.specifications) return '—';

    try {
      const parsed: ParsedSpecs =
        typeof detail.specifications === 'string'
          ? JSON.parse(detail.specifications)
          : detail.specifications;

      if (parsed && typeof parsed === 'object') {
        const val = parsed[key];
        if (val !== undefined && val !== null) {
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        }
      }
    } catch {
      // ignore
    }

    // Fallback thử tìm theo case-insensitive
    try {
      const parsed = JSON.parse(detail.specifications);
      const matchedKey = Object.keys(parsed).find(
        (k) => k.toLowerCase() === key.toLowerCase()
      );
      if (matchedKey) return String(parsed[matchedKey]);
    } catch {
      // ignore
    }

    return '—';
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async (item: ProductDetailDto) => {
    const defaultVariant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
    if (!defaultVariant) return;

    await addToCart(defaultVariant.id, 1, defaultVariant.salePrice || defaultVariant.originalPrice);
    setAddedSlug(item.slug);
    setTimeout(() => setAddedSlug(null), 2500);
  };

  // Trang trống khi chưa chọn sản phẩm nào
  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-xl">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
          Chưa có sản phẩm nào để so sánh
        </h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
          Hãy khám phá danh mục công nghệ của MadK Store và bấm vào biểu tượng so sánh ở các sản phẩm bạn quan tâm để đặt lên bàn cân đối chiếu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/categories"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            Khám phá danh mục sản phẩm
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 px-4 md:px-6 max-w-[1240px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-[#1D4ED8] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span>
          <span>Trang chủ</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-[#111827] font-semibold">So sánh sản phẩm</span>
      </nav>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">
              So Sánh Chi Tiết Sản Phẩm
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#1D4ED8]">
              {items.length} / {maxItems} sản phẩm
            </span>
          </div>
          <p className="text-gray-500 text-xs">
            Đối chiếu chi tiết cấu hình, giá bán, hiệu năng để chọn sản phẩm phù hợp nhất với nhu cầu của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle "Chỉ hiện điểm khác biệt" */}
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 bg-white rounded-lg border border-[#E5E7EB] hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={diffOnly}
              onChange={(e) => setDiffOnly(e.target.checked)}
              className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-0 border-gray-300"
            />
            <span>Chỉ xem điểm khác biệt</span>
          </label>

          {/* Nút xóa hết */}
          <button
            type="button"
            onClick={clearCompare}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Xóa danh sách</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-3 text-xs font-medium text-gray-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông số kỹ thuật chi tiết...</span>
        </div>
      )}

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          {/* Product Header Row (Cards) */}
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="p-4 w-44 min-w-[160px] font-semibold text-gray-500 uppercase tracking-wider text-[11px] align-top border-r border-[#E5E7EB]">
                Thông số / Tính năng
              </th>
              {items.map((item) => {
                const detail = details[item.slug];
                const isOutOfStock = detail?.variants && detail.variants.length > 0
                  ? detail.variants.every((v) => (v.stockQuantity || 0) <= 0)
                  : false;

                return (
                  <th
                    key={item.id}
                    className="p-4 min-w-[220px] max-w-[260px] align-top border-r border-[#E5E7EB] last:border-r-0 relative group"
                  >
                    {/* Nút xóa khỏi so sánh */}
                    <button
                      type="button"
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 flex items-center justify-center text-xs transition-colors"
                      title="Xóa sản phẩm này"
                    >
                      ✕
                    </button>

                    {/* Image */}
                    <Link
                      to={`/products/${item.slug}`}
                      className="block aspect-square w-28 h-28 mx-auto mb-3 bg-white border border-[#E5E7EB] rounded-lg p-1.5 overflow-hidden hover:scale-105 transition-transform"
                    >
                      <img
                        src={item.thumbnailUrl || `/images/products/${item.slug}.png`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/products/placeholder.png';
                        }}
                      />
                    </Link>

                    {/* Brand & Name */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8] block mb-1">
                      {item.brandName || detail?.brand?.name || 'Chính hãng'}
                    </span>
                    <Link
                      to={`/products/${item.slug}`}
                      className="font-semibold text-gray-900 hover:text-[#1D4ED8] text-xs sm:text-sm line-clamp-2 mb-2 transition-colors"
                      title={item.name}
                    >
                      {item.name}
                    </Link>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-base font-bold text-[#D70018]">
                        {formatVND(item.minPrice || item.basePrice)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => detail && handleAddToCart(detail)}
                        className={`w-full h-8 px-3 rounded font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : addedSlug === item.slug
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white'
                        }`}
                      >
                        {addedSlug === item.slug ? (
                          'Đã thêm giỏ!'
                        ) : isOutOfStock ? (
                          'Tạm hết hàng'
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[15px]">shopping_cart</span>
                            <span>Thêm vào giỏ</span>
                          </>
                        )}
                      </button>

                      <Link
                        to={`/products/${item.slug}`}
                        className="w-full h-8 px-3 rounded border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center justify-center transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </th>
                );
              })}

              {/* Slot thêm sản phẩm */}
              {items.length < maxItems && (
                <th className="p-6 min-w-[200px] align-middle text-center bg-slate-50/40 border-dashed border-2 border-slate-200 m-2 rounded-2xl">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Thêm sản phẩm so sánh</p>
                    <p className="text-[11px] text-slate-400 mb-4 max-w-[150px]">
                      Còn trống {maxItems - items.length} vị trí so sánh
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/categories')}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
                    >
                      Chọn sản phẩm
                    </button>
                  </div>
                </th>
              )}
            </tr>
          </thead>

          {/* Specs Rows */}
          <tbody className="divide-y divide-slate-100">
            {/* Section: Thông tin chung */}
            <tr className="bg-slate-100/70 font-bold text-xs uppercase tracking-wider text-slate-600">
              <td colSpan={items.length + 1 + (items.length < maxItems ? 1 : 0)} className="py-2.5 px-6">
                📌 Thông tin chung & Bảo hành
              </td>
            </tr>

            {/* Hãng sản xuất */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 bg-slate-50/50 border-r border-slate-200">
                Hãng sản xuất
              </td>
              {items.map((item) => (
                <td key={item.id} className="p-4 text-slate-800 border-r border-slate-200 font-medium">
                  {item.brandName || details[item.slug]?.brand?.name || 'Chính hãng'}
                </td>
              ))}
              {items.length < maxItems && <td className="bg-slate-50/30" />}
            </tr>

            {/* Danh mục */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 bg-slate-50/50 border-r border-slate-200">
                Danh mục
              </td>
              {items.map((item) => (
                <td key={item.id} className="p-4 text-slate-800 border-r border-slate-200">
                  {item.categoryName || details[item.slug]?.category?.name || 'Thiết bị công nghệ'}
                </td>
              ))}
              {items.length < maxItems && <td className="bg-slate-50/30" />}
            </tr>

            {/* Mô hình 3D tương tác */}
            <tr>
              <td className="p-4 font-semibold text-slate-600 bg-slate-50/50 border-r border-slate-200">
                Mô hình 3D 360°
              </td>
              {items.map((item) => (
                <td key={item.id} className="p-4 text-slate-800 border-r border-slate-200">
                  {item.model3DUrl ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                      Có hỗ trợ xoay 3D
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Không có</span>
                  )}
                </td>
              ))}
              {items.length < maxItems && <td className="bg-slate-50/30" />}
            </tr>

            {/* Section: Thông số kỹ thuật chi tiết */}
            <tr className="bg-slate-100/70 font-bold text-xs uppercase tracking-wider text-slate-600">
              <td colSpan={items.length + 1 + (items.length < maxItems ? 1 : 0)} className="py-2.5 px-6">
                ⚡ Thông số kỹ thuật chi tiết
              </td>
            </tr>

            {allSpecKeys.map((key) => {
              // Kiểm tra xem các sản phẩm có cùng giá trị cho key này không
              const values = items.map((item) => getSpecValue(details[item.slug], key));
              const isDifferent = new Set(values).size > 1;

              // Nếu đang bật chế độ chỉ hiện điểm khác biệt mà dòng này giống nhau -> ẩn đi
              if (diffOnly && !isDifferent) {
                return null;
              }

              return (
                <tr
                  key={key}
                  className={`hover:bg-blue-50/30 transition-colors ${
                    isDifferent ? 'bg-cyan-50/20' : ''
                  }`}
                >
                  <td className="p-4 font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200 flex items-center justify-between">
                    <span>{key}</span>
                    {isDifferent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" title="Có điểm khác biệt" />
                    )}
                  </td>
                  {items.map((item) => {
                    const val = getSpecValue(details[item.slug], key);
                    return (
                      <td
                        key={item.id}
                        className={`p-4 border-r border-slate-200 text-slate-800 ${
                          isDifferent ? 'font-medium' : ''
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                  {items.length < maxItems && <td className="bg-slate-50/30" />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer tips */}
      <div className="mt-8 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3 text-slate-600 text-xs md:text-sm">
        <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          <strong className="font-semibold text-blue-900 block mb-0.5">Mẹo so sánh:</strong>
          Các dòng được tô sáng nhẹ có chứa thông số khác nhau giữa các sản phẩm để bạn tiện theo dõi. Bạn có thể bật công tắc <strong>"Chỉ xem điểm khác biệt"</strong> ở trên để lọc nhanh các thông số tương đồng.
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
