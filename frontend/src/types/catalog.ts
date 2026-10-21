/**
 * Envelope response format as specified in docs/api.md
 */
export interface Result<T> {
  isSuccess: boolean;
  data: T | null;
  message: string | null;
  error: string | null;
}

/**
 * Standard paginated response format
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Category hierarchical tree node
 */
export interface CategoryTreeDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
  children: CategoryTreeDto[];
}

/**
 * Category detail with dynamic spec schema
 */
export interface CategoryDetailDto {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
  schemaDefinition?: string;
}

export interface BrandFilterDto {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  productCount: number;
}

export interface PriceRangeDto {
  minPrice: number;
  maxPrice: number;
}

export interface SpecFilterDto {
  key: string;
  label: string;
  options: string[];
}

export interface CategoryFiltersDto {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  brands: BrandFilterDto[];
  priceRange: PriceRangeDto;
  specFilters: SpecFilterDto[];
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface ProductListDto {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  model3DUrl?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface ProductImageDto {
  id: string;
  variantId?: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  name: string;
  attributes: string; // JSON string e.g. {"color":"Titan Tự Nhiên","storage":"256GB"}
  originalPrice: number;
  salePrice: number;
  costPrice: number;
  isActive: boolean;
  stockQuantity?: number;
  images: ProductImageDto[];
  isOnSale?: boolean;
  promotionName?: string | null;
  promotionEndDate?: string | null;
  discountPercent?: number;
}

export interface ProductDetailDto {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  specifications: string; // JSON string of technical specs
  model3DUrl?: string;
  thumbnailUrl?: string;
  basePrice: number;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  variants: ProductVariantDto[];
  images: ProductImageDto[];
}

export interface ProductQueryParams {
  categorySlug?: string;
  categoryId?: string;
  brandSlug?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  isFeatured?: boolean;
  specs?: Record<string, string>;
  page?: number;
  pageSize?: number;
}
