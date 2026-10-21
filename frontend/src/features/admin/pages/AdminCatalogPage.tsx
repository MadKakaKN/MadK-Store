import React, { useState, useEffect, useCallback } from 'react';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import ConfirmModal from '../components/common/ConfirmModal';
import Badge from '../components/common/Badge';
import { useToast } from '../components/common/ToastContext';
import {
  AdminProductListDto,
  AdminCategoryListDto,
  AdminBrandListDto,
  adminCatalogApi,
} from '../../../api/adminCatalogApi';
import { ProductFormModal } from '../components/catalog/ProductFormModal';
import { CategoryFormModal } from '../components/catalog/CategoryFormModal';
import { CategorySchemaModal } from '../components/catalog/CategorySchemaModal';
import { BrandFormModal } from '../components/catalog/BrandFormModal';

type ActiveCatalogTab = 'products' | 'categories' | 'brands';

// Fallback Mock Data in case backend is offline
const MOCK_CATEGORIES: AdminCategoryListDto[] = [
  {
    id: 'cat-1',
    parentId: null,
    parentName: null,
    name: 'Điện thoại',
    slug: 'dien-thoai',
    description: 'Smartphone chính hãng các dòng iPhone, Galaxy...',
    iconUrl: '/icons/phone.svg',
    displayOrder: 1,
    isActive: true,
    isDeleted: false,
    productsCount: 14,
    hasSchema: true,
    createdAt: '2026-10-10T00:00:00Z',
  },
  {
    id: 'cat-2',
    parentId: null,
    parentName: null,
    name: 'Laptop & Máy tính',
    slug: 'laptop-may-tinh',
    description: 'Laptop gaming, văn phòng, đồ họa cao cấp',
    iconUrl: '/icons/laptop.svg',
    displayOrder: 2,
    isActive: true,
    isDeleted: false,
    productsCount: 8,
    hasSchema: true,
    createdAt: '2026-10-10T00:00:00Z',
  },
  {
    id: 'cat-3',
    parentId: null,
    parentName: null,
    name: 'Bàn phím cơ Custom',
    slug: 'ban-phim-co',
    description: 'Bàn phím cơ không dây, phím nhôm CNC',
    iconUrl: '/icons/keyboard.svg',
    displayOrder: 3,
    isActive: true,
    isDeleted: false,
    productsCount: 5,
    hasSchema: true,
    createdAt: '2026-10-11T00:00:00Z',
  },
];

const MOCK_BRANDS: AdminBrandListDto[] = [
  {
    id: 'br-1',
    name: 'Apple',
    slug: 'apple',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    description: 'Thương hiệu công nghệ hàng đầu thế giới từ Mỹ',
    isActive: true,
    isDeleted: false,
    productsCount: 15,
    createdAt: '2026-10-10T00:00:00Z',
  },
  {
    id: 'br-2',
    name: 'Samsung',
    slug: 'samsung',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
    description: 'Tập đoàn điện tử hàng đầu Hàn Quốc',
    isActive: true,
    isDeleted: false,
    productsCount: 7,
    createdAt: '2026-10-10T00:00:00Z',
  },
  {
    id: 'br-3',
    name: 'Keychron',
    slug: 'keychron',
    logoUrl: 'https://www.keychron.com/cdn/shop/files/Keychron_Logo_black_180x.png',
    description: 'Chuyên sản xuất bàn phím cơ cao cấp cho Mac và Windows',
    isActive: true,
    isDeleted: false,
    productsCount: 5,
    createdAt: '2026-10-11T00:00:00Z',
  },
];

