export interface CartItemDto {
  id: string;
  cartId: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  attributes?: Record<string, string>;
  originalPrice: number;
  price: number;
  quantity: number;
  totalPrice: number;
  thumbnailUrl?: string;
  stockQuantity: number;
  isActive: boolean;
}

export interface CartDto {
  id: string;
  userId?: string;
  anonymousId?: string;
  items: CartItemDto[];
  totalQuantity: number;
  totalAmount: number;
  updatedAt?: string;
}

export interface AddToCartRequestDto {
  variantId: string;
  quantity: number;
  clientPrice?: number;
}

export interface UpdateCartItemRequestDto {
  quantity: number;
}

export interface MergeCartItemDto {
  variantId: string;
  quantity: number;
}

export interface MergeCartRequestDto {
  anonymousId?: string;
  items: MergeCartItemDto[];
}
