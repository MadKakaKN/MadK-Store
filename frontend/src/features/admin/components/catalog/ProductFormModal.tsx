import React, { useState, useEffect } from 'react';
import {
  AdminCategoryListDto,
  AdminBrandListDto,
  AdminProductDetailDto,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductVariantRequest,
  CreateProductImageRequest,
  adminCatalogApi,
} from '../../../../api/adminCatalogApi';
import { FormField, AdminInput, AdminSelect, AdminTextarea, AdminToggle, AdminButton } from '../common/AdminForm';
import { ImageUploader } from './ImageUploader';
import { useToast } from '../common/ToastContext';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string | null;
  categories: AdminCategoryListDto[];
  brands: AdminBrandListDto[];
  onSaved: () => void;
}

type ModalTab = 'general' | 'specs' | 'media' | 'variants';

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productId,
  categories,
  brands,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Specifications
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [rawSpecsJson, setRawSpecsJson] = useState('{}');
  const [categorySchema, setCategorySchema] = useState<Record<string, { title?: string; enum?: string[] }>>({});
  const [useRawSpecs, setUseRawSpecs] = useState(false);

  // Media
  const [images, setImages] = useState<CreateProductImageRequest[]>([]);
  const [model3DUrl, setModel3DUrl] = useState('');
  const [isUploadingModel, setIsUploadingModel] = useState(false);

  // Variants
  const [variants, setVariants] = useState<CreateProductVariantRequest[]>([
    {
      sku: '',
      name: '',
      attributes: '{}',
      originalPrice: 0,
      salePrice: 0,
      stockQuantity: 20,
      isActive: true,
    },
  ]);

  const toast = useToast();

  // Reset or load product
  useEffect(() => {
    if (!isOpen) return;

    if (productId) {
      setIsLoading(true);
      adminCatalogApi
        .getProductById(productId)
        .then((product: AdminProductDetailDto) => {
          setName(product.name);
          setSlug(product.slug);
          setCategoryId(product.categoryId);
          setBrandId(product.brandId);
          setBasePrice(product.basePrice);
          setShortDescription(product.shortDescription || '');
          setDescription(product.description || '');
          setIsFeatured(product.isFeatured);
          setIsActive(product.isActive);
          setModel3DUrl(product.model3DUrl || '');

          // Images
          setImages(
            product.images.map((img) => ({
              variantId: img.variantId,
              imageUrl: img.imageUrl,
              altText: img.altText || '',
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
            }))
          );

          // Variants
          setVariants(
            product.variants.map((v) => ({
              sku: v.sku,
              name: v.name,
              attributes: v.attributes,
              originalPrice: v.originalPrice,
              salePrice: v.salePrice,
              stockQuantity: v.stockQuantity,
              isActive: v.isActive,
            }))
          );

          // Specs
          try {
            const parsed = JSON.parse(product.specifications || '{}');
            setSpecValues(parsed);
            setRawSpecsJson(JSON.stringify(parsed, null, 2));
          } catch {
            setRawSpecsJson(product.specifications || '{}');
          }
        })
        .catch((err) => {
          toast.error(err.message || 'Không thể tải chi tiết sản phẩm', 'Lỗi');
        })
        .finally(() => setIsLoading(false));
    } else {
      // Create mode default
      setName('');
      setSlug('');
      setCategoryId(categories[0]?.id || '');
      setBrandId(brands[0]?.id || '');
      setBasePrice(10000000);
      setShortDescription('');
      setDescription('');
      setIsFeatured(false);
      setIsActive(true);
      setSpecValues({});
      setRawSpecsJson('{}');
      setImages([]);
      setModel3DUrl('');
      setVariants([
        {
          sku: '',
          name: '',
          attributes: '{}',
          originalPrice: 10000000,
          salePrice: 10000000,
          stockQuantity: 25,
          isActive: true,
        },
      ]);
    }
  }, [isOpen, productId, categories, brands, toast]);

  // Load category schema whenever category changes
  useEffect(() => {
    if (!categoryId) {
      setCategorySchema({});
      return;
    }

    adminCatalogApi
      .getCategoryById(categoryId)
      .then((cat) => {
        if (cat.schemaDefinition) {
          try {
            const schemaDoc = JSON.parse(cat.schemaDefinition);
            if (schemaDoc.properties) {
              setCategorySchema(schemaDoc.properties);
              return;
            }
          } catch {
            // Ignore parse error
          }
        }
        setCategorySchema({});
      })
      .catch(() => setCategorySchema({}));
  }, [categoryId]);

  const generateSlugFromName = (val: string) => {
    setName(val);
    if (!productId) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generated);
    }
  };

  const handleSpecChange = (key: string, value: string) => {
    const updated = { ...specValues, [key]: value };
    setSpecValues(updated);
    setRawSpecsJson(JSON.stringify(updated, null, 2));
  };

  const handleUploadImage = async (file: File) => {
    return await adminCatalogApi.uploadImage(file, 'products');
  };

  const handleUploadModel3D = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.glb' && ext !== '.gltf') {
      toast.error('Chỉ hỗ trợ file model 3D định dạng .glb hoặc .gltf', 'Định dạng sai');
      return;
    }

    setIsUploadingModel(true);
    try {
      const res = await adminCatalogApi.uploadModel3D(file);
      setModel3DUrl(res.url);
      toast.success('Đã tải lên model 3D thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên 3D model thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsUploadingModel(false);
      e.target.value = '';
    }
  };

  const handleAddVariant = () => {
    const autoSku = slug ? `${slug.toUpperCase().slice(0, 8)}-V${variants.length + 1}` : `SKU-V${variants.length + 1}`;
    setVariants([
      ...variants,
      {
        sku: autoSku,
        name: name ? `${name} - Biến thể ${variants.length + 1}` : `Biến thể ${variants.length + 1}`,
        attributes: '{}',
        originalPrice: basePrice,
        salePrice: basePrice,
        stockQuantity: 10,
        isActive: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.warning('Sản phẩm phải có tối thiểu 1 biến thể.');
      return;
    }
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: keyof CreateProductVariantRequest, value: unknown) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên sản phẩm.');
      setActiveTab('general');
      return;
    }

    if (!categoryId) {
      toast.warning('Vui lòng chọn danh mục cho sản phẩm.');
      setActiveTab('general');
      return;
    }

    if (!brandId) {
      toast.warning('Vui lòng chọn thương hiệu cho sản phẩm.');
      setActiveTab('general');
      return;
    }

    if (basePrice <= 0) {
      toast.warning('Giá cơ bản của sản phẩm phải lớn hơn 0.');
      setActiveTab('general');
      return;
    }

    // Prepare specifications JSON
    let finalSpecsJson = '{}';
    if (useRawSpecs) {
      try {
        JSON.parse(rawSpecsJson);
        finalSpecsJson = rawSpecsJson;
      } catch {
        toast.error('JSON thông số kỹ thuật không hợp lệ.', 'Lỗi cú pháp');
        setActiveTab('specs');
        return;
      }
    } else {
      finalSpecsJson = JSON.stringify(specValues);
    }

    // Validate Variants
    if (!variants || variants.length === 0) {
      toast.warning('Sản phẩm phải có ít nhất 1 biến thể SKU.');
      setActiveTab('variants');
      return;
    }

    for (const v of variants) {
      if (!v.sku.trim()) {
        toast.warning('Tất cả các biến thể phải có mã SKU.');
        setActiveTab('variants');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const primaryImage = images.find((i) => i.isPrimary) || images[0];

      if (productId) {
        // Update product
        const updatePayload: UpdateProductRequest = {
          name: name.trim(),
          slug: slug.trim(),
          categoryId,
          brandId,
          shortDescription,
          description,
          basePrice,
          specifications: finalSpecsJson,
          model3DUrl: model3DUrl.trim() || undefined,
          thumbnailUrl: primaryImage?.imageUrl || undefined,
          isFeatured,
          isActive,
        };

        await adminCatalogApi.updateProduct(productId, updatePayload);
        toast.success(`Cập nhật sản phẩm "${name}" thành công! Thao tác đã ghi AuditLog.`, 'Thành công');
      } else {
        // Create product
        const createPayload: CreateProductRequest = {
          name: name.trim(),
          slug: slug.trim(),
          categoryId,
          brandId,
          shortDescription,
          description,
          basePrice,
          specifications: finalSpecsJson,
          model3DUrl: model3DUrl.trim() || undefined,
          thumbnailUrl: primaryImage?.imageUrl || undefined,
          isFeatured,
          isActive,
          variants,
          images,
        };

        await adminCatalogApi.createProduct(createPayload);
        toast.success(`Tạo mới sản phẩm "${name}" thành công! Thao tác đã ghi AuditLog.`, 'Thành công');
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu sản phẩm thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {productId ? 'Chỉnh sửa Sản phẩm' : 'Thêm mới Sản phẩm'}
            </h2>
            <p className="text-xs text-slate-500">
              {productId ? `ID: ${productId}` : 'Điền đầy đủ thông tin, thông số kỹ thuật, hình ảnh và biến thể'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 bg-white text-xs font-semibold">
          {[
            { id: 'general', label: '1. Thông tin chung' },
            { id: 'specs', label: '2. Thông số kỹ thuật' },
            { id: 'media', label: `3. Hình ảnh & Model 3D (${images.length})` },
            { id: 'variants', label: `4. Biến thể (${variants.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ModalTab)}
              className={`py-3.5 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải thông tin sản phẩm...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: General */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Tên sản phẩm" required>
                      <AdminInput
                        placeholder="Ví dụ: MacBook Pro 14 M4 Pro..."
                        value={name}
                        onChange={(e) => generateSlugFromName(e.target.value)}
                        required
                      />
                    </FormField>

                    <FormField label="Đường dẫn (Slug URL)" required helperText="Tự động sinh hoặc tùy chỉnh">
                      <AdminInput
                        placeholder="macbook-pro-14-m4-pro"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Danh mục" required>
                      <AdminSelect
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </AdminSelect>
                    </FormField>

                    <FormField label="Thương hiệu" required>
                      <AdminSelect
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        required
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </AdminSelect>
                    </FormField>

                    <FormField label="Giá cơ bản (VNĐ)" required>
                      <AdminInput
                        type="number"
                        step="10000"
                        min="0"
                        value={basePrice}
                        onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </FormField>
                  </div>

                  <FormField label="Mô tả ngắn">
                    <AdminInput
                      placeholder="Tóm tắt ngắn gọn các điểm nổi bật của sản phẩm..."
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Mô tả chi tiết">
                    <AdminTextarea
                      rows={5}
                      placeholder="Chi tiết cấu hình, tính năng, phụ kiện đi kèm..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <AdminToggle
                      label="Sản phẩm nổi bật (Featured)"
                      description="Hiển thị trên banner trang chủ hoặc danh sách nổi bật"
                      checked={isFeatured}
                      onChange={setIsFeatured}
                    />

                    <AdminToggle
                      label="Hiển thị sản phẩm (Active)"
                      description="Bật để cho phép khách hàng nhìn thấy và đặt mua"
                      checked={isActive}
                      onChange={setIsActive}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Specifications */}
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Thông số kỹ thuật động theo danh mục
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {Object.keys(categorySchema).length > 0
                          ? `Đã nạp ${Object.keys(categorySchema).length} thông số định nghĩa từ schema của danh mục.`
                          : 'Danh mục này chưa có schema thông số riêng. Bạn có thể nhập JSON tùy ý.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUseRawSpecs(!useRawSpecs)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      {useRawSpecs ? 'Chuyển sang Form trực quan' : 'Chỉnh sửa mã JSON thô'}
                    </button>
                  </div>

                  {useRawSpecs ? (
                    <div>
                      <textarea
                        rows={10}
                        value={rawSpecsJson}
                        onChange={(e) => setRawSpecsJson(e.target.value)}
                        className="w-full font-mono text-xs p-3 rounded-lg border bg-slate-900 text-emerald-400 focus:outline-hidden"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.keys(categorySchema).length > 0 ? (
                        Object.entries(categorySchema).map(([propKey, propDef]) => (
                          <FormField key={propKey} label={propDef.title || propKey}>
                            {propDef.enum && propDef.enum.length > 0 ? (
                              <AdminSelect
                                value={specValues[propKey] || ''}
                                onChange={(e) => handleSpecChange(propKey, e.target.value)}
                              >
                                <option value="">-- Chọn {propDef.title || propKey} --</option>
                                {propDef.enum.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </AdminSelect>
                            ) : (
                              <AdminInput
                                placeholder={`Nhập ${propDef.title || propKey}...`}
                                value={specValues[propKey] || ''}
                                onChange={(e) => handleSpecChange(propKey, e.target.value)}
                              />
                            )}
                          </FormField>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-slate-400 text-xs">
                          Chưa có thông số định sẵn. Chuyển sang chế độ "Chỉnh sửa mã JSON thô" để nhập thông số.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Media & 3D Model */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  {/* Images */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Album ảnh sản phẩm</h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Tải lên các góc chụp chi tiết. Ảnh đầu tiên hoặc ảnh được đánh dấu sẽ làm ảnh đại diện (Thumbnail).
                    </p>
                    <ImageUploader
                      images={images}
                      onChange={setImages}
                      onUpload={handleUploadImage}
                    />
                  </div>

                  {/* 3D Model */}
                  <div className="border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                            3D Interactive
                          </span>
                          Tích hợp Model 3D (.glb / .gltf)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Sản phẩm có model 3D sẽ kích hoạt chế độ xoay 360 độ chân thực trên storefront.
                        </p>
                      </div>

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          className="hidden"
                          onChange={handleUploadModel3D}
                          disabled={isUploadingModel}
                        />
                        <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors">
                          {isUploadingModel ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            'Tải file .glb / .gltf'
                          )}
                        </span>
                      </label>
                    </div>

                    <AdminInput
                      placeholder="Hoặc dán URL file 3D (.glb)..."
                      value={model3DUrl}
                      onChange={(e) => setModel3DUrl(e.target.value)}
                    />

                    {model3DUrl && (
                      <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200 flex items-center justify-between">
                        <span className="truncate">URL 3D Model: <strong className="font-mono">{model3DUrl}</strong></span>
                        <button
                          type="button"
                          onClick={() => setModel3DUrl('')}
                          className="text-rose-600 hover:underline shrink-0 ml-2 font-semibold"
                        >
                          Gỡ bỏ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Variants */}
              {activeTab === 'variants' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Danh sách biến thể sản phẩm (SKU)</h4>
                      <p className="text-[11px] text-slate-500">
                        Quản lý các phiên bản cấu hình, màu sắc, giá bán và số lượng tồn kho khởi tạo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      + Thêm biến thể
                    </button>
                  </div>

                  <div className="space-y-3">
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Biến thể #{idx + 1}</span>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
                            >
                              Xóa biến thể này
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <FormField label="Mã SKU" required>
                            <AdminInput
                              placeholder="IP16PM-256-DESERT"
                              value={v.sku}
                              onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                              required
                            />
                          </FormField>

                          <FormField label="Tên biến thể" required>
                            <AdminInput
                              placeholder="iPhone 16 Pro Max 256GB Desert"
                              value={v.name}
                              onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                              required
                            />
                          </FormField>

                          <FormField label="Tồn kho khởi tạo">
                            <AdminInput
                              type="number"
                              min="0"
                              value={v.stockQuantity}
                              onChange={(e) =>
                                handleVariantChange(idx, 'stockQuantity', parseInt(e.target.value) || 0)
                              }
                            />
                          </FormField>

                          <FormField label="Giá niêm yết (Gốc)" required>
                            <AdminInput
                              type="number"
                              step="10000"
                              value={v.originalPrice}
                              onChange={(e) =>
                                handleVariantChange(idx, 'originalPrice', parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormField>

                          <FormField label="Giá bán thực tế" required>
                            <AdminInput
                              type="number"
                              step="10000"
                              value={v.salePrice}
                              onChange={(e) =>
                                handleVariantChange(idx, 'salePrice', parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormField>

                          <FormField label="Thuộc tính (JSON)">
                            <AdminInput
                              placeholder='{"color":"Desert","storage":"256GB"}'
                              value={v.attributes}
                              onChange={(e) => handleVariantChange(idx, 'attributes', e.target.value)}
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between bg-white">
            <div className="text-xs text-slate-400">
              Mọi thay đổi dữ liệu sẽ được ghi vết tự động vào hệ thống AuditLog.
            </div>

            <div className="flex items-center gap-2">
              <AdminButton type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy bỏ
              </AdminButton>
              <AdminButton type="submit" variant="primary" isLoading={isSubmitting}>
                {productId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </AdminButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
