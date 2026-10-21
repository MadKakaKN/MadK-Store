import React, { useState, useEffect } from 'react';
import ConfirmModal from '../common/ConfirmModal';
import { AdminCategoryListDto, adminCatalogApi } from '../../../../api/adminCatalogApi';
import { useToast } from '../common/ToastContext';

interface CategorySchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AdminCategoryListDto | null;
  onSaved: () => void;
}

const PRESET_TEMPLATES: Record<string, { label: string; schema: object }> = {
  laptop: {
    label: 'Laptop / Máy tính xách tay',
    schema: {
      type: 'object',
      properties: {
        cpu: {
          type: 'string',
          title: 'Vi xử lý (CPU)',
          enum: ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Apple M3 Pro', 'Apple M4 Pro', 'AMD Ryzen 7'],
        },
        ram: {
          type: 'string',
          title: 'Dung lượng RAM',
          enum: ['16GB', '24GB', '32GB', '64GB'],
        },
        storage: {
          type: 'string',
          title: 'Ổ cứng lưu trữ',
          enum: ['512GB SSD', '1TB SSD', '2TB SSD'],
        },
        screen_size: {
          type: 'string',
          title: 'Kích thước màn hình',
          enum: ['13.3 inch', '14.2 inch', '15.6 inch', '16.0 inch'],
        },
        refresh_rate: {
          type: 'string',
          title: 'Tần số quét',
          enum: ['60Hz', '120Hz Promotion', '144Hz', '240Hz'],
        },
      },
      required: ['cpu', 'ram', 'storage'],
    },
  },
  phone: {
    label: 'Điện thoại thông minh',
    schema: {
      type: 'object',
      properties: {
        chip: {
          type: 'string',
          title: 'Chipset (SoC)',
          enum: ['Apple A18 Pro', 'Snapdragon 8 Gen 3', 'MediaTek Dimensity 9300+'],
        },
        screen_type: {
          type: 'string',
          title: 'Công nghệ màn hình',
          enum: ['Super Retina XDR OLED', 'Dynamic AMOLED 2X', 'LTPO OLED'],
        },
        battery: {
          type: 'string',
          title: 'Dung lượng pin',
          enum: ['4000mAh', '4500mAh', '5000mAh', '5400mAh'],
        },
        charging: {
          type: 'string',
          title: 'Công suất sạc',
          enum: ['25W', '45W', '67W', '100W'],
        },
      },
      required: ['chip', 'screen_type'],
    },
  },
  keyboard: {
    label: 'Bàn phím cơ Custom',
    schema: {
      type: 'object',
      properties: {
        layout: {
          type: 'string',
          title: 'Bố cục (Layout)',
          enum: ['60%', '65%', '75%', 'TKL (80%)', 'Fullsize (100%)'],
        },
        switch_type: {
          type: 'string',
          title: 'Loại Switch',
          enum: ['Linear', 'Tactile', 'Clicky', 'Silent'],
        },
        connection: {
          type: 'string',
          title: 'Phương thức kết nối',
          enum: ['Type-C có dây', 'Tri-mode (Bluetooth 5.1, 2.4GHz, Dây)', 'Bluetooth 5.0'],
        },
        hotswap: {
          type: 'string',
          title: 'Tính năng Hotswap',
          enum: ['Hotswap 5-pin', 'Không hỗ trợ'],
        },
      },
      required: ['layout', 'switch_type', 'connection'],
    },
  },
  audio: {
    label: 'Tai nghe & Âm thanh',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          title: 'Kiểu tai nghe',
          enum: ['Over-ear', 'In-ear True Wireless', 'On-ear'],
        },
        anc: {
          type: 'string',
          title: 'Chống ồn chủ động (ANC)',
          enum: ['Có (ANC chủ động)', 'Không'],
        },
        battery_life: {
          type: 'string',
          title: 'Thời lượng pin',
          enum: ['Lên tới 24 giờ', 'Lên tới 30 giờ', 'Lên tới 40 giờ'],
        },
      },
      required: ['type'],
    },
  },
};

export const CategorySchemaModal: React.FC<CategorySchemaModalProps> = ({
  isOpen,
  onClose,
  category,
  onSaved,
}) => {
  const [jsonContent, setJsonContent] = useState<string>('{}');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (category) {
      // Fetch full category detail to get schema
      adminCatalogApi
        .getCategoryById(category.id)
        .then((detail) => {
          if (detail.schemaDefinition) {
            try {
              const formatted = JSON.stringify(JSON.parse(detail.schemaDefinition), null, 2);
              setJsonContent(formatted);
            } catch {
              setJsonContent(detail.schemaDefinition);
            }
          } else {
            setJsonContent(JSON.stringify(PRESET_TEMPLATES.laptop.schema, null, 2));
          }
          setParseError(null);
        })
        .catch(() => {
          setJsonContent(JSON.stringify(PRESET_TEMPLATES.laptop.schema, null, 2));
        });
    }
  }, [category]);

  const handleApplyPreset = (presetKey: string) => {
    const template = PRESET_TEMPLATES[presetKey];
    if (template) {
      setJsonContent(JSON.stringify(template.schema, null, 2));
      setParseError(null);
      toast.info(`Đã áp dụng mẫu thông số kỹ thuật: ${template.label}`);
    }
  };

  const handleSave = async () => {
    if (!category) return;

    // Validate JSON
    try {
      JSON.parse(jsonContent);
      setParseError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cú pháp JSON không hợp lệ';
      setParseError(msg);
      toast.error('Vui lòng kiểm tra và sửa cú pháp JSON.', 'Lỗi cú pháp');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminCatalogApi.updateCategorySchema(category.id, jsonContent);
      toast.success(
        `Đã cập nhật Schema thông số kỹ thuật cho danh mục "${category.name}". Thao tác đã ghi AuditLog.`,
        'Thành công'
      );
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu schema thất bại';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSave}
      title={`Cấu hình Schema Thông số kỹ thuật: ${category?.name || ''}`}
      confirmText="Lưu Schema"
      isLoading={isSubmitting}
      message={
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-500">
            Schema này xác định các trường thông số (Specifications) hiển thị trên form tạo sản phẩm và bộ lọc tìm kiếm storefront.
          </p>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn mẫu cấu hình nhanh (Presets):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESET_TEMPLATES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* JSON Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">JSON Schema Định nghĩa:</label>
              {parseError && <span className="text-[11px] text-rose-500 font-medium">⚠ Lỗi JSON: {parseError}</span>}
            </div>
            <textarea
              rows={12}
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                try {
                  JSON.parse(e.target.value);
                  setParseError(null);
                } catch {
                  setParseError('Cú pháp JSON chưa đúng');
                }
              }}
              className={`w-full font-mono text-xs p-3 rounded-lg border bg-slate-900 text-emerald-400 focus:outline-hidden focus:ring-2 ${
                parseError ? 'border-rose-400 focus:ring-rose-400/20' : 'border-slate-800 focus:ring-brand-500/20'
              }`}
              spellCheck={false}
            />
          </div>
        </div>
      }
    />
  );
};

export default CategorySchemaModal;
