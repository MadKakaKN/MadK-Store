import React, { useState, useEffect, useCallback } from 'react';
import adminReviewApi from '../../../api/adminReviewApi';
import { AdminReviewDto, ReviewStatus } from '../../../types/review';
import { useToast } from '../components/common/ToastContext';

export const AdminReviewsPage: React.FC = () => {
  const toast = useToast();

  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Selected review for Moderation / Reply Modal
  const [selectedReview, setSelectedReview] = useState<AdminReviewDto | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [modalStatus, setModalStatus] = useState<ReviewStatus>('Approved');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Image preview modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminReviewApi.getReviews({
        page,
        pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });

      setReviews(data.items);
      setTotalCount(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch admin reviews:', err);
      toast.error(err?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenModeration = (review: AdminReviewDto) => {
    setSelectedReview(review);
    setReplyText(review.adminReply || '');
    setModalStatus(review.status);
  };

  const handleQuickStatusChange = async (review: AdminReviewDto, newStatus: ReviewStatus) => {
    try {
      await adminReviewApi.updateStatus(review.id, {
        status: newStatus,
        adminReply: review.adminReply || undefined,
      });

      toast.success(
        newStatus === 'Approved' ? 'Đã phê duyệt hiển thị đánh giá' : 'Đã ẩn đánh giá khỏi cửa hàng'
      );
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi cập nhật trạng thái');
    }
  };

  const handleSaveModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      setIsSaving(true);
      await adminReviewApi.updateStatus(selectedReview.id, {
        status: modalStatus,
        adminReply: replyText.trim() || undefined,
      });

      toast.success('Cập nhật kiểm duyệt và phản hồi thành công!');
      setSelectedReview(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi lưu kiểm duyệt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (review: AdminReviewDto) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đánh giá của "${review.userName}" không?`)) {
      return;
    }

    try {
      await adminReviewApi.deleteReview(review.id);
      toast.success('Đã xóa đánh giá thành công');
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa đánh giá');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý Đánh giá & Nhận xét
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm duyệt nhận xét của khách hàng, xác thực người mua thật và phản hồi đại diện MadK Store.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'Tất cả'
                : st === 'Pending'
                ? 'Chờ duyệt'
                : st === 'Approved'
                ? 'Đã duyệt'
                : 'Đã ẩn'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo khách hàng, sản phẩm, nội dung..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 shadow-2xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p>Đang tải dữ liệu đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <span className="text-3xl block mb-2">⭐</span>
            <p className="font-semibold text-slate-700">Không tìm thấy đánh giá nào</p>
            <p className="text-xs text-slate-400 mt-1">Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Đánh giá</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Phản hồi của Shop</th>
                  <th className="p-4">Ngày gửi</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Product */}
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {rev.productThumbnail ? (
                            <img
                              src={rev.productThumbnail}
                              alt={rev.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">📦</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <a
                            href={`/products/${rev.productSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-slate-900 hover:text-brand-600 truncate block transition-colors"
                          >
                            {rev.productName}
                          </a>
                          {rev.orderNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Đơn #{rev.orderNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{rev.userName}</div>
                      <div className="text-[11px] text-slate-400">{rev.userEmail}</div>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ✓ Đã mua hàng
                        </span>
                      )}
                    </td>

                    {/* Rating & Content */}
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="font-bold text-slate-800 ml-1">({rev.rating}/5)</span>
                      </div>
                      {rev.title && <p className="font-bold text-slate-900 mb-0.5">{rev.title}</p>}
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">{rev.comment}</p>

                      {/* Image Thumbnails */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {rev.images.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setZoomedImage(img)}
                              className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 hover:scale-105 transition-transform"
                            >
                              <img src={img} alt="rev" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {rev.status === 'Approved' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          ● Hiển thị
                        </span>
                      ) : rev.status === 'Pending' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                          ⏳ Chờ duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                          ✕ Đã ẩn
                        </span>
                      )}
                    </td>

                    {/* Admin Reply */}
                    <td className="p-4 max-w-xs">
                      {rev.adminReply ? (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 line-clamp-2">
                          <span className="font-bold text-brand-700 block">MadK:</span>
                          {rev.adminReply}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phản hồi</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status === 'Approved' ? (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(rev, 'Rejected')}
                            title="Ẩn khỏi cửa hàng"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                          >
                            Ẩn
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(rev, 'Approved')}
                            title="Duyệt hiển thị"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
                          >
                            Duyệt
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenModeration(rev)}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 font-bold transition-colors"
                        >
                          Phản hồi
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev)}
                          title="Xóa đánh giá"
                          className="px-2 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị {reviews.length} trên tổng số {totalCount} đánh giá
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              <span className="font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation & Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Kiểm duyệt & Phản hồi đánh giá
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Khách hàng: <strong className="text-slate-700">{selectedReview.userName}</strong> ({selectedReview.userEmail})
            </p>

            {/* Review Quote */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-5 space-y-2">
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s}>{selectedReview.rating >= s ? '★' : '☆'}</span>
                ))}
                {selectedReview.title && (
                  <span className="font-bold text-slate-900 ml-1.5">{selectedReview.title}</span>
                )}
              </div>
              <p className="text-slate-700 leading-relaxed italic">"{selectedReview.comment}"</p>
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {selectedReview.images.map((img, i) => (
                    <img key={i} src={img} alt="review-img" className="w-12 h-12 rounded-lg object-cover border" />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveModeration} className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Trạng thái hiển thị
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStatus('Approved')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      modalStatus === 'Approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Duyệt hiển thị
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatus('Pending')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      modalStatus === 'Pending'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Chờ duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatus('Rejected')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      modalStatus === 'Rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Ẩn nhận xét
                  </button>
                </div>
              </div>

              {/* Admin Reply Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phản hồi chính thức của MadK Store
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi, cảm ơn hoặc hỗ trợ khách hàng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/30 disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu kiểm duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