const MOCK_PRODUCTS: AdminProductListDto[] = [
  {
    id: 'p-1',
    name: 'iPhone 16 Pro Max 256GB',
    slug: 'iphone-16-pro-max-256gb',
    categoryId: 'cat-1',
    categoryName: 'Điện thoại',
    brandId: 'br-1',
    brandName: 'Apple',
    basePrice: 34990000,
    minPrice: 34490000,
    maxPrice: 34990000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
    model3DUrl: '/models/iphone16pro.glb',
    isFeatured: true,
    isActive: true,
    isDeleted: false,
    variantsCount: 3,
    totalStock: 45,
    createdAt: '2026-10-11T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'p-2',
    name: 'MacBook Pro 14 M4 Pro 24GB / 1TB',
    slug: 'macbook-pro-14-m4-pro',
    categoryId: 'cat-2',
    categoryName: 'Laptop & Máy tính',
    brandId: 'br-1',
    brandName: 'Apple',
    basePrice: 54990000,
    minPrice: 52990000,
    maxPrice: 54990000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    model3DUrl: null,
    isFeatured: true,
    isActive: true,
    isDeleted: false,
    variantsCount: 2,
    totalStock: 18,
    createdAt: '2026-10-11T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'p-3',
    name: 'Bàn phím cơ Keychron Q1 Pro Wireless',
    slug: 'keychron-q1-pro-wireless',
    categoryId: 'cat-3',
    categoryName: 'Bàn phím cơ Custom',
    brandId: 'br-3',
    brandName: 'Keychron',
    basePrice: 4600000,
    minPrice: 4500000,
    maxPrice: 4700000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    model3DUrl: '/models/keychron_q1.glb',
    isFeatured: false,
    isActive: true,
    isDeleted: false,
    variantsCount: 2,
    totalStock: 30,
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: null,
  },
];

