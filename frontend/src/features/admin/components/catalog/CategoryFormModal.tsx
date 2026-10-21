import React, { useState, useEffect } from 'react';
import ConfirmModal from '../common/ConfirmModal';
import { FormField, AdminInput, AdminSelect, AdminTextarea, AdminToggle } from '../common/AdminForm';
import {
  AdminCategoryListDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  adminCatalogApi,
} from '../../../../api/adminCatalogApi';
import { useToast } from '../common/ToastContext';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AdminCategoryListDto | null;
  categories: AdminCategoryListDto[];
  onSaved: () => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
  categories,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toast = useToast();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setParentId(category.parentId || '');
      setDescription(category.description || '');
      setIconUrl(category.iconUrl || '');
      setDisplayOrder(category.displayOrder);
      setIsActive(category.isActive);
    } else {
      setName('');
      setSlug('');
      setParentId('');
      setDescription('');
      setIconUrl('');
      setDisplayOrder(0);
      setIsActive(true);
    }
  }, [category, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!category) {
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

  const handleConfirm = async () => {
    if (!name.trim()) {
      toast.warning('Tên danh mục không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (category) {
        const updatePayload: UpdateCategoryRequest = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          parentId: parentId || null,
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          displayOrder,
          isActive,
        };
        await adminCatalogApi.updateCategory(category.id, updatePayload);
        toast.success(`Cập nhật danh mục "${name}" thành công! Thao tác đã ghi AuditLog.`);
      } else {
        const createPayload: CreateCategoryRequest = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          parentId: parentId || null,
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          displayOrder,
          isActive,
        };
        await adminCatalogApi.createCategory(createPayload);
        toast.success(`Tạo mới danh mục "${name}" thành công! Thao tác đã ghi AuditLog.`);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu danh mục thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclude current category from parent dropdown to avoid circular references
  const availableParents = categories.filter((c) => !category || c.id !== category.id);

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={category ? 'Chỉnh sửa Danh mục' : 'Thêm mới Danh mục'}
      confirmText={category ? 'Lưu thay đổi' : 'Tạo danh mục'}
      isLoading={isSubmitting}
      message={
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tên danh mục" required>
              <AdminInput
                placeholder="Ví dụ: Bàn phím cơ..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Đường dẫn (Slug URL)">
              <AdminInput
                placeholder="ban-phim-co"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Danh mục cha">
              <AdminSelect value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">-- Không có (Danh mục gốc) --</option>
                {availableParents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </AdminSelect>
            </FormField>

            <FormField label="Thứ tự hiển thị">
              <AdminInput
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </FormField>
          </div>

          <FormField label="URL biểu tượng (Icon)">
            <AdminInput
              placeholder="/icons/keyboard.svg"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
            />
          </FormField>

          <FormField label="Mô tả danh mục">
            <AdminTextarea
              rows={2}
              placeholder="Mô tả tóm tắt danh mục sản phẩm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <AdminToggle
            label="Kích hoạt hiển thị"
            description="Cho phép danh mục xuất hiện trên menu điều hướng"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>
      }
    />
  );
};

export default CategoryFormModal;
