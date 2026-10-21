import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';

export interface AdminCategoryListDto {
  id: string;
  parentId: string | null;
  parentName: string | null;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  productsCount: number;
  hasSchema: boolean;
  createdAt: string;
}

export interface AdminCategoryDetailDto {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  schemaDefinition: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  schemaDefinition?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminBrandListDto {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  productsCount: number;
  createdAt: string;
}

export interface AdminBrandDetailDto {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateBrandRequest {
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateBrandRequest {
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface AdminProductListDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  thumbnailUrl: string | null;
  model3DUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  variantsCount: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminProductVariantDto {
  id: string;
  productId: string;
  sku: string;
  name: string;
  attributes: string;
  originalPrice: number;
  salePrice: number;
  costPrice: number;
  isActive: boolean;
  isDeleted: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface AdminProductImageDto {
  id: string;
  productId: string;
  variantId: string | null;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface AdminProductDetailDto {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  basePrice: number;
  specifications: string;
  model3DUrl: string | null;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  variants: AdminProductVariantDto[];
  images: AdminProductImageDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateProductVariantRequest {
  sku: string;
  name: string;
  attributes?: string;
  originalPrice: number;
  salePrice: number;
  costPrice?: number;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface CreateProductImageRequest {
  variantId?: string | null;
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  categoryId: string;
  brandId: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  specifications?: string;
  model3DUrl?: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  variants?: CreateProductVariantRequest[];
  images?: CreateProductImageRequest[];
}

export interface UpdateProductRequest {
  name: string;
  slug?: string;
  categoryId: string;
  brandId: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  specifications?: string;
  model3DUrl?: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
}

export interface AdminProductQueryFilter {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FileUploadResultDto {
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  contentType: string;
}

export const adminCatalogApi = {
  // Categories
  async getCategories(includeDeleted = false): Promise<AdminCategoryListDto[]> {
    const res = await apiClient.get<ApiEnvelope<AdminCategoryListDto[]>>('/admin/catalog/categories', {
      params: { includeDeleted },
    });
    return res.data.data ?? [];
  },

  async getCategoryById(id: string): Promise<AdminCategoryDetailDto> {
    const res = await apiClient.get<ApiEnvelope<AdminCategoryDetailDto>>(`/admin/catalog/categories/${id}`);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Không tìm thấy danh mục');
    }
    return res.data.data;
  },

  async createCategory(data: CreateCategoryRequest): Promise<AdminCategoryDetailDto> {
    const res = await apiClient.post<ApiEnvelope<AdminCategoryDetailDto>>('/admin/catalog/categories', data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Tạo danh mục thất bại');
    }
    return res.data.data;
  },

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<AdminCategoryDetailDto> {
    const res = await apiClient.put<ApiEnvelope<AdminCategoryDetailDto>>(`/admin/catalog/categories/${id}`, data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Cập nhật danh mục thất bại');
    }
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await apiClient.delete<ApiEnvelope<boolean>>(`/admin/catalog/categories/${id}`);
    if (!res.data.isSuccess) {
      throw new Error(res.data.error || 'Xóa danh mục thất bại');
    }
    return true;
  },

  async updateCategorySchema(id: string, schemaDefinition: string): Promise<string> {
    const res = await apiClient.put<ApiEnvelope<string>>(`/admin/catalog/categories/${id}/schema`, {
      schemaDefinition,
    });
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Cập nhật schema thất bại');
    }
    return res.data.data;
  },

  // Brands
  async getBrands(includeDeleted = false): Promise<AdminBrandListDto[]> {
    const res = await apiClient.get<ApiEnvelope<AdminBrandListDto[]>>('/admin/catalog/brands', {
      params: { includeDeleted },
    });
    return res.data.data ?? [];
  },

  async getBrandById(id: string): Promise<AdminBrandDetailDto> {
    const res = await apiClient.get<ApiEnvelope<AdminBrandDetailDto>>(`/admin/catalog/brands/${id}`);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Không tìm thấy thương hiệu');
    }
    return res.data.data;
  },

  async createBrand(data: CreateBrandRequest): Promise<AdminBrandDetailDto> {
    const res = await apiClient.post<ApiEnvelope<AdminBrandDetailDto>>('/admin/catalog/brands', data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Tạo thương hiệu thất bại');
    }
    return res.data.data;
  },

  async updateBrand(id: string, data: UpdateBrandRequest): Promise<AdminBrandDetailDto> {
    const res = await apiClient.put<ApiEnvelope<AdminBrandDetailDto>>(`/admin/catalog/brands/${id}`, data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Cập nhật thương hiệu thất bại');
    }
    return res.data.data;
  },

  async deleteBrand(id: string): Promise<boolean> {
    const res = await apiClient.delete<ApiEnvelope<boolean>>(`/admin/catalog/brands/${id}`);
    if (!res.data.isSuccess) {
      throw new Error(res.data.error || 'Xóa thương hiệu thất bại');
    }
    return true;
  },

  // Products
  async getProducts(filter: AdminProductQueryFilter = {}): Promise<PagedResult<AdminProductListDto>> {
    const res = await apiClient.get<ApiEnvelope<PagedResult<AdminProductListDto>>>('/admin/catalog/products', {
      params: filter,
    });
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Tải danh sách sản phẩm thất bại');
    }
    return res.data.data;
  },

  async getProductById(id: string): Promise<AdminProductDetailDto> {
    const res = await apiClient.get<ApiEnvelope<AdminProductDetailDto>>(`/admin/catalog/products/${id}`);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Không tìm thấy sản phẩm');
    }
    return res.data.data;
  },

  async createProduct(data: CreateProductRequest): Promise<AdminProductDetailDto> {
    const res = await apiClient.post<ApiEnvelope<AdminProductDetailDto>>('/admin/catalog/products', data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Tạo sản phẩm thất bại');
    }
    return res.data.data;
  },

  async updateProduct(id: string, data: UpdateProductRequest): Promise<AdminProductDetailDto> {
    const res = await apiClient.put<ApiEnvelope<AdminProductDetailDto>>(`/admin/catalog/products/${id}`, data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Cập nhật sản phẩm thất bại');
    }
    return res.data.data;
  },

  async toggleProductVisibility(id: string): Promise<boolean> {
    const res = await apiClient.put<ApiEnvelope<boolean>>(`/admin/catalog/products/${id}/visibility`);
    if (!res.data.isSuccess) {
      throw new Error(res.data.error || 'Thao tác ẩn/hiện sản phẩm thất bại');
    }
    return res.data.data ?? false;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await apiClient.delete<ApiEnvelope<boolean>>(`/admin/catalog/products/${id}`);
    if (!res.data.isSuccess) {
      throw new Error(res.data.error || 'Xóa sản phẩm thất bại');
    }
    return true;
  },

  async restoreProduct(id: string): Promise<boolean> {
    const res = await apiClient.post<ApiEnvelope<boolean>>(`/admin/catalog/products/${id}/restore`);
    if (!res.data.isSuccess) {
      throw new Error(res.data.error || 'Khôi phục sản phẩm thất bại');
    }
    return true;
  },

  // Variants
  async createVariant(productId: string, data: CreateProductVariantRequest): Promise<AdminProductVariantDto> {
    const res = await apiClient.post<ApiEnvelope<AdminProductVariantDto>>(`/admin/catalog/products/${productId}/variants`, data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Thêm biến thể thất bại');
    }
    return res.data.data;
  },

  async updateVariant(variantId: string, data: Partial<CreateProductVariantRequest>): Promise<AdminProductVariantDto> {
    const res = await apiClient.put<ApiEnvelope<AdminProductVariantDto>>(`/admin/catalog/variants/${variantId}`, data);
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Cập nhật biến thể thất bại');
    }
    return res.data.data;
  },

  async deleteVariant(variantId: string): Promise<boolean> {
    const res = await apiClient.delete<ApiEnvelope<boolean>>(`/admin/catalog/variants/${variantId}`);
    if (!res.data.isSuccess) {
      throw new Error(res.data.error || 'Xóa biến thể thất bại');
    }
    return true;
  },

  // Uploads
  async uploadImage(file: File, subFolder = 'products'): Promise<FileUploadResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiEnvelope<FileUploadResultDto>>('/admin/catalog/upload-image', formData, {
      params: { subFolder },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Tải ảnh lên thất bại');
    }
    return res.data.data;
  },

  async uploadModel3D(file: File): Promise<FileUploadResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiEnvelope<FileUploadResultDto>>('/admin/catalog/upload-model3d', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!res.data.isSuccess || !res.data.data) {
      throw new Error(res.data.error || 'Tải model 3D thất bại');
    }
    return res.data.data;
  },
};
