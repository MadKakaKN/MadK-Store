import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  OrderDto,
  OrderStatus,
  ORDER_STATUS_CONFIG,
} from '../../../types/order';
import { adminOrderApi, OrderAdminFilter } from '../../../api/adminOrderApi';
import shippingApi from '../../../api/shippingApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import OrderDetailModal from '../orders/OrderDetailModal';

export const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Selected orders for bulk action
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Active drawer & modal state
  const [drawerOrder, setDrawerOrder] = useState<OrderDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [shippingCreatingNumber, setShippingCreatingNumber] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Role permissions
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('Admin');
  const isSales = userRoles.includes('Sales');
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
        // Default drawer to first order if none selected
        if (!drawerOrder && res.data.items.length > 0) {
          setDrawerOrder(res.data.items[0]);
          setSelectedOrderIds([res.data.items[0].orderNumber]);
        }
      } else {
        toast.error(res.error || 'Không thể tải danh sách đơn hàng.', 'Lỗi tải dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải danh sách đơn hàng.', 'Lỗi');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedStatus, searchQuery, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(orders.map((o) => o.orderNumber));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelect = (orderNumber: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderNumber) ? prev.filter((id) => id !== orderNumber) : [...prev, orderNumber]
    );
  };

  const handleCreateGhnShipping = async (orderNumber: string) => {
    setShippingCreatingNumber(orderNumber);
    try {
      const res = await shippingApi.createAdminShippingOrder(orderNumber);
      if (res.isSuccess && res.data) {
        toast.success(`Đã tạo mã vận đơn GHN: ${res.data.trackingCode}`, 'Thành công');
        fetchOrders();
        if (drawerOrder?.orderNumber === orderNumber) {
          setDrawerOrder({ ...drawerOrder, trackingCode: res.data.trackingCode, status: 'Shipping' });
        }
      } else {
        toast.error(res.error || 'Không thể tạo vận đơn GHN', 'Lỗi');
      }
    } catch {
      toast.error('Lỗi kết nối khi gọi bưu cục GHN', 'Lỗi');
    } finally {
      setShippingCreatingNumber(null);
    }
  };

  const handleUpdateStatus = async (order: OrderDto, nextStatus: OrderStatus, reason: string) => {
    if (!canManage) {
      toast.warning('Chỉ vai trò Sales hoặc Admin mới có quyền đổi trạng thái đơn.', 'Quyền hạn');
      return;
    }

    try {
      const actorName = user?.fullName || user?.email || (isAdmin ? 'Admin' : 'Sales');
      const res = await adminOrderApi.updateOrderStatus(
        order.orderNumber,
        { newStatus: nextStatus, reason },
        actorName
      );

      if (res.isSuccess && res.data) {
        const updated = res.data;
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o))
        );
        if (drawerOrder?.orderNumber === updated.orderNumber) {
          setDrawerOrder(updated);
        }
        toast.success(
          `Đơn ${order.orderNumber} đã chuyển sang "${ORDER_STATUS_CONFIG[nextStatus]?.label || nextStatus}"`,
          'Cập nhật thành công'
        );
      } else {
        toast.error(res.error || 'Không thể cập nhật trạng thái.', 'Thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đổi trạng thái đơn.', 'Lỗi');
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const filter: OrderAdminFilter = {
        status: selectedStatus,
        fromDate: fromDate || undefined,
        toDate: toDate ? `${toDate}T23:59:59` : undefined,
        search: searchQuery.trim() || undefined,
      };
      const blob = await adminOrderApi.exportOrdersCsv(filter);
      const filename = `DanhSach_DonHang_${new Date().toISOString().slice(0, 10)}.csv`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Đã tải xuống danh sách đơn hàng thành công!', 'Xuất Excel');
    } catch {
      toast.error('Không thể xuất danh sách đơn hàng.', 'Lỗi xuất file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedStatus('ALL');
    setSearchQuery('');
    setPaymentFilter('');
    setChannelFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const getCustomerInfo = (order: OrderDto) => {
    let name = 'Khách vãng lai';
    let phone = '—';
    let address = 'Nhận tại cửa hàng';

    if (order.shippingAddressSnapshot) {
      try {
        const parsed =
          typeof order.shippingAddressSnapshot === 'string'
            ? JSON.parse(order.shippingAddressSnapshot)
            : order.shippingAddressSnapshot;
        name = parsed.recipientName || parsed.fullName || order.customerEmail || name;
        phone = parsed.phoneNumber || parsed.phone || phone;
        address = [parsed.detailedAddress || parsed.addressLine, parsed.wardName || parsed.ward, parsed.districtName || parsed.district, parsed.provinceName || parsed.city]
          .filter(Boolean)
          .join(', ');
      } catch {
        name = order.customerEmail || name;
      }
    }
    return { name, phone, address };
  };

  const filteredOrders = orders.filter((o) => {
    if (paymentFilter && o.paymentMethod !== paymentFilter) return false;
    return true;
  });

  return (
    <div className={`transition-all duration-200 ${drawerOrder ? 'xl:mr-[430px]' : ''}`}>
      {/* ========================================================================= */}
      {/* Title & Top Action Row (Screen 09)                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">
            Quản Lý Đơn Hàng &amp; Vận Hành
          </h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Kiểm soát tiến trình xử lý, xuất kho và đối soát vận chuyển giao hàng GHN Realtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="h-8 px-3 rounded border border-[#E5E7EB] bg-white text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">
              file_download
            </span>
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>
          <Link
            to="/admin/pos"
            className="h-8 px-3 rounded bg-blue-700 text-white font-medium hover:bg-blue-800 flex items-center gap-1.5 transition-colors text-xs shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Tạo đơn tại quầy (POS)</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Filter Tabs (KiotViet / Shopify Retail Style)                              */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] mb-3 overflow-x-auto text-[12px]">
        {[
          { key: 'ALL', label: 'Tất cả', count: totalCount || 1428, color: 'bg-blue-100 text-blue-800' },
          { key: 'Pending', label: 'Chờ xác nhận', count: 12, color: 'bg-amber-100 text-amber-800' },
          { key: 'Confirmed', label: 'Đã duyệt & Xuất kho', count: 34, color: 'bg-blue-50 text-blue-700' },
          { key: 'Shipping', label: 'Đang giao GHN', count: 48, color: 'bg-purple-100 text-purple-700' },
          { key: 'Completed', label: 'Đã giao', count: 1310, color: 'bg-emerald-100 text-emerald-800' },
          { key: 'Cancelled', label: 'Đã hủy', count: 18, color: 'bg-rose-100 text-rose-800' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedStatus(tab.key as OrderStatus | 'ALL');
              setPage(1);
            }}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              selectedStatus === tab.key
                ? 'font-semibold text-blue-700 border-blue-700'
                : 'font-medium text-gray-600 hover:text-gray-900 border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded font-bold text-[11px] ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* Filter Control Bar (Screen 09)                                            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded p-2.5 mb-3 flex flex-wrap items-center gap-2 text-xs">
        {/* Date Range Picker */}
        <div className="relative w-48">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
            calendar_today
          </span>
          <select
            value={fromDate ? 'custom' : '7d'}
            onChange={(e) => {
              if (e.target.value === '7d') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setFromDate(d.toISOString().slice(0, 10));
              } else if (e.target.value === 'today') {
                setFromDate(new Date().toISOString().slice(0, 10));
              } else {
                setFromDate('');
                setToDate('');
              }
            }}
            className="w-full h-8 pl-7 pr-6 text-[12px] bg-white border border-[#E5E7EB] rounded focus:border-blue-600 focus:ring-0"
          >
            <option value="7d">7 ngày qua</option>
            <option value="today">Hôm nay</option>
            <option value="all">Tất cả thời gian</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div className="relative w-44">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full h-8 px-2 text-[12px] bg-white border border-[#E5E7EB] rounded focus:border-blue-600 focus:ring-0"
          >
            <option value="">Phương thức (Tất cả)</option>
            <option value="BankTransfer">VietQR Napas247</option>
            <option value="VNPay">VNPay Gateway</option>
            <option value="COD">COD (Tiền mặt)</option>
            <option value="MoMo">Ví MoMo</option>
          </select>
        </div>

        {/* Channel Filter */}
        <div className="relative w-36">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full h-8 px-2 text-[12px] bg-white border border-[#E5E7EB] rounded focus:border-blue-600 focus:ring-0"
          >
            <option value="">Kênh (Tất cả)</option>
            <option value="Online">Online Web Store</option>
            <option value="POS">POS Quầy Q.1</option>
          </select>
        </div>

        {/* Order Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã đơn (#MK-...), Tên khách, SĐT, Số Serial..."
            className="w-full h-8 pl-8 pr-3 text-[12px] bg-white border border-[#E5E7EB] rounded focus:border-blue-600 focus:ring-0 placeholder-gray-400"
          />
        </div>

        <button
          onClick={handleResetFilters}
          className="h-8 px-2.5 rounded border border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Đặt lại bộ lọc"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* Bulk Action Bar (Screen 09)                                               */}
      {/* ========================================================================= */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3 flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2 pl-1">
            <input
              type="checkbox"
              checked={selectedOrderIds.length === orders.length && orders.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-0 cursor-pointer"
            />
            <span className="font-semibold text-blue-900">
              Đã chọn {selectedOrderIds.length} đơn hàng ({selectedOrderIds[0]}
              {selectedOrderIds.length > 1 ? `, +${selectedOrderIds.length - 1}` : ''})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedOrderIds[0]) handleCreateGhnShipping(selectedOrderIds[0]);
              }}
              className="h-7 px-2.5 rounded bg-white border border-[#E5E7EB] text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              <span>In phiếu gửi GHN</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="h-7 px-2.5 rounded bg-white border border-[#E5E7EB] text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              <span>Xuất Excel hóa đơn e-VAT</span>
            </button>
            <button
              onClick={() => {
                if (selectedOrderIds[0]) {
                  const target = orders.find((o) => o.orderNumber === selectedOrderIds[0]);
                  if (target) handleUpdateStatus(target, 'Confirmed', 'Xác nhận hàng loạt');
                }
              }}
              className="h-7 px-2.5 rounded bg-blue-700 text-white font-medium hover:bg-blue-800 flex items-center gap-1.5 transition-colors text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>Chuyển trạng thái</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Orders Dense Table (Screen 09: 13px, Thin 1px Border #E5E7EB)             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-[#E5E7EB] text-[12px]">
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length === orders.length && orders.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Mã đơn hàng</th>
                <th className="py-2.5 px-3">Khách hàng</th>
                <th className="py-2.5 px-3">Sản phẩm tóm tắt</th>
                <th className="py-2.5 px-3">Kênh bán</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 block mb-2">
                      progress_activity
                    </span>
                    Đang đồng bộ dữ liệu đơn hàng...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const cust = getCustomerInfo(order);
                  const isSelected = selectedOrderIds.includes(order.orderNumber);
                  const isDrawerActive = drawerOrder?.orderNumber === order.orderNumber;
                  const firstItem = order.items?.[0];
                  const extraItemsCount = (order.items?.length || 1) - 1;

                  return (
                    <tr
                      key={order.orderNumber}
                      onClick={() => {
                        setDrawerOrder(order);
                        if (!selectedOrderIds.includes(order.orderNumber)) {
                          setSelectedOrderIds([order.orderNumber]);
                        }
                      }}
                      className={`cursor-pointer transition-colors ${
                        isDrawerActive
                          ? 'bg-blue-50/50 hover:bg-blue-50/70'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.orderNumber)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Mã đơn */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-semibold text-blue-700 hover:underline">
                          <span>{order.orderNumber}</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          •{' '}
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900">{cust.name}</span>
                          <span className="px-1 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            VIP
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">{cust.phone}</div>
                      </td>

                      {/* Sản phẩm tóm tắt */}
                      <td className="py-2.5 px-3">
                        <div className="max-w-[200px] truncate text-gray-900 font-medium">
                          {firstItem?.productName || 'Sản phẩm MadK Tech'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {extraItemsCount > 0 ? `+ ${extraItemsCount} món phụ kiện` : 'Đơn lẻ'}
                        </div>
                      </td>

                      {/* Kênh bán */}
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-[#E5E7EB]">
                          {(order.paymentMethod as string) === 'Cash' || order.paymentMethod === 'COD' ? 'POS Quầy' : 'Online Web'}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            order.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : order.status === 'Shipping'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : order.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                        </span>
                        {order.trackingCode && (
                          <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                            {order.trackingCode}
                          </div>
                        )}
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-bold text-[#D70018] text-[13px]">
                          {formatVND(order.totalAmount)}
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          {order.paymentStatus === 'Paid'
                            ? `Đã TT ${order.paymentMethod}`
                            : 'Chưa thanh toán'}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1 text-gray-500">
                          <button
                            onClick={() => setDrawerOrder(order)}
                            className="p-1 rounded hover:bg-gray-100 text-blue-700"
                            title="Chi tiết Drawer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setDrawerOrder(order);
                              window.print();
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-600"
                            title="In phiếu"
                          >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                          </button>
                          <button
                            onClick={() => {
                              setDrawerOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-600"
                            title="Xem popup toàn màn hình"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              more_vert
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-3 py-2 bg-gray-50 border-t border-[#E5E7EB] flex items-center justify-between text-[12px] text-gray-600">
          <div className="flex items-center gap-3">
            <span>
              Hiển thị <span className="font-semibold text-gray-900">{filteredOrders.length}</span>{' '}
              trên <span className="font-semibold text-gray-900">{totalCount}</span> đơn
            </span>
            <div className="flex items-center gap-1">
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-6 px-1.5 text-[11px] border border-[#E5E7EB] rounded bg-white"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-6 px-2 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs"
            >
              Trước
            </button>
            <span className="h-6 px-2.5 bg-blue-700 text-white rounded font-semibold text-[11px] flex items-center justify-center">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= totalCount}
              className="h-6 px-2 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIDE DRAWER (Screen 09: Fixed Right 420px Solid Retail Inspector)         */}
      {/* ========================================================================= */}
      {drawerOrder && (
        <aside className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white border-l border-[#E5E7EB] z-40 flex flex-col justify-between shadow-2xl select-text text-[12px]">
          {/* Drawer Header */}
          <div className="h-14 px-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14px] text-gray-900">
                  Chi tiết đơn #{drawerOrder.orderNumber}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  {ORDER_STATUS_CONFIG[drawerOrder.status]?.label || drawerOrder.status}
                </span>
              </div>
              <span className="text-[11px] text-gray-500">
                {new Date(drawerOrder.createdAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                • Kênh Online Web Store
              </span>
            </div>
            <button
              onClick={() => setDrawerOrder(null)}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title="Đóng bảng chi tiết"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Super Admin Action Matrix */}
            <div className="bg-gray-50 p-2.5 rounded border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                <span>Quyền Quản Trị Vận Hành</span>
                <span className="text-blue-700 font-bold flex items-center gap-0.5 lowercase text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span> GHN
                  API Sẵn sàng
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleUpdateStatus(drawerOrder, 'Processing', 'Duyệt xuất kho')}
                  className="h-8 px-2 rounded bg-white border border-[#E5E7EB] font-medium text-gray-800 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-blue-700 text-[16px]">
                    inventory_2
                  </span>
                  <span>Duyệt xuất kho</span>
                </button>
                <button
                  onClick={() => handleCreateGhnShipping(drawerOrder.orderNumber)}
                  disabled={shippingCreatingNumber === drawerOrder.orderNumber}
                  className="h-8 px-2 rounded bg-blue-700 font-medium text-white hover:bg-blue-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>
                    {shippingCreatingNumber === drawerOrder.orderNumber
                      ? 'Đang gọi GHN...'
                      : 'Giao tài xế GHN'}
                  </span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="h-8 px-2 rounded bg-white border border-[#E5E7EB] font-medium text-gray-800 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-emerald-700 text-[16px]">
                    receipt_long
                  </span>
                  <span>In hóa đơn e-VAT</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus(drawerOrder, 'Cancelled', 'Hủy theo yêu cầu')}
                  className="h-8 px-2 rounded bg-white border border-rose-200 font-medium text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-rose-700 text-[16px]">
                    money_off
                  </span>
                  <span>Hủy đơn hàng</span>
                </button>
              </div>
            </div>

            {/* Customer Information */}
            {(() => {
              const cust = getCustomerInfo(drawerOrder);
              return (
                <div className="border border-[#E5E7EB] rounded p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5">
                    <span className="font-bold text-gray-900 flex items-center gap-1 text-[12px]">
                      <span className="material-symbols-outlined text-[16px] text-blue-700">
                        person
                      </span>
                      Thông Tin Khách Hàng
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Diamond VIP (4.250 điểm)
                    </span>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{cust.name}</span>
                      <a
                        href={`tel:${cust.phone}`}
                        className="text-blue-700 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {cust.phone}
                      </a>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {drawerOrder.customerEmail || 'khachhang@madk.vn'}
                    </div>
                    <div className="pt-1 text-[11px] text-gray-700 flex items-start gap-1">
                      <span className="material-symbols-outlined text-gray-400 text-[15px] shrink-0 mt-0.5">
                        location_on
                      </span>
                      <span>{cust.address}</span>
                    </div>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-medium text-[10px] border border-emerald-200">
                        GHN Hỏa tốc 2h
                      </span>
                      <span className="text-[11px] text-gray-500">Giao trong ngày</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Line Items Table */}
            <div className="border border-[#E5E7EB] rounded p-3 bg-white space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1 text-[12px]">
                  <span className="material-symbols-outlined text-[16px] text-blue-700">
                    shopping_bag
                  </span>
                  Mặt Hàng Trong Đơn ({drawerOrder.items?.length || 1} món)
                </span>
                <span className="text-[10px] font-semibold text-gray-500">Mã Serial/IMEI OK</span>
              </div>
              <div className="space-y-2">
                {drawerOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 pb-2 border-b border-[#E5E7EB] last:border-0 last:pb-0"
                  >
                    <div className="w-12 h-12 rounded border border-[#E5E7EB] bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        alt={item.productNameSnapshot || item.productName || 'Sản phẩm'}
                        src={item.thumbnailUrlSnapshot || item.thumbnailUrl || 'https://placehold.co/100x100?text=SP'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/100x100?text=SP';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {item.productNameSnapshot || item.productName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        SKU: {item.skuSnapshot || item.sku || 'MDK-SP'} • SL: {item.quantity}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] text-gray-500">
                          Đơn giá: {formatVND(item.unitPriceSnapshot || item.unitPrice || 0)}
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatVND(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border border-[#E5E7EB] rounded p-3 bg-white space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-semibold text-gray-900">
                  {formatVND(drawerOrder.subtotalAmount || drawerOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển GHN:</span>
                <span className="text-gray-900 font-medium">
                  {formatVND(drawerOrder.shippingFee || 35000)}
                </span>
              </div>
              {drawerOrder.discountAmount ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm giá khuyến mãi:</span>
                  <span className="font-medium">-{formatVND(drawerOrder.discountAmount)}</span>
                </div>
              ) : null}
              <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-[13px]">Tổng thanh toán:</span>
                <div className="text-right">
                  <div className="font-bold text-[#D70018] text-[16px]">
                    {formatVND(drawerOrder.totalAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    {drawerOrder.paymentStatus === 'Paid'
                      ? `Đã thanh toán ${drawerOrder.paymentMethod}`
                      : 'Chưa thanh toán (COD)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment Steps (Internal Timeline) */}
            <div className="border border-[#E5E7EB] rounded p-3 bg-white space-y-2">
              <div className="font-bold text-gray-900 flex items-center justify-between text-[12px] border-b border-[#E5E7EB] pb-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-blue-700">
                    timeline
                  </span>
                  Lộ Trình Vận Hành
                </span>
                <span className="text-[11px] font-semibold text-blue-700">GHN Express</span>
              </div>
              <div className="space-y-2 text-[11px] text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[15px] mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">Khớp đối soát thanh toán</div>
                    <div className="text-gray-500">Mã GD: VCB9921448102 - Tự động đối soát</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[15px] mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">Kho Q.1 xuất seal &amp; quét IMEI</div>
                    <div className="text-gray-500">NV: Trần Minh - Đã kiểm định phần cứng</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-700 text-[15px] mt-0.5">
                    local_shipping
                  </span>
                  <div>
                    <div className="font-semibold text-blue-800">Bàn giao tài xế GHN Hỏa tốc</div>
                    <div className="text-gray-600">
                      Mã: {drawerOrder.trackingCode || 'GHN889234VN'} - TX: Trần Văn Bình
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Sticky Bottom Bar */}
          <div className="p-3 border-t border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => window.print()}
                className="w-8 h-8 rounded border border-[#E5E7EB] text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="In phiếu đóng gói"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
              </button>
              <button
                onClick={() => toast.info('Đã gửi tin nhắn SMS Zalo ZNS cho khách hàng', 'Thông báo')}
                className="w-8 h-8 rounded border border-[#E5E7EB] text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="Gửi SMS cho khách"
              >
                <span className="material-symbols-outlined text-[18px]">sms</span>
              </button>
              <button
                onClick={() => setIsDetailModalOpen(true)}
                className="w-8 h-8 rounded border border-[#E5E7EB] text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="Nhật ký đơn"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
              </button>
            </div>
            <button
              onClick={() => handleCreateGhnShipping(drawerOrder.orderNumber)}
              className="h-8 px-3 rounded bg-blue-700 text-white font-medium hover:bg-blue-800 flex items-center gap-1.5 transition-colors text-[12px]"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Đồng bộ GHN Realtime</span>
            </button>
          </div>
        </aside>
      )}

      {/* Full Modal fallback */}
      {isDetailModalOpen && drawerOrder && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          order={drawerOrder}
          onOrderUpdated={(updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o))
            );
            setDrawerOrder(updated);
          }}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
