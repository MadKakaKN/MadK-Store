import React, { useState, useRef } from 'react';
import { CreateProductImageRequest, FileUploadResultDto } from '../../../../api/adminCatalogApi';
import { useToast } from '../common/ToastContext';

interface ImageUploaderProps {
  images: CreateProductImageRequest[];
  onChange: (images: CreateProductImageRequest[]) => void;
  onUpload: (file: File) => Promise<FileUploadResultDto>;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  onUpload,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    setIsUploading(true);
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(ext)) {
          toast.error(`Tệp ${file.name} không phải định dạng ảnh được hỗ trợ (.jpg, .png, .webp).`, 'Lỗi định dạng');
          continue;
        }

        if (file.size > maxSizeBytes) {
          toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 5MB.`, 'Lỗi dung lượng');
          continue;
        }

        try {
          const res = await onUpload(file);
          const isFirstImage = newImages.length === 0;
          newImages.push({
            imageUrl: res.url,
            altText: file.name.replace(/\.[^/.]+$/, ''),
            displayOrder: newImages.length,
            isPrimary: isFirstImage,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại';
          toast.error(msg, 'Lỗi tải ảnh');
        }
      }

      onChange(newImages);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    // If the removed image was primary and there are remaining images, make the first one primary
    if (images[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleAltTextChange = (index: number, alt: string) => {
    const updated = [...images];
    updated[index].altText = alt;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-brand-500 bg-brand-50/50'
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/60'
        } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-brand-600">Đang nén, tối ưu hóa và tải ảnh lên server...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Kéo thả ảnh vào đây hoặc <span className="text-brand-600 underline">duyệt từ máy tính</span>
              </div>
              <p className="text-xs text-slate-400">
                Hỗ trợ JPG, PNG, WebP (Tối đa 5MB/ảnh). Ảnh được tự động resize và nén WebP chuẩn e-commerce.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative rounded-lg border bg-white overflow-hidden shadow-xs transition-all ${
                img.isPrimary ? 'ring-2 ring-brand-500 border-brand-500' : 'border-slate-200'
              }`}
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img
                  src={img.imageUrl}
                  alt={img.altText || `Product Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {img.isPrimary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-md shadow-xs">
                    Ảnh đại diện
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-2 space-y-1.5">
                <input
                  type="text"
                  placeholder="Mô tả ảnh (Alt text)..."
                  value={img.altText || ''}
                  onChange={(e) => handleAltTextChange(idx, e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded-md border border-slate-200 focus:outline-hidden focus:border-brand-500"
                />

                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="w-full text-[11px] font-semibold text-brand-700 hover:bg-brand-50 py-1 rounded transition-colors"
                  >
                    Đặt làm ảnh đại diện
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
