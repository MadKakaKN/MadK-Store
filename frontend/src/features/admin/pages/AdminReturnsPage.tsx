import React, { useState, useEffect, useCallback } from 'react';
import {
  ReturnRequestDto,
  ReturnRequestStatus,
  ReturnFilterDto,
  RETURN_STATUS_CONFIG,
  REFUND_STATUS_CONFIG,
} from '../../../types/return';
import adminReturnApi from '../../../api/adminReturnApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import Badge, { BadgeVariant } from '../components/common/Badge';
import AdminReturnDetailModal from '../returns/AdminReturnDetailModal';
import ApproveReturnModal from '../returns/ApproveReturnModal';
import RejectReturnModal from '../returns/RejectReturnModal';
import CompleteRefundModal from '../returns/CompleteRefundModal';

const STATUS_BADGE_MAP: Record<ReturnRequestStatus, BadgeVariant> = {
  Pending: 'warning',
  Approved: 'info',
  Completed: 'success',
  Rejected: 'danger',
  Cancelled: 'neutral',
};

export const AdminReturnsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [returns, setReturns] = useState<ReturnRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<ReturnRequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals state
  const [selectedDetail, setSelectedDetail] = useState<ReturnRequestDto | null>(null);
  const [selectedForApprove, setSelectedForApprove] = useState<ReturnRequestDto | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<ReturnRequestDto | null>(null);
  const [selectedForComplete, setSelectedForComplete] = useState<ReturnRequestDto | null>(null);

  // Authorization checks
  const userRoles = user?.roles || [];
  const userPerms = user?.permissions || [];
  const isAdmin = userRoles.includes('Admin');
  const isSales = userRoles.includes('Sales');
  const isWarehouse = userRoles.includes('Warehouse');
  const canManage = isAdmin || isSales || userPerms.includes('order.manage');
  const canRefund = isAdmin || isSales || userPerms.includes('order.refund');

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: ReturnFilterDto = {
        page,
        pageSize,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
      };

      const res = await adminReturnApi.getAllReturnRequests(filter);
      setReturns(res.items);
      setTotalCount(res.totalItems);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu đổi trả.',
        'Lỗi tải dữ liệu'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedStatus, searchQuery, toast]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleReturnUpdated = (updated: ReturnRequestDto) => {
    setReturns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedDetail?.id === updated.id) {
      setSelectedDetail(updated);
    }
    fetchReturns();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const columns: ColumnDef<ReturnRequestDto>[] = [
    {
      key: 'orderNumber',
      title: 'Mã đơn / Yêu cầu',
      width: '180px',
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setSelectedDetail(row)}
            className="text-left font-mono font-bold text-xs text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md transition-colors"
          >
            #{row.orderNumber}
          </button>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={row.id}>
            ID: {row.id.substring(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      title: 'Khách hàng',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {row.customerName || 'Khách vãng lai'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {row.customerPhone || row.customerEmail || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      title: 'Sản phẩm đổi trả',
      render: (row) => {
        const first = row.items[0];
        const count = row.items.length;
        return (
          <div className="text-xs max-w-[240px]">
            <p className="font-medium text-slate-900 truncate" title={first?.productName}>
              {first?.productName || 'Không có sản phẩm'}
            </p>
            <p className="text-[11px] text-slate-500">
              {first?.variantName} <span className="text-slate-400">×{first?.quantity}</span>
              {count > 1 && <span className="ml-1 text-brand-600 font-semibold">+{count - 1} món</span>}
            </p>
          </div>
        );
      },
    },
    {
      key: 'refund',
      title: 'Số tiền hoàn',
      align: 'right',
      render: (row) => {
        const refundMeta = REFUND_STATUS_CONFIG[row.refundStatus];
        return (
          <div className="text-right">
            <div className="font-mono font-bold text-xs text-orange-600">
              {formatCurrency(row.refundAmount)}
            </div>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${refundMeta?.color || 'bg-slate-100 text-slate-600'}`}>
              {refundMeta?.label || row.refundStatus}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => {
        const meta = RETURN_STATUS_CONFIG[row.status];
        return (
          <Badge variant={STATUS_BADGE_MAP[row.status] || 'neutral'} size="sm">
            {meta?.icon} {meta?.label || row.status}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono">{formatDate(row.createdAt)}</span>
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
            onClick={() => setSelectedDetail(row)}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Chi tiết
          </button>

          {row.status === 'Pending' && canManage && (
            <>
              <button
                type="button"
                onClick={() => setSelectedForApprove(row)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-2xs"
                title="Duyệt yêu cầu đổi trả"
              >
                Duyệt
              </button>
              <button
                type="button"
                onClick={() => setSelectedForReject(row)}
                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                title="Từ chối yêu cầu đổi trả"
              >
                Từ chối
              </button>
            </>
          )}

          {row.status === 'Approved' && canRefund && (
            <button
              type="button"
              onClick={() => setSelectedForComplete(row)}
              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
              title="Nhận lại hàng & Hoàn tiền"
            >
              <span>💸</span> Hoàn tiền
            </button>
          )}
        </div>
      ),
    },
  ];

  const statusFilters: { key: ReturnRequestStatus | 'ALL'; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Tất cả', icon: '📋' },
    { key: 'Pending', label: 'Chờ duyệt', icon: '⏳' },
    { key: 'Approved', label: 'Đã duyệt', icon: '✓' },
    { key: 'Completed', label: 'Đã hoàn tất', icon: '💸' },
    { key: 'Rejected', label: 'Bị từ chối', icon: '✕' },
    { key: 'Cancelled', label: 'Đã hủy', icon: '⊘' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">Quản lý Đổi trả & Hoàn tiền</h1>
            {isAdmin && <Badge variant="primary" size="sm">Admin</Badge>}
            {isSales && <Badge variant="info" size="sm">Sales</Badge>}
            {isWarehouse && <Badge variant="purple" size="sm">Warehouse</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem xét thẩm định yêu cầu đổi trả từ khách hàng, kiểm tra tiếp nhận hàng về kho và xử lý hoàn tiền an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReturns}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>🔄</span> Tải lại
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        {statusFilters.map((tab) => {
          const isActive = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-brand-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (MK-...), mã yêu cầu, tên khách, SĐT..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            ✕ Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={returns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        currentPage={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={setPage}
      />

      {/* Modals */}
      <AdminReturnDetailModal
        returnRequest={selectedDetail}
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onOpenApprove={(r) => setSelectedForApprove(r)}
        onOpenReject={(r) => setSelectedForReject(r)}
        onOpenComplete={(r) => setSelectedForComplete(r)}
        canManage={canManage}
        canRefund={canRefund}
      />

      <ApproveReturnModal
        returnRequest={selectedForApprove}
        isOpen={!!selectedForApprove}
        onClose={() => setSelectedForApprove(null)}
        onApproved={handleReturnUpdated}
      />

      <RejectReturnModal
        returnRequest={selectedForReject}
        isOpen={!!selectedForReject}
        onClose={() => setSelectedForReject(null)}
        onRejected={handleReturnUpdated}
      />

      <CompleteRefundModal
        returnRequest={selectedForComplete}
        isOpen={!!selectedForComplete}
        onClose={() => setSelectedForComplete(null)}
        onCompleted={handleReturnUpdated}
      />
    </div>
  );
};

export default AdminReturnsPage;
