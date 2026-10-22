import React, { useState, useEffect, useCallback } from 'react';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import { FormField, AdminInput } from '../components/common/AdminForm';
import { useToast } from '../components/common/ToastContext';
import { adminCouponApi } from '../../../api/adminCouponApi';
import type { CouponDto, CreateCouponDto, CouponDiscountType } from '../../../types/coupon';
import { formatVND } from '../../../utils/format';

export const AdminDiscountsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [couponToDelete, setCouponToDelete] = useState<CouponDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states for creating voucher
  const [formCode, setFormCode] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDiscountType, setFormDiscountType] = useState<CouponDiscountType>('Percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | undefined>(50000);
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number>(200000);
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formUsageLimit, setFormUsageLimit] = useState<number | undefined>(100);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const toast = useToast();

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminCouponApi.getCoupons({
        page,
        pageSize,
        search: searchQuery.trim() || undefined,
        isActive: activeFilter,
      });

      if (res.isSuccess && res.data) {
        setCoupons(res.data.items);
        setTotalItems(res.data.totalItems);
      } else {
        toast.error(res.error || 'Không thể tải danh sách mã giảm giá.', 'Lỗi tải dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải danh sách voucher.', 'Lỗi');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, activeFilter, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormCode('');
    setFormDescription('');
    setFormDiscountType('Percentage');
    setFormDiscountValue(10);
    setFormMaxDiscount(50000);
    setFormMinOrderAmount(200000);
    setFormStartDate('');
    setFormEndDate('');
    setFormUsageLimit(100);
    setFormIsActive(true);
  };

  const handleCreateCoupon = async () => {
    if (!formCode.trim()) {
      toast.warning('Vui lòng nhập mã voucher.', 'Cảnh báo');
      return;
    }
    if (formDiscountValue <= 0) {
      toast.warning('Mức giảm giá phải lớn hơn 0.', 'Cảnh báo');
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: CreateCouponDto = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: formDiscountValue,
        maxDiscountAmount: formDiscountType === 'Percentage' || formDiscountType === 1 ? formMaxDiscount : undefined,
        minOrderAmount: formMinOrderAmount,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : undefined,
        endDate: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        usageLimit: formUsageLimit || undefined,
        isActive: formIsActive,
      };

      const res = await adminCouponApi.createCoupon(dto);
      if (res.isSuccess) {
        toast.success(`Đã tạo thành công voucher ${dto.code}`, 'Thành công');
        setIsCreateModalOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        toast.error(res.error || 'Không thể tạo mã voucher.', 'Lỗi tạo mới');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu mã giảm giá.';
      toast.error(msg, 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponDto) => {
    try {
      const res = await adminCouponApi.toggleActive(coupon.id);
      if (res.isSuccess) {
        toast.success(
          `Đã ${res.data?.isActive ? 'kích hoạt' : 'vô hiệu hóa'} mã ${coupon.code}`,
          'Cập nhật trạng thái'
        );
        fetchCoupons();
      } else {
        toast.error(res.error || 'Không thể đổi trạng thái.', 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi khi đổi trạng thái voucher.', 'Lỗi');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await adminCouponApi.deleteCoupon(couponToDelete.id);
      if (res.isSuccess) {
        toast.success(res.message || 'Xóa mã voucher thành công.', 'Thành công');
        setIsDeleteModalOpen(false);
        setCouponToDelete(null);
        fetchCoupons();
      } else {
        toast.error(res.error || 'Không thể xóa mã voucher.', 'Lỗi xóa');
      }
    } catch {
      toast.error('Lỗi kết nối khi xóa voucher.', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<CouponDto>[] = [
    {
      key: 'code',
      title: 'Mã Voucher',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md w-fit">
            {row.code}
          </span>
          {row.description && (
            <span className="text-[11px] text-slate-500 mt-1 line-clamp-1">{row.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'discountType',
      title: 'Loại & Mức giảm',
      render: (row) => {
        const isPercentage = row.discountType === 'Percentage' || row.discountType === 1;
        return (
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">
              {isPercentage ? `${row.discountValue}%` : formatVND(row.discountValue)}
            </span>
            <span className="text-[11px] text-slate-500">
              {isPercentage
                ? row.maxDiscountAmount
                  ? `Tối đa ${formatVND(row.maxDiscountAmount)}`
                  : 'Không giới hạn trần'
                : 'Giảm thẳng tiền mặt'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'minOrderAmount',
      title: 'Đơn tối thiểu',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.minOrderAmount > 0 ? formatVND(row.minOrderAmount) : 'Không giới hạn'}
        </span>
      ),
    },
    {
      key: 'usedCount',
      title: 'Lượt sử dụng',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900">
            {row.usedCount} {row.usageLimit ? `/ ${row.usageLimit}` : 'lượt'}
          </span>
          {row.usageLimit && row.usedCount >= row.usageLimit && (
            <span className="block text-[10px] text-rose-500 font-bold">Hết lượt</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (row) => {
        const isExpired = row.endDate && new Date(row.endDate) < new Date();
        if (isExpired) {
          return (
            <Badge variant="danger" dot size="sm">
              Hết hạn
            </Badge>
          );
        }
        return (
          <Badge variant={row.isActive ? 'success' : 'neutral'} dot size="sm">
            {row.isActive ? 'Đang bật' : 'Đang tắt'}
          </Badge>
        );
      },
    },
    {
      key: 'endDate',
      title: 'Hạn dùng',
      render: (row) => {
        if (!row.endDate) return <span className="text-xs text-slate-400">Vô thời hạn</span>;
        const d = new Date(row.endDate);
        return (
          <span className="text-xs text-slate-600">
            {d.toLocaleDateString('vi-VN')} {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleActive(row)}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
              row.isActive
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {row.isActive ? 'Tắt' : 'Bật'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCouponToDelete(row);
              setIsDeleteModalOpen(true);
            }}
            className="px-2 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Mã giảm giá (Coupons & Vouchers)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình mã giảm giá phần trăm hoặc số tiền, kiểm soát lượt dùng, đơn tối thiểu và thời hạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
            onChange={(e) => {
              const val = e.target.value;
              setActiveFilter(val === 'all' ? undefined : val === 'active');
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        keyExtractor={(item) => item.id}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo mã hoặc mô tả voucher..."
        isLoading={isLoading}
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>+</span> Tạo mã mới
          </button>
        }
        currentPage={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Create Voucher Modal */}
      <ConfirmModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateCoupon}
        title="Tạo mã giảm giá mới"
        confirmText="Tạo mã"
        isLoading={isSubmitting}
        message={
          <div className="space-y-3.5 text-left text-xs">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Mã Voucher" required>
                <AdminInput
                  type="text"
                  placeholder="VD: MADK2026, FREESHIP"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                />
              </FormField>

              <FormField label="Loại giảm giá" required>
                <select
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value as CouponDiscountType)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                >
                  <option value="Percentage">Phần trăm (%)</option>
                  <option value="FixedAmount">Số tiền cố định (₫)</option>
                </select>
              </FormField>
            </div>

            <FormField label="Mô tả chương trình">
              <AdminInput
                type="text"
                placeholder="VD: Giảm 10% tối đa 50k cho khách hàng mới"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label={formDiscountType === 'Percentage' || formDiscountType === 1 ? 'Mức giảm (%)' : 'Số tiền giảm (₫)'}
                required
              >
                <AdminInput
                  type="number"
                  min={1}
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              {(formDiscountType === 'Percentage' || formDiscountType === 1) && (
                <FormField label="Giảm tối đa (₫)">
                  <AdminInput
                    type="number"
                    step={10000}
                    placeholder="Bỏ trống nếu không giới hạn"
                    value={formMaxDiscount ?? ''}
                    onChange={(e) => setFormMaxDiscount(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormField>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Đơn tối thiểu (₫)">
                <AdminInput
                  type="number"
                  step={10000}
                  value={formMinOrderAmount}
                  onChange={(e) => setFormMinOrderAmount(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Giới hạn lượt dùng">
                <AdminInput
                  type="number"
                  placeholder="Không giới hạn nếu trống"
                  value={formUsageLimit ?? ''}
                  onChange={(e) => setFormUsageLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Ngày bắt đầu">
                <AdminInput
                  type="datetime-local"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </FormField>

              <FormField label="Ngày kết thúc">
                <AdminInput
                  type="datetime-local"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </FormField>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="formIsActiveCheck"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="formIsActiveCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Kích hoạt áp dụng mã ngay sau khi tạo
              </label>
            </div>
          </div>
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCouponToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xóa mã giảm giá"
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={isSubmitting}
        message={
          <p className="text-xs text-slate-600">
            Bạn có chắc chắn muốn xóa mã voucher{' '}
            <strong className="text-slate-900 font-mono">{couponToDelete?.code}</strong>?
            <br />
            Nếu mã đã có lượt sử dụng trong các đơn hàng trước đó, hệ thống sẽ tự động chuyển sang trạng thái vô hiệu hóa để bảo đảm tính toàn vẹn dữ liệu.
          </p>
        }
      />
    </div>
  );
};

export default AdminDiscountsPage;