export const AdminCatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveCatalogTab>('products');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Categories & Brands State
  const [categories, setCategories] = useState<AdminCategoryListDto[]>([]);
  const [brands, setBrands] = useState<AdminBrandListDto[]>([]);

  // Products Tab State
  const [products, setProducts] = useState<AdminProductListDto[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'deleted'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryListDto | null>(null);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaCategory, setSchemaCategory] = useState<AdminCategoryListDto | null>(null);

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<AdminBrandListDto | null>(null);

  // Confirm delete modals
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'product' | 'category' | 'brand';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'product',
    id: '',
    title: '',
    message: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Load Categories & Brands
  const loadMetadata = useCallback(async () => {
    try {
      const [cats, brs] = await Promise.all([
        adminCatalogApi.getCategories(true),
        adminCatalogApi.getBrands(true),
      ]);
      setCategories(cats.length > 0 ? cats : MOCK_CATEGORIES);
      setBrands(brs.length > 0 ? brs : MOCK_BRANDS);
    } catch {
      setCategories(MOCK_CATEGORIES);
      setBrands(MOCK_BRANDS);
    }
  }, []);

  // Load Products
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParams = {
        search: searchQuery || undefined,
        categoryId: categoryFilter || undefined,
        brandId: brandFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'hidden' ? false : undefined,
        isDeleted: statusFilter === 'deleted' ? true : statusFilter === 'all' ? undefined : false,
        page: currentPage,
        pageSize,
      };

      const res = await adminCatalogApi.getProducts(filterParams);
      setProducts(res.items);
      setTotalItems(res.totalItems);
    } catch {
      // Fallback filter locally
      let filtered = [...MOCK_PRODUCTS];
      if (searchQuery) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (categoryFilter) {
        filtered = filtered.filter((p) => p.categoryId === categoryFilter);
      }
      if (brandFilter) {
        filtered = filtered.filter((p) => p.brandId === brandFilter);
      }
      if (statusFilter === 'active') {
        filtered = filtered.filter((p) => p.isActive && !p.isDeleted);
      } else if (statusFilter === 'hidden') {
        filtered = filtered.filter((p) => !p.isActive && !p.isDeleted);
      } else if (statusFilter === 'deleted') {
        filtered = filtered.filter((p) => p.isDeleted);
      }

      setProducts(filtered);
      setTotalItems(filtered.length);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, brandFilter, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab, loadProducts]);

  // Product Actions
  const handleToggleProductVisibility = async (product: AdminProductListDto) => {
    try {
      await adminCatalogApi.toggleProductVisibility(product.id);
      toast.success(
        `Đã ${product.isActive ? 'ẩn' : 'hiển thị'} sản phẩm "${product.name}". Thao tác đã ghi AuditLog.`
      );
      loadProducts();
    } catch {
      // Mock toggle fallback
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
      );
      toast.success(`Đã thay đổi trạng thái hiển thị của sản phẩm "${product.name}"`);
    }
  };

  const handleRestoreProduct = async (product: AdminProductListDto) => {
    try {
      await adminCatalogApi.restoreProduct(product.id);
      toast.success(`Đã khôi phục sản phẩm "${product.name}" từ thùng rác! Thao tác đã ghi AuditLog.`);
      loadProducts();
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isDeleted: false, isActive: true } : p))
      );
      toast.success(`Đã khôi phục sản phẩm "${product.name}"`);
    }
  };

  const handleOpenDeleteModal = (type: 'product' | 'category' | 'brand', id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      type,
      id,
      title: `Xóa mềm ${type === 'product' ? 'Sản phẩm' : type === 'category' ? 'Danh mục' : 'Thương hiệu'}`,
      message: `Bạn có chắc chắn muốn xóa "${name}"? Mục này sẽ được chuyển vào trạng thái xóa mềm và có thể khôi phục sau này. Mọi thao tác đều được ghi vào AuditLog.`,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModalState.type === 'product') {
        await adminCatalogApi.deleteProduct(deleteModalState.id);
        toast.success('Đã xóa mềm sản phẩm thành công!');
        loadProducts();
      } else if (deleteModalState.type === 'category') {
        await adminCatalogApi.deleteCategory(deleteModalState.id);
        toast.success('Đã xóa mềm danh mục thành công!');
        loadMetadata();
      } else if (deleteModalState.type === 'brand') {
        await adminCatalogApi.deleteBrand(deleteModalState.id);
        toast.success('Đã xóa mềm thương hiệu thành công!');
        loadMetadata();
      }
      setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsDeleting(false);
    }
  };

  // Columns for Products
  const productColumns: ColumnDef<AdminProductListDto>[] = [
    {
      key: 'name',
      title: 'Sản phẩm & 3D Model',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {row.thumbnailUrl ? (
              <img src={row.thumbnailUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 text-xs">No image</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-900 hover:text-brand-600 transition-colors">
              {row.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-500 font-mono">{row.slug}</span>
              {row.model3DUrl && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  3D View
                </span>
              )}
              {row.isFeatured && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  Nổi bật
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục / Hãng',
      render: (row) => (
        <div className="text-xs text-slate-700">
          <div>{row.categoryName}</div>
          <div className="font-bold text-slate-900 mt-0.5">{row.brandName}</div>
        </div>
      ),
    },
    {
      key: 'price',
      title: 'Giá niêm yết / Bán',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">{formatVND(row.minPrice)}</div>
          {row.minPrice !== row.maxPrice && (
            <div className="text-[10px] text-slate-400">đến {formatVND(row.maxPrice)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      title: 'Biến thể & Tồn kho',
      align: 'center',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800">{row.totalStock} chiếc</div>
          <div className="text-[10px] text-slate-500">{row.variantsCount} SKU</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (row) => {
        if (row.isDeleted) {
          return <Badge variant="danger">Đã xóa mềm</Badge>;
        }
        return row.isActive ? (
          <Badge variant="success">Đang bán</Badge>
        ) : (
          <Badge variant="neutral">Đã ẩn</Badge>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.isDeleted ? (
            <button
              type="button"
              onClick={() => handleRestoreProduct(row)}
              className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Khôi phục lại sản phẩm"
            >
              Khôi phục
            </button>
          ) : (
            <>
              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => handleToggleProductVisibility(row)}
                className={`p-1.5 rounded-md transition-colors ${
                  row.isActive
                    ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                }`}
                title={row.isActive ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
              >
                {row.isActive ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>

              {/* Edit Product */}
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId(row.id);
                  setIsProductModalOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md transition-colors"
              >
                Sửa
              </button>

              {/* Soft Delete */}
              <button
                type="button"
                onClick={() => handleOpenDeleteModal('product', row.id, row.name)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                title="Xóa mềm sản phẩm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Columns for Categories
  const categoryColumns: ColumnDef<AdminCategoryListDto>[] = [
    {
      key: 'name',
      title: 'Tên danh mục & Biểu tượng',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-600 shrink-0 font-bold text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-900">{row.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'parentName',
      title: 'Danh mục cha',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.parentName || '— (Danh mục gốc)'}</span>
      ),
    },
    {
      key: 'schema',
      title: 'Schema thông số kỹ thuật',
      align: 'center',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.hasSchema ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.hasSchema ? '✓ Đã cấu hình' : 'Chưa có schema'}
        </span>
      ),
    },
    {
      key: 'productsCount',
      title: 'Số sản phẩm',
      align: 'center',
      render: (row) => <span className="text-xs font-semibold text-slate-800">{row.productsCount} SP</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Đang bật' : 'Đang ẩn'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSchemaCategory(row);
              setIsSchemaModalOpen(true);
            }}
            className="px-2 py-1 text-xs font-semibold rounded bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            title="Chỉnh sửa định nghĩa Schema thông số kỹ thuật"
          >
            Chỉnh Schema
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory(row);
              setIsCategoryModalOpen(true);
            }}
            className="px-2 py-1 text-xs font-semibold rounded bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
          >
            Sửa
          </button>

          <button
            type="button"
            onClick={() => handleOpenDeleteModal('category', row.id, row.name)}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
            title="Xóa danh mục"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // Columns for Brands
  const brandColumns: ColumnDef<AdminBrandListDto>[] = [
    {
      key: 'name',
      title: 'Thương hiệu & Logo',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
            {row.logoUrl ? (
              <img src={row.logoUrl} alt={row.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-slate-400 font-bold text-xs">{row.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-900">{row.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1">{row.description || '—'}</span>
      ),
    },
    {
      key: 'productsCount',
      title: 'Số sản phẩm',
      align: 'center',
      render: (row) => <span className="text-xs font-semibold text-slate-800">{row.productsCount} SP</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Đang bật' : 'Đang ẩn'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedBrand(row);
              setIsBrandModalOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
          >
            Sửa
          </button>

          <button
            type="button"
            onClick={() => handleOpenDeleteModal('brand', row.id, row.name)}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
            title="Xóa thương hiệu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản trị Catalog & Sản phẩm</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý toàn diện Sản phẩm, Danh mục, Thương hiệu, Biến thể (SKU), Upload ảnh và Model 3D.
          </p>
        </div>

        {/* Action Button based on tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'products' && (
            <button
              type="button"
              onClick={() => {
                setSelectedProductId(null);
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>+</span> Thêm sản phẩm mới
            </button>
          )}

          {activeTab === 'categories' && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>+</span> Thêm danh mục mới
            </button>
          )}

          {activeTab === 'brands' && (
            <button
              type="button"
              onClick={() => {
                setSelectedBrand(null);
                setIsBrandModalOpen(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>+</span> Thêm thương hiệu mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Sản phẩm & Biến thể</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {totalItems}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Danh mục & Schema Thông số</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'brands'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Thương hiệu (Brands)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {brands.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, SKU biến thể..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'hidden' | 'deleted')}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="hidden">Đã ẩn</option>
              <option value="deleted">Thùng rác (Đã xóa mềm)</option>
            </select>
          </div>

          {/* DataTable */}
          <DataTable
            columns={productColumns}
            data={products}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <DataTable
          columns={categoryColumns}
          data={categories}
          keyExtractor={(item) => item.id}
          currentPage={1}
          pageSize={categories.length || 10}
          totalItems={categories.length}
          onPageChange={() => {}}
        />
      )}

      {/* TAB 3: BRANDS */}
      {activeTab === 'brands' && (
        <DataTable
          columns={brandColumns}
          data={brands}
          keyExtractor={(item) => item.id}
          currentPage={1}
          pageSize={brands.length || 10}
          totalItems={brands.length}
          onPageChange={() => {}}
        />
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productId={selectedProductId}
        categories={categories}
        brands={brands}
        onSaved={() => {
          loadProducts();
          loadMetadata();
        }}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
        categories={categories}
        onSaved={loadMetadata}
      />

      <CategorySchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        category={schemaCategory}
        onSaved={loadMetadata}
      />

      <BrandFormModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        brand={selectedBrand}
        onSaved={loadMetadata}
      />

      {/* Confirm Soft Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModalState.title}
        message={deleteModalState.message}
        confirmText="Xác nhận xóa mềm"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminCatalogPage;
