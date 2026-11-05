import React, { useState, useEffect, useCallback } from 'react';
import reviewApi from '../../../api/reviewApi';
import {
  ProductReviewDto,
  ProductReviewSummaryDto,
  CanReviewProductResultDto,
} from '../../../types/review';
import { useAuth } from '../../auth/context/AuthContext';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  onOpenAuthModal: () => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  onOpenAuthModal,
}) => {
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<ProductReviewDto[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummaryDto | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Eligibility check state
  const [canReviewInfo, setCanReviewInfo] = useState<CanReviewProductResultDto | null>(null);

  // Write review modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Image preview modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewApi.getProductReviews(productId, page, 10, ratingFilter);
      setReviews(data.items);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [productId, page, ratingFilter]);

  // Check review eligibility
  const checkCanReview = useCallback(async () => {
    if (!isAuthenticated) {
      setCanReviewInfo(null);
      return;
    }
    try {
      const info = await reviewApi.canReviewProduct(productId);
      setCanReviewInfo(info);
    } catch {
      // Ignored if non-logged in or endpoint fails
    }
  }, [isAuthenticated, productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    checkCanReview();
  }, [checkCanReview]);

  // Handle open review modal
  const handleOpenWriteModal = () => {
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewImages([]);
    setImageUrlInput('');
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsModalOpen(true);
  };

  // Add image URL
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (reviewImages.length >= 5) {
      setSubmitError('Bạn chỉ có thể đính kèm tối đa 5 hình ảnh');
      return;
    }
    setReviewImages([...reviewImages, trimmed]);
    setImageUrlInput('');
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewComment.trim().length < 5) {
      setSubmitError('Nội dung đánh giá cần tối thiểu 5 ký tự.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await reviewApi.createReview(productId, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        images: reviewImages.length > 0 ? reviewImages : undefined,
        orderId: canReviewInfo?.eligibleOrderId || undefined,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setPage(1);
        loadReviews();
        checkCanReview();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  // Vote helpful
  const handleVoteHelpful = async (reviewId: string) => {
    try {
      const newCount = await reviewApi.voteHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: newCount } : r))
      );
    } catch (err) {
      console.error('Failed to vote helpful:', err);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Rất tệ',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Tuyệt vời',
  };

  return (
    <div className="space-y-8">
      {/* Overview & Rating Summary */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Average Rating Block */}
          <div className="text-center md:text-left md:border-r md:border-slate-200 md:pr-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Đánh giá trung bình
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {summary ? summary.averageRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-lg font-bold text-slate-400">/ 5</span>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center md:justify-start gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${
                    summary && summary.averageRating >= star - 0.2
                      ? 'text-amber-400 fill-amber-400'
                      : summary && summary.averageRating >= star - 0.7
                      ? 'text-amber-400 fill-amber-300'
                      : 'text-slate-300 fill-slate-200'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Dựa trên {summary?.totalReviews || 0} lượt đánh giá thực tế
            </p>
          </div>

          {/* Rating Breakdown Bar Chart */}
          <div className="space-y-2 md:col-span-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary?.ratingDistribution[star] || 0;
              const percent = summary?.ratingPercentages[star] || 0;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingFilter(ratingFilter === star ? undefined : star)}
                  className={`w-full flex items-center gap-2 text-xs group transition-colors p-1 rounded-lg ${
                    ratingFilter === star ? 'bg-amber-100/70 font-bold' : 'hover:bg-slate-200/50'
                  }`}
                >
                  <span className="w-10 text-right font-medium text-slate-600 flex items-center justify-end gap-0.5">
                    {star}
                    <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-left text-slate-400 font-medium">{count}</span>
                </button>
              );
            })}
          </div>

          {/* CTA Box */}
          <div className="text-center md:text-right flex flex-col items-center md:items-end justify-center gap-3">
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              Bạn đã trải nghiệm sản phẩm này? Hãy chia sẻ cảm nhận chân thực để nhận xét được hiển thị nhé!
            </p>
            {canReviewInfo?.alreadyReviewed ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Bạn đã gửi đánh giá cho sản phẩm này
              </span>
            ) : (
              <button
                type="button"
                onClick={handleOpenWriteModal}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Viết đánh giá của bạn
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-slate-500 mr-2">Lọc theo:</span>
        <button
          type="button"
          onClick={() => {
            setRatingFilter(undefined);
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            ratingFilter === undefined
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả ({totalCount || summary?.totalReviews || 0})
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              setRatingFilter(star);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              ratingFilter === star
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {star} sao ({summary?.ratingDistribution[star] || 0})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Đang tải đánh giá...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200 text-center">
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h4 className="text-base font-bold text-slate-700 mb-1">Chưa có đánh giá nào</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Hãy là khách hàng đầu tiên chia sẻ nhận xét về <span className="font-semibold text-slate-600">{productName}</span>!
          </p>
          <button
            type="button"
            onClick={handleOpenWriteModal}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
          >
            Đánh giá ngay
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="pt-6 first:pt-0 space-y-3">
              {/* User row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                    {review.userAvatar ? (
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      review.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{review.userName}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Đã mua hàng tại MadK Store
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className={`w-4 h-4 ${
                        review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Title & Comment */}
              <div className="space-y-1.5 pl-13">
                {review.title && (
                  <h5 className="font-bold text-sm text-slate-900">{review.title}</h5>
                )}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {review.comment}
                </p>

                {/* Attached Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {review.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setZoomedImage(img)}
                        className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img src={img} alt="Đánh giá" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Admin Reply */}
                {review.adminReply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Phản hồi từ MadK Store:
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">{review.adminReply}</p>
                  </div>
                )}

                {/* Helpful count */}
                <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(review.id)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    Hữu ích ({review.helpfulCount})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Trang trước
          </button>
          <span className="text-xs font-semibold text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Đánh giá sản phẩm</h3>
            <p className="text-xs text-slate-500 mb-6">{productName}</p>

            {canReviewInfo?.hasPurchased && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Bạn là người mua đã xác thực! Nhận xét sẽ nhận tick xanh Verified.
              </div>
            )}

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-900">Gửi đánh giá thành công!</h4>
                <p className="text-xs text-slate-500">Cảm ơn bạn đã đóng góp đánh giá cho MadK Store.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                    {submitError}
                  </div>
                )}

                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Chất lượng sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 ${
                            (hoverRating || reviewRating) >= star
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-600 ml-2">
                      {ratingLabels[hoverRating || reviewRating]}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu đề (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Tóm tắt trải nghiệm (e.g. Rất hài lòng, máy đẹp mượt)"
                    maxLength={150}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nội dung nhận xét <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Hãy chia sẻ cảm nhận thực tế về chất lượng, thiết kế, thời gian giao hàng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Đính kèm hình ảnh (Tối đa 5 ảnh)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Nhập đường dẫn URL ảnh (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Thêm ảnh
                    </button>
                  </div>

                  {reviewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {reviewImages.map((url, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={url} alt="upload" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsSection;
