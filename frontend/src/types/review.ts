export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ProductReviewDto {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  helpfulCount: number;
  createdAt: string;
}

export interface ProductReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  ratingPercentages: Record<number, number>;
}

export interface ProductReviewsPagedResultDto {
  summary: ProductReviewSummaryDto;
  items: ProductReviewDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateProductReviewDto {
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  orderId?: string;
}

export interface AdminReviewDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productThumbnail?: string | null;
  userId: string;
  userName: string;
  userEmail?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  helpfulCount: number;
  createdAt: string;
}

export interface AdminReviewStatusUpdateDto {
  status: ReviewStatus;
  adminReply?: string;
}

export interface CanReviewProductResultDto {
  canReview: boolean;
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  reason?: string | null;
  eligibleOrderId?: string | null;
}
