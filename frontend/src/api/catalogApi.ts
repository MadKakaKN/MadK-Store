import apiClient from './apiClient';
import {
  CategoryTreeDto,
  CategoryDetailDto,
  CategoryFiltersDto,
  BrandDto,
  ProductListDto,
  ProductDetailDto,
  PagedResult,
  ProductQueryParams,
  Result,
  SearchSuggestionsDto,
} from '../types/catalog';

/**
 * Builds URLSearchParams correctly supporting nested specs: specs[ram]=16GB
 */
function buildProductQueryParams(params: ProductQueryParams = {}): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.categorySlug) searchParams.append('categorySlug', params.categorySlug);
  if (params.categoryId) searchParams.append('categoryId', params.categoryId);
  if (params.brandSlug) searchParams.append('brandSlug', params.brandSlug);
  if (params.brandId) searchParams.append('brandId', params.brandId);
  if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.isFeatured !== undefined) searchParams.append('isFeatured', params.isFeatured.toString());
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());

  if (params.specs) {
    for (const [key, value] of Object.entries(params.specs)) {
      if (value) {
        searchParams.append(`specs[${key}]`, value);
      }
    }
  }

  return searchParams;
}

export const catalogApi = {
  /**
   * Lấy cây danh mục phân cấp (cha - con) từ cơ sở dữ liệu
   */
  async getCategoryTree(): Promise<CategoryTreeDto[]> {
    try {
      const response = await apiClient.get<Result<CategoryTreeDto[]>>('/categories');
      if (response.data?.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.warn('[Catalog API] Failed to fetch category tree:', error);
      return [];
    }
  },

  /**
   * Lấy chi tiết danh mục theo slug từ cơ sở dữ liệu
   */
  async getCategoryBySlug(slug: string): Promise<CategoryDetailDto | null> {
    try {
      const response = await apiClient.get<Result<CategoryDetailDto>>(`/categories/${encodeURIComponent(slug)}`);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch category '${slug}':`, error);
      return null;
    }
  },

  /**
   * Lấy bộ lọc khả dụng của danh mục từ cơ sở dữ liệu
   */
  async getCategoryFilters(slug: string): Promise<CategoryFiltersDto> {
    const defaultFilters: CategoryFiltersDto = {
      categoryId: '',
      categoryName: '',
      categorySlug: slug,
      brands: [],
      priceRange: { minPrice: 0, maxPrice: 0 },
      specFilters: [],
    };
    try {
      const response = await apiClient.get<Result<CategoryFiltersDto>>(`/categories/${encodeURIComponent(slug)}/filters`);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return defaultFilters;
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch filters for '${slug}':`, error);
      return defaultFilters;
    }
  },

  /**
   * Lấy danh sách thương hiệu từ cơ sở dữ liệu
   */
  async getBrands(isActive: boolean = true): Promise<BrandDto[]> {
    try {
      const response = await apiClient.get<Result<BrandDto[]>>('/brands', {
        params: { isActive },
      });
      if (response.data?.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.warn('[Catalog API] Failed to fetch brands:', error);
      return [];
    }
  },

  /**
   * Danh sách sản phẩm kèm lọc, sắp xếp, tìm kiếm và phân trang từ cơ sở dữ liệu
   */
  async getProducts(params: ProductQueryParams = {}): Promise<PagedResult<ProductListDto>> {
    try {
      const searchParams = buildProductQueryParams(params);
      const queryString = searchParams.toString();
      const url = `/products${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<Result<PagedResult<ProductListDto>>>(url);

      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return { items: [], page: 1, pageSize: params.pageSize || 20, totalItems: 0, totalPages: 0 };
    } catch (error) {
      console.warn('[Catalog API] Failed to fetch products:', error);
      return { items: [], page: 1, pageSize: params.pageSize || 20, totalItems: 0, totalPages: 0 };
    }
  },

  /**
   * Chi tiết sản phẩm theo slug từ cơ sở dữ liệu
   */
  async getProductBySlug(slug: string): Promise<ProductDetailDto | null> {
    try {
      const response = await apiClient.get<Result<ProductDetailDto>>(`/products/${encodeURIComponent(slug)}`);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch product '${slug}':`, error);
      return null;
    }
  },

  /**
   * Gợi ý tìm kiếm nhanh (Typo-tolerant suggestions: products, categories, brands)
   */
  async getSuggestions(query: string, limit: number = 6): Promise<SearchSuggestionsDto | null> {
    if (!query || query.trim().length === 0) {
      return null;
    }
    try {
      const response = await apiClient.get<Result<SearchSuggestionsDto>>('/products/suggestions', {
        params: { q: query.trim(), limit },
      });
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch suggestions for '${query}':`, error);
      return null;
    }
  },
};

export default catalogApi;
