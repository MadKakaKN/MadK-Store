import React, { useState, useEffect, useCallback } from 'react';
import {
  OrderDto,
  OrderStatus,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '../../../types/order';
import { adminOrderApi, OrderAdminFilter } from '../../../api/adminOrderApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import Badge, { BadgeVariant } from '../components/common/Badge';
import OrderDetailModal from '../orders/OrderDetailModal';

const BADGE_MAP: Record<OrderStatus, BadgeVariant> = {
  PendingPayment: 'warning',
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'primary',
  Shipping: 'purple',
  Completed: 'success',
  Cancelled: 'danger',
  ReturnRequested: 'warning',
  Returned: 'neutral',
};

export const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Active detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Quick Action transition state
  const [quickProcessingNumber, setQuickProcessingNumber] = useState<string | null>(null);

  // Role permissions
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('Admin');
  const isSales = userRoles.includes('Sales');
  const isWarehouse = userRoles.includes('Warehouse');
  const canManage = isAdmin || isSales || user?.permissions?.includes('order.manage');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: OrderAdminFilter = {
        page,
        pageSize,
        status: selectedStatus,
        search: searchQuery.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate ? `${toDate}T23:59:59` : undefined,
      };

      const res = await adminOrderApi.getAllOrders(filter);
      if (res.isSuccess && res.data) {
        setOrders(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        toast.error(res.error || 'Không thể tải danh sách đơn hàng.', 'Lỗi tải dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải danh sách đơn hàng.', 'Lỗi');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedStatus, searchQuery, fromDate, toDate, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetail = (order: OrderDto) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleOrderUpdated = (updatedOrder: OrderDto) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o))
    );
    if (selectedOrder?.orderNumber === updatedOrder.orderNumber) {
      setSelectedOrder(updatedOrder);
    }
    // Refresh to update counts
    fetchOrders();
  };

  // Quick transition button on table row (e.g. Pending -> Confirmed, Confirmed -> Processing)
  const handleQuickTransition = async (order: OrderDto, nextStatus: OrderStatus, reason: string) => {
    if (!canManage) {
      toast.warning('Chỉ vai trò Sales hoặc Admin mới có quyền đổi trạng thái đơn.', 'Quyền hạn');
      return;
    }

    setQuickProcessingNumber(order.orderNumber);
    try {
      const actorName = user?.fullName || user?.email || (isAdmin ? 'Admin' : 'Sales');
      const res = await adminOrderApi.updateOrderStatus(
        order.orderNumber,
        {
          newStatus: nextStatus,
          reason,
        },
        actorName
      );

      if (res.isSuccess && res.data) {
        handleOrderUpdated(res.data);
        toast.success(
          `Đơn ${order.orderNumber} đã chuyển sang "${ORDER_STATUS_CONFIG[nextStatus]?.label || nextStatus}"`,
          'Thao tác nhanh thành công'
        );
      } else {
        toast.error(res.error || 'Không thể cập nhật trạng thái.', 'Thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đổi trạng thái đơn.', 'Lỗi');
    } finally {
      setQuickProcessingNumber(null);
    }
  };

  const handleResetFilters = () => {
    setSelectedStatus('ALL');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const columns: ColumnDef<OrderDto>[] = [
    {
      key: 'orderNumber',
      title: 'Mã đơn hàng',
      width: '180px',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleOpenDetail(row)}
          className="text-left font-mono font-bold text-xs text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-md transition-colors"
        >
          {row.orderNumber}
        </button>
      ),
    },
    {
      key: 'customer',
      title: 'Khách hàng',
      render: (row) => {
        let recipientName = row.customerEmail || 'Khách vãng lai';
        let recipientPhone = row.customerPhone || '';
        try {
          if (row.shippingAddressSnapshot) {
            const parsed = JSON.parse(row.shippingAddressSnapshot);
            if (parsed.recipientName) recipientName = parsed.recipientName;
            if (parsed.phoneNumber) recipientPhone = parsed.phoneNumber;
          }
        } catch {
          // ignore parse error
        }

        return (
          <div>
            <div className="font-semibold text-slate-800 text-xs">{recipientName}</div>
            <div className="text-[11px] text-slate-500 font-mono">{recipientPhone}</div>
          </div>
        );
      },
    },
    {
      key: 'items',
      title: 'Sản phẩm',
      render: (row) => {
        const firstItem = row.items?.[0];
        const extraCount = (row.items?.length || 0) - 1;
        return (
          <div className="flex items-center gap-2 max-w-[220px]">
            {firstItem?.thumbnailUrlSnapshot && (
              <img
                src={firstItem.thumbnailUrlSnapshot}
                alt={firstItem.productNameSnapshot}
                className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
              />
            )}
            <div className="truncate text-xs">
              <span className="font-medium text-slate-700 truncate block">
                {firstItem?.productNameSnapshot || 'Sản phẩm'}
              </span>
              {extraCount > 0 && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  +{extraCount} sản phẩm khác
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'totalAmount',
      title: 'Tổng tiền',
      render: (row) => (
        <span className="font-bold text-xs text-slate-900">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'payment',
      title: 'Thanh toán',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-700">{row.paymentMethod}</span>
          <span
            className={`text-[10px] block font-medium ${
              PAYMENT_STATUS_CONFIG[row.paymentStatus]?.color || 'text-slate-400'
            }`}
          >
            {PAYMENT_STATUS_CONFIG[row.paymentStatus]?.label || row.paymentStatus}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => {
        const item = ORDER_STATUS_CONFIG[row.status] || {
          label: row.status,
          icon: '●',
        };
        const variant = BADGE_MAP[row.status] || 'neutral';
        return (
          <Badge variant={variant} dot size="sm">
            {item.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Thời gian đặt',
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => {
        const isProcessingThis = quickProcessingNumber === row.orderNumber;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenDetail(row)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Chi tiết
            </button>

            {/* Quick State Machine Transition actions for Sales/Admin */}
            {canManage && (
              <>
                {row.status === 'Pending' && (
                  <button
                    type="button"
                    disabled={isProcessingThis}
                    onClick={() => handleQuickTransition(row, 'Confirmed', 'Xác nhận đơn qua danh sách')}
                    className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isProcessingThis ? '...' : 'Duyệt'}
                  </button>
                )}

                {row.status === 'Confirmed' && (
                  <button
                    type="button"
                    disabled={isProcessingThis}
                    onClick={() => handleQuickTransition(row, 'Processing', 'Chuyển đóng gói kho')}
                    className="px-2 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isProcessingThis ? '...' : 'Đóng gói'}
                  </button>
                )}

                {row.status === 'Processing' && (
                  <button
                    type="button"
                    disabled={isProcessingThis}
                    onClick={() => handleQuickTransition(row, 'Shipping', 'Bàn giao vận chuyển')}
                    className="px-2 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isProcessingThis ? '...' : 'Giao hàng'}
                  </button>
                )}

                {row.status === 'Shipping' && (
                  <button
                    type="button"
                    disabled={isProcessingThis}
                    onClick={() => handleQuickTransition(row, 'Completed', 'Hoàn tất giao hàng')}
                    className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isProcessingThis ? '...' : 'Hoàn tất'}
                  </button>
                )}
              </>
            )}

            {/* Warehouse Quick Tag */}
            {isWarehouse && !canManage && (row.status === 'Processing' || row.status === 'Shipping') && (
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Kho chuẩn bị
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const statusFilters: { key: OrderStatus | 'ALL'; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Tất cả đơn', icon: '📋' },
    { key: 'Pending', label: 'Chờ duyệt', icon: '⏳' },
    { key: 'Confirmed', label: 'Đã xác nhận', icon: '✓' },
    { key: 'Processing', label: 'Đang đóng gói', icon: '📦' },
    { key: 'Shipping', label: 'Đang giao hàng', icon: '🚚' },
    { key: 'Completed', label: 'Giao thành công', icon: '🎉' },
    { key: 'Cancelled', label: 'Đã hủy', icon: '✕' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">Quản trị Đơn hàng</h1>
            {isAdmin && (
              <Badge variant="primary" size="sm">
                Vai trò: Admin
              </Badge>
            )}
            {isSales && (
              <Badge variant="info" size="sm">
                Vai trò: Sales
              </Badge>
            )}
            {isWarehouse && (
              <Badge variant="purple" size="sm">
                Vai trò: Warehouse
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý vòng đời đơn hàng, xác nhận thông tin, đóng gói xuất kho và cập nhật ghi chú nội bộ.
          </p>
        </div>

        {/* Warehouse specialized quick action notice */}
        {isWarehouse && !canManage && (
          <div className="flex items-center gap-2 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-xl text-xs">
            <span>📦</span>
            <span>Chế độ Kho: Đóng gói & bàn giao vận chuyển</span>
          </div>
        )}
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

      {/* Filter Bar (Date range, Customer Search, Clear Filters) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Customer / Order Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, số ĐT, email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Date Range: From Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="p-1.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Date Range: To Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="p-1.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Action buttons: Reset & Refresh */}
        <div className="flex items-center gap-2">
          {(selectedStatus !== 'ALL' || searchQuery || fromDate || toDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              ✕ Xóa bộ lọc
            </button>
          )}

          <button
            type="button"
            onClick={fetchOrders}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
          >
            <span>🔄</span> Tải lại
          </button>
        </div>
      </div>

      {/* Orders DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(item) => item.orderNumber}
        isLoading={isLoading}
        currentPage={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={setPage}
      />

      {/* Order Detail Modal with State Machine & Internal Notes */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};

export default AdminOrdersPage;
