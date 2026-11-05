export interface WishlistItemDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnailUrl?: string | null;
  basePrice: number;
  categoryName: string;
  brandName: string;
  isActive: boolean;
  createdAt: string;
}

export interface SyncWishlistDto {
  productIds: string[];
}
