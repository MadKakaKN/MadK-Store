import React, { useState, useEffect } from 'react';
import ConfirmModal from '../common/ConfirmModal';
import { FormField, AdminInput, AdminTextarea, AdminToggle } from '../common/AdminForm';
import {
  AdminBrandListDto,
  CreateBrandRequest,
  UpdateBrandRequest,
  adminCatalogApi,
} from '../../../../api/adminCatalogApi';
import { useToast } from '../common/ToastContext';

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: AdminBrandListDto | null;
  onSaved: () => void;
}

export const BrandFormModal: React.FC<BrandFormModalProps> = ({
  isOpen,
  onClose,
  brand,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  const toast = useToast();

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setSlug(brand.slug);
      setLogoUrl(brand.logoUrl || '');
      setDescription(brand.description || '');
      setIsActive(brand.isActive);
    } else {
      setName('');
      setSlug('');
      setLogoUrl('');
      setDescription('');
      setIsActive(true);
    }
  }, [brand, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!brand) {
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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const res = await adminCatalogApi.uploadImage(file, 'brands');
      setLogoUrl(res.url);
      toast.success('Đã tải lên logo thương hiệu!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải logo thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      toast.warning('Tên thương hiệu không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (brand) {
        const updatePayload: UpdateBrandRequest = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          description: description.trim() || undefined,
          isActive,
        };
        await adminCatalogApi.updateBrand(brand.id, updatePayload);
        toast.success(`Cập nhật thương hiệu "${name}" thành công! Thao tác đã ghi AuditLog.`);
      } else {
        const createPayload: CreateBrandRequest = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          description: description.trim() || undefined,
          isActive,
        };
        await adminCatalogApi.createBrand(createPayload);
        toast.success(`Tạo mới thương hiệu "${name}" thành công! Thao tác đã ghi AuditLog.`);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu thương hiệu thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={brand ? 'Chỉnh sửa Thương hiệu' : 'Thêm mới Thương hiệu'}
      confirmText={brand ? 'Lưu thay đổi' : 'Tạo thương hiệu'}
      isLoading={isSubmitting}
      message={
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tên thương hiệu" required>
              <AdminInput
                placeholder="Ví dụ: Apple, Sony, ASUS..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Đường dẫn (Slug URL)">
              <AdminInput
                placeholder="apple"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-800">Logo thương hiệu</label>
              <label className="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleUploadLogo}
                  disabled={isUploadingLogo}
                />
                {isUploadingLogo ? 'Đang tải lên...' : 'Tải logo từ máy tính'}
              </label>
            </div>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <AdminInput
                placeholder="URL hình ảnh logo..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <FormField label="Mô tả thương hiệu">
            <AdminTextarea
              rows={3}
              placeholder="Giới thiệu về hãng sản xuất, nguồn gốc, xuất xứ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <AdminToggle
            label="Kích hoạt hiển thị"
            description="Cho phép hiển thị thương hiệu này trong các bộ lọc sản phẩm"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>
      }
    />
  );
};

export default BrandFormModal;
