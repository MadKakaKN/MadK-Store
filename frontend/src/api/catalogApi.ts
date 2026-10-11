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
} from '../types/catalog';
import {
  MOCK_CATEGORY_TREE,
  MOCK_BRANDS,
  getMockProducts,
  getMockProductBySlug,
  getMockCategoryBySlug,
  getMockCategoryFilters,
} from './mockData';

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
   * Lấy cây danh mục phân cấp (cha - con)
   */
  async getCategoryTree(): Promise<CategoryTreeDto[]> {
    try {
      const response = await apiClient.get<Result<CategoryTreeDto[]>>('/categories');
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return MOCK_CATEGORY_TREE;
    } catch (error) {
      console.warn('[Catalog API] Failed to fetch category tree, using mock fallback:', error);
      return MOCK_CATEGORY_TREE;
    }
  },

  /**
   * Lấy chi tiết danh mục theo slug
   */
  async getCategoryBySlug(slug: string): Promise<CategoryDetailDto | null> {
    try {
      const response = await apiClient.get<Result<CategoryDetailDto>>(`/categories/${encodeURIComponent(slug)}`);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return getMockCategoryBySlug(slug);
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch category '${slug}', using mock fallback:`, error);
      return getMockCategoryBySlug(slug);
    }
  },

  /**
   * Lấy bộ lọc khả dụng của danh mục
   */
  async getCategoryFilters(slug: string): Promise<CategoryFiltersDto> {
    try {
      const response = await apiClient.get<Result<CategoryFiltersDto>>(`/categories/${encodeURIComponent(slug)}/filters`);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return getMockCategoryFilters(slug);
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch filters for '${slug}', using mock fallback:`, error);
      return getMockCategoryFilters(slug);
    }
  },

  /**
   * Lấy danh sách thương hiệu
   */
  async getBrands(isActive: boolean = true): Promise<BrandDto[]> {
    try {
      const response = await apiClient.get<Result<BrandDto[]>>('/brands', {
        params: { isActive },
      });
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return MOCK_BRANDS;
    } catch (error) {
      console.warn('[Catalog API] Failed to fetch brands, using mock fallback:', error);
      return MOCK_BRANDS;
    }
  },

  /**
   * Danh sách sản phẩm kèm lọc, sắp xếp, tìm kiếm và phân trang
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
      return getMockProducts(params);
    } catch (error) {
      console.warn('[Catalog API] Failed to fetch products, using mock fallback:', error);
      return getMockProducts(params);
    }
  },

  /**
   * Chi tiết sản phẩm theo slug
   */
  async getProductBySlug(slug: string): Promise<ProductDetailDto | null> {
    try {
      const response = await apiClient.get<Result<ProductDetailDto>>(`/products/${encodeURIComponent(slug)}`);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
      return getMockProductBySlug(slug);
    } catch (error) {
      console.warn(`[Catalog API] Failed to fetch product '${slug}', using mock fallback:`, error);
      return getMockProductBySlug(slug);
    }
  },
};

export default catalogApi;
