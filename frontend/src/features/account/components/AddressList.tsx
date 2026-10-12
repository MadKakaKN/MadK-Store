import React, { useState, useEffect } from 'react';
import { addressApi } from '../../../api/addressApi';
import { AddressModal } from './AddressModal';
import type { AddressDto } from '../../../types/address';

interface AddressListProps {
  userId?: string;
}

export const AddressList: React.FC<AddressListProps> = ({ userId }) => {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await addressApi.getMyAddresses(userId);
      setAddresses(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách địa chỉ.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (address: AddressDto) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (addressId: string) => {
    setIsProcessing(true);
    setActionSuccess(null);
    try {
      await addressApi.setDefaultAddress(addressId, userId);
      setActionSuccess('Đã cập nhật địa chỉ mặc định thành công.');
      await fetchAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đặt địa chỉ mặc định.';
      setError(msg);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleDelete = async (addressId: string) => {
    setIsProcessing(true);
    setActionSuccess(null);
    try {
      await addressApi.deleteAddress(addressId, userId);
      setDeletingId(null);
      setActionSuccess('Đã xóa địa chỉ thành công.');
      await fetchAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa địa chỉ.';
      setError(msg);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Sổ địa chỉ nhận hàng</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {addresses.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý địa chỉ giao hàng của bạn chuẩn theo phân cấp hành chính Việt Nam (Tỉnh/Thành, Quận/Huyện, Phường/Xã)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 transition-all shrink-0 cursor-pointer"
        >
          <span className="text-base font-bold">+</span>
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      {/* Action Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <span>✅</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-50 rounded-3xl p-10 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white shadow-xs text-slate-400 flex items-center justify-center text-3xl mb-3">
            📍
          </div>
          <h3 className="text-base font-bold text-slate-800">Bạn chưa có địa chỉ nhận hàng nào</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Thêm địa chỉ ngay để quá trình đặt hàng công nghệ tại MadK Store diễn ra nhanh chóng và chính xác.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors inline-flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Thêm địa chỉ đầu tiên</span>
          </button>
        </div>
      ) : (
        /* Address Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between ${
                address.isDefault
                  ? 'border-brand-500/80 bg-brand-50/15 shadow-sm ring-2 ring-brand-500/10'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">{address.recipientName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm font-medium text-slate-600">{address.phoneNumber}</span>
                  </div>

                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Mặc định
                    </span>
                  )}
                </div>

                {/* Full Address Details */}
                <div className="mt-3.5 space-y-1">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {address.detailedAddress}
                  </p>
                  <p className="text-xs text-slate-500 leading-normal">
                    {address.wardName}, {address.districtName}, {address.provinceName}
                  </p>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100/90 flex items-center justify-between gap-2 flex-wrap text-xs font-semibold">
                <div>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleSetDefault(address.id)}
                      className="text-slate-600 hover:text-brand-600 font-bold transition-colors disabled:opacity-50 hover:underline cursor-pointer"
                    >
                      Đặt làm mặc định
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium">Địa chỉ nhận hàng chính</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleOpenEditModal(address)}
                    className="text-brand-600 hover:text-brand-700 font-bold hover:underline cursor-pointer"
                  >
                    Chỉnh sửa
                  </button>

                  <span className="text-slate-200">|</span>

                  {deletingId === address.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-rose-600 font-bold">Xác nhận xóa?</span>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleDelete(address.id)}
                        className="text-rose-700 font-black hover:underline cursor-pointer"
                      >
                        Có
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Không
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setDeletingId(address.id)}
                      className="text-rose-500 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Add / Edit Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAddresses}
        initialData={editingAddress}
        userId={userId}
      />
    </div>
  );
};
