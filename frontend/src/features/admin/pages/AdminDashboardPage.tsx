import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import Badge, { BadgeVariant } from '../components/common/Badge';
import { adminDashboardApi, DashboardSummary } from '../../../api/adminDashboardApi';
import { adminOrderApi } from '../../../api/adminOrderApi';
import { OrderDto, ORDER_STATUS_CONFIG } from '../../../types/order';

type TimeRange = '7d' | '30d' | 'all';

const ORDER_BADGE_MAP: Record<string, BadgeVariant> = {
  PendingPayment: 'warning',
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'info',
  Shipping: 'purple',
  Completed: 'success',
  Cancelled: 'danger',
  ReturnRequested: 'danger',
  Returned: 'neutral',
};

const PAYMENT_STYLE_MAP: Record<string, { label: string; className: string }> = {
  MoMo: { label: 'MoMo', className: 'bg-pink-50 text-pink-700 border-pink-200' },
  VNPay: { label: 'VNPAY', className: 'bg-red-50 text-red-700 border-red-200' },
  COD: { label: 'COD', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  BankTransfer: { label: 'Chuyển khoản', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // User's genuine role
  const detectedRole = useMemo(() => {
    if (user?.roles?.includes('Admin')) return 'Admin';
    if (user?.roles?.includes('Sales')) return 'Sales';
    if (user?.roles?.includes('Warehouse')) return 'Warehouse';
    return 'Admin'; // Default admin fallback
  }, [user]);

  // Active view role (allows switching view to test role visibility matrix)
  const [activeRole, setActiveRole] = useState<string>(detectedRole);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ordersList, setOrdersList] = useState<OrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Update activeRole if detected user role changes
  useEffect(() => {
    setActiveRole(detectedRole);
  }, [detectedRole]);

  const loadData = async (roleToLoad: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load summary data
      const dataPromise = adminDashboardApi.getDashboardSummary(roleToLoad);

      // 2. Load recent orders for sales view
      const ordersPromise = adminOrderApi.getAllOrders({ page: 1, pageSize: 60 });

      const [data, ordersRes] = await Promise.all([dataPromise, ordersPromise]);
      setSummary(data);

      if (ordersRes.data?.items) {
        setOrdersList(ordersRes.data.items);
      }
    } catch (err: unknown) {
      console.error('Failed to load dashboard:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeRole);
  }, [activeRole]);

  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const revenue = summary?.revenue;
  const inventory = summary?.inventory;

  // Filter daily stats by timeRange
  const filteredDailyStats = useMemo(() => {
    if (!revenue?.dailyStats) return [];
    if (timeRange === '7d') {
      return revenue.dailyStats.slice(-7);
    }
    if (timeRange === '30d') {
      return revenue.dailyStats.slice(-30);
    }
    return revenue.dailyStats;
  }, [revenue?.dailyStats, timeRange]);

  // Max revenue for scaling chart bars
  const maxDailyRevenue = useMemo(() => {
    if (!filteredDailyStats.length) return 1;
    const max = Math.max(...filteredDailyStats.map((d) => d.revenue));
    return max > 0 ? max : 1;
  }, [filteredDailyStats]);

  // Order status counts for pipeline
  const orderStatusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      processing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
      returned: 0,
    };
    ordersList.forEach((o) => {
      const s = o.status;
      if (s === 'Pending' || s === 'PendingPayment') counts.pending++;
      else if (s === 'Confirmed' || s === 'Processing') counts.processing++;
      else if (s === 'Shipping') counts.shipping++;
      else if (s === 'Completed') counts.completed++;
      else if (s === 'Cancelled') counts.cancelled++;
      else if (s === 'ReturnRequested' || s === 'Returned') counts.returned++;
    });
    return counts;
  }, [ordersList]);

  // Recent 6 orders
  const recentOrders = useMemo(() => {
    return ordersList.slice(0, 6);
  }, [ordersList]);

  // Urgent pending count
  const urgentOrdersCount = orderStatusCounts.pending + orderStatusCounts.processing;

  // Fulfillment rate %
  const fulfillmentRate = useMemo(() => {
    const total = revenue?.totalOrders || ordersList.length || 0;
    const completed = revenue?.completedOrders || orderStatusCounts.completed || 0;
    if (total === 0) return '100.0';
    return ((completed / total) * 100).toFixed(1);
  }, [revenue, ordersList, orderStatusCounts]);

  const isSales = activeRole === 'Sales';
  const isWarehouse = activeRole === 'Warehouse';
  const isAdmin = activeRole === 'Admin';
  const canViewRevenue = isAdmin || isSales;
  const canViewInventory = isAdmin || isWarehouse;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ──── 1. TOP HEADER BANNER & ROLE SWITCHER ──── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isSales
                ? 'Trung tâm Bán hàng & Chăm sóc Khách hàng'
                : isWarehouse
                  ? 'Trung tâm Vận hành Kho vận & Tồn kho'
                  : 'Trung tâm Điều hành Toàn diện MadK'}
            </h1>
            <Badge variant={isSales ? 'info' : isWarehouse ? 'warning' : 'purple'} size="md">
              {isSales ? '💼 Sales Portal' : isWarehouse ? '🏭 Warehouse Portal' : '👑 Master Admin'}
            </Badge>

            {isSales && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sales Feed
              </span>
            )}

            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium ml-1">
                <svg className="animate-spin h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang tải số liệu...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isSales
              ? 'Theo dõi tiến độ chốt đơn, gọi xác nhận khách hàng, kiểm soát đơn chờ xử lý và doanh số thời gian thực.'
              : isWarehouse
                ? 'Theo dõi tồn kho thực tế, tồn giữ trước, hàng khả dụng và các cảnh báo thiếu hụt để nhập kho.'
                : 'Số liệu thống kê thời gian thực từ cơ sở dữ liệu. Phân quyền hiển thị theo vai trò nghiệp vụ.'}
          </p>
        </div>

        {/* Role Matrix Simulator Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500 text-[11px] hidden sm:inline">Quyền xem:</span>
            <button
              onClick={() => setActiveRole('Sales')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'Sales'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Giao diện chuyên sâu cho nhân viên bán hàng & CSKH"
            >
              💼 Sales
            </button>
            <button
              onClick={() => setActiveRole('Admin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'Admin'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem toàn bộ chỉ số doanh thu, kho và hệ thống"
            >
              👑 Admin
            </button>
            <button
              onClick={() => setActiveRole('Warehouse')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'Warehouse'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chỉ xem tồn kho thực tế, khả dụng và cảnh báo hết hàng"
            >
              🏭 Kho
            </button>
          </div>

          <button
            onClick={() => loadData(activeRole)}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs"
            title="Làm mới số liệu"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(activeRole)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold rounded-lg"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ──── 2. SALES QUICK ACTION STRIP (FOR SALES ONLY) ──── */}
      {isSales && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/60 rounded-2xl border border-blue-100/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-xs font-bold">
              ⚡
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">Thao tác nhanh cho Chuyên viên Sales</p>
              <p className="text-[11px] text-slate-500">Các nhiệm vụ ưu tiên cần xử lý trong ca làm việc hôm nay</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/orders?status=Pending"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all"
            >
              <span>📞 Đơn chờ gọi xác nhận:</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${urgentOrdersCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                {urgentOrdersCount}
              </span>
            </Link>

            <Link
              to="/admin/returns"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all"
            >
              <span>↩️ Yêu cầu đổi trả:</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">
                {orderStatusCounts.returned}
              </span>
            </Link>

            <Link
              to="/admin/discounts"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <span>🎟️ Tạo mã giảm giá</span>
            </Link>
          </div>
        </div>
      )}

      {/* ──── 3. PRIMARY KPI METRICS GRID ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue (Sales & Admin) OR Total SKUs (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isSales ? 'Doanh số thực thu' : 'Tổng doanh thu'}
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {revenue ? formatVND(revenue.totalRevenue) : '0 đ'}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
                💰
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn giao thành công:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                {revenue?.completedOrders || 0} đơn
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng SKU kho</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {inventory?.totalSkus || 0} SKU
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
                🏷️
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Biến thể đang quản lý:</span>
              <span className="font-bold text-blue-600">Đầy đủ mã vạch</span>
            </div>
          </div>
        )}

        {/* Metric 2: Sales: Orders Needing Attention | Admin: Gross Profit | Warehouse: OnHand Stock */}
        {isSales ? (
          <div className={`bg-white rounded-2xl border ${urgentOrdersCount > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/90'} p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Cần xử lý gấp</span>
                  {urgentOrdersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {urgentOrdersCount} đơn hàng
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
                ⏳
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Chờ duyệt / Đóng gói:</span>
              <Link to="/admin/orders" className="font-bold text-amber-600 hover:underline">
                Xem danh sách →
              </Link>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận gộp</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">
                  {revenue ? formatVND(revenue.grossProfit) : '0 đ'}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
                📈
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Biên lợi nhuận gộp:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                {revenue?.grossMarginPercentage.toFixed(1) || '0.0'}%
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tồn kho thực tế (On-Hand)</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {inventory?.totalOnHand || 0} SP
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
                📦
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Tồn giữ trước:</span>
              <span className="font-bold text-amber-600">{inventory?.totalReserved || 0} SP</span>
            </div>
          </div>
        )}

        {/* Metric 3: Sales: Fulfillment Rate | Admin: Total Orders | Warehouse: Available Stock */}
        {isSales ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ hoàn tất đơn</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">
                  {fulfillmentRate}%
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
                🎯
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn hủy:</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                {revenue?.cancelledOrders || orderStatusCounts.cancelled || 0} đơn
              </span>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số đơn hàng</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {revenue?.totalOrders || 0} đơn
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-xl shadow-md shadow-purple-500/20">
                🛒
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn huỷ:</span>
              <span className="font-bold text-rose-600">{revenue?.cancelledOrders || 0} đơn</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tồn khả dụng (Available)</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {inventory?.availableStock || 0} SP
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
                ✅
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Khả năng xuất bán:</span>
              <span className="font-bold text-emerald-700">Sẵn sàng bán</span>
            </div>
          </div>
        )}

        {/* Metric 4: Average Order Value (Sales & Admin) OR Low Stock Warning (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giá trị trung bình đơn (AOV)</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {revenue ? formatVND(revenue.averageOrderValue) : '0 đ'}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
                💎
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Doanh số / đơn thành công</span>
              <span className="font-bold text-blue-600">Chuẩn bán lẻ</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cảnh báo sắp hết hàng</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {inventory?.lowStockSkuCount || 0} SKU
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-400 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/20">
                ⚠️
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mức cảnh báo tồn:</span>
              <span className="font-bold text-rose-600">≤ 10 chiếc</span>
            </div>
          </div>
        )}
      </div>

      {/* ──── 4. SALES ORDER STATUS PIPELINE / FUNNEL (FOR SALES & ADMIN) ──── */}
      {canViewRevenue && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🔄 Phễu Trạng Thái Đơn Hàng (Sales Pipeline)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp vào từng trạng thái để mở danh sách đơn hàng tương ứng
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              Xem toàn bộ đơn hàng &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Pending */}
            <Link
              to="/admin/orders?status=Pending"
              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Chờ xác nhận</span>
                <span>⏳</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-900">{orderStatusCounts.pending}</span>
                <span className="text-[10px] text-amber-700 group-hover:underline font-semibold">Duyệt ngay</span>
              </div>
            </Link>

            {/* 2. Processing */}
            <Link
              to="/admin/orders?status=Processing"
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                <span>Đang đóng gói</span>
                <span>⚙️</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-900">{orderStatusCounts.processing}</span>
                <span className="text-[10px] text-blue-700 group-hover:underline font-semibold">Theo dõi</span>
              </div>
            </Link>

            {/* 3. Shipping */}
            <Link
              to="/admin/orders?status=Shipping"
              className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                <span>Đang giao hàng</span>
                <span>🚚</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-purple-900">{orderStatusCounts.shipping}</span>
                <span className="text-[10px] text-purple-700 group-hover:underline font-semibold">Xem GHN</span>
              </div>
            </Link>

            {/* 4. Completed */}
            <Link
              to="/admin/orders?status=Completed"
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Giao thành công</span>
                <span>✅</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-900">{orderStatusCounts.completed}</span>
                <span className="text-[10px] text-emerald-700 group-hover:underline font-semibold">Đã thu tiền</span>
              </div>
            </Link>

            {/* 5. Returns */}
            <Link
              to="/admin/returns"
              className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 hover:border-orange-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-orange-800">
                <span>Đổi trả & Hoàn</span>
                <span>↩️</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-orange-900">{orderStatusCounts.returned}</span>
                <span className="text-[10px] text-orange-700 group-hover:underline font-semibold">Thẩm định</span>
              </div>
            </Link>

            {/* 6. Cancelled */}
            <Link
              to="/admin/orders?status=Cancelled"
              className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 hover:border-rose-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                <span>Đơn đã hủy</span>
                <span>❌</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-900">{orderStatusCounts.cancelled}</span>
                <span className="text-[10px] text-rose-700 group-hover:underline font-semibold">Lý do hủy</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ──── 5. ADMIN EXTRA SYSTEM BAR (ADMIN ONLY) ──── */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🛡️
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white">Chỉ số hệ thống quản trị cao cấp</h4>
              <p className="text-xs text-slate-400">Kiểm soát toàn diện tài khoản, danh mục sản phẩm và nhật ký kiểm toán</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Người dùng:</span>
              <span className="font-bold text-white text-sm bg-white/10 px-3 py-1 rounded-xl">
                {summary?.totalUsers || 42}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sản phẩm:</span>
              <span className="font-bold text-white text-sm bg-white/10 px-3 py-1 rounded-xl">
                {summary?.totalProducts || 28}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Audit Logs:</span>
              <span className="font-bold text-emerald-400 text-sm bg-white/10 px-3 py-1 rounded-xl">
                {summary?.totalAuditLogs || 156} logs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──── 6. CHART SECTION: DAILY ORDERS & REVENUE (SALES & ADMIN) ──── */}
      {canViewRevenue && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <h3 className="text-base font-bold text-slate-900">Biểu đồ doanh thu & số lượng đơn hàng theo ngày</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê số lượng đơn chốt, doanh thu thực thu và lợi nhuận gộp theo từng ngày
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === '7d' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 ngày qua
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === '30d' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 ngày qua
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Visual Bar Chart */}
          {filteredDailyStats.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Chưa có dữ liệu đơn hàng trong khoảng thời gian này
            </div>
          ) : (
            <div className="mt-6">
              <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 overflow-x-auto">
                {filteredDailyStats.map((stat, idx) => {
                  const revHeight = Math.max(8, Math.round((stat.revenue / maxDailyRevenue) * 100));
                  const profitHeight = Math.max(4, Math.round((stat.grossProfit / maxDailyRevenue) * 100));

                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[50px] flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-20 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl pointer-events-none whitespace-nowrap min-w-[150px]">
                        <span className="font-bold text-blue-300">{stat.date}</span>
                        <div className="mt-1 flex justify-between gap-3 text-slate-300">
                          <span>Số đơn:</span>
                          <span className="font-semibold text-white">{stat.orderCount} đơn</span>
                        </div>
                        <div className="flex justify-between gap-3 text-slate-300">
                          <span>Doanh thu:</span>
                          <span className="font-semibold text-emerald-400">{formatVND(stat.revenue)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-slate-300">
                          <span>Lợi nhuận gộp:</span>
                          <span className="font-semibold text-blue-400">{formatVND(stat.grossProfit)}</span>
                        </div>
                      </div>

                      {/* Bar Container */}
                      <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full pb-1">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}%` }}
                          className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md group-hover:from-blue-700 group-hover:to-indigo-600 transition-all shadow-xs relative"
                        >
                          {stat.orderCount > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 group-hover:text-blue-600">
                              {stat.orderCount}
                            </span>
                          )}
                        </div>

                        {/* Gross Profit Sub-Bar */}
                        <div
                          style={{ height: `${profitHeight}%` }}
                          className="w-2.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-xs opacity-90 transition-all"
                          title={`Lợi nhuận: ${formatVND(stat.grossProfit)}`}
                        />
                      </div>

                      {/* X-Axis Date Label */}
                      <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                        {stat.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-blue-600" />
                    <span>Doanh thu (Cột chính)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-3 rounded-xs bg-emerald-500" />
                    <span>Lợi nhuận gộp (Cột phụ)</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 italic">
                  💡 Rê chuột vào cột để xem chi tiết doanh số và biên lợi nhuận
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──── 7. TWO-COLUMN DETAILS GRID ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A (FOR SALES VIEW): Urgent Orders Action Feed */}
        {isSales ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <h3 className="text-base font-bold text-slate-900">Đơn hàng mới nhất cần xử lý</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Gọi điện xác nhận và duyệt đơn cho khách hàng</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Tất cả đơn &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Mã đơn & Khách</th>
                      <th className="py-3 px-3 text-center">Thanh toán</th>
                      <th className="py-3 px-3 text-right">Tổng tiền</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có dữ liệu đơn hàng
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => {
                        const statusConfig = ORDER_STATUS_CONFIG[o.status] || { label: o.status };
                        const badgeVariant = ORDER_BADGE_MAP[o.status] || 'neutral';
                        const paymentConfig = PAYMENT_STYLE_MAP[o.paymentMethod] || {
                          label: o.paymentMethod,
                          className: 'bg-slate-100 text-slate-700 border-slate-200',
                        };

                        return (
                          <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 font-mono">{o.orderNumber}</p>
                              <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                {o.customerEmail || o.customerPhone || 'Khách vãng lai'}
                              </p>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg border ${paymentConfig.className}`}>
                                {paymentConfig.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatVND(o.totalAmount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={badgeVariant} size="sm" dot>
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                to={`/admin/orders?search=${encodeURIComponent(o.orderNumber)}`}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap inline-block"
                              >
                                Xem &rarr;
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-5">
              <span>Hiển thị 6 đơn hàng mới nhất</span>
              <Link to="/admin/orders" className="font-bold text-blue-600 hover:underline">
                Mở trung tâm quản lý đơn hàng &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* Panel A (FOR ADMIN / GENERAL VIEW): Top Selling Products */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <h3 className="text-base font-bold text-slate-900">Top sản phẩm bán chạy nhất</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Xếp hạng theo số lượng bán và lợi nhuận gộp</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Xem đơn hàng &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Sản phẩm</th>
                      <th className="py-3 px-3 text-center">Đã bán</th>
                      <th className="py-3 px-3 text-right">Doanh thu</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận gộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!revenue?.topProducts || revenue.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Chưa có dữ liệu sản phẩm đã bán
                        </td>
                      </tr>
                    ) : (
                      revenue.topProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {p.thumbnailUrl ? (
                                <img
                                  src={p.thumbnailUrl}
                                  alt={p.productName}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold">
                                  SP
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                                  {p.productName}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {p.variantName} • <span className="font-mono text-blue-600">{p.sku}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                              {p.quantitySold}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {formatVND(p.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {formatVND(p.grossProfit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Lợi nhuận gộp = Giá bán snapshot - Giá vốn tại thời điểm bán
            </div>
          </div>
        )}

        {/* Panel B: If Sales -> Top Selling Products table; If Warehouse/Admin -> Low Stock Items */}
        {isSales ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <h3 className="text-base font-bold text-slate-900">Sản phẩm bán chạy nhất</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Top mặt hàng chủ lực giúp tư vấn khách hàng chốt deal</p>
                </div>
                <Link
                  to="/admin/catalog"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Xem danh mục &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Sản phẩm</th>
                      <th className="py-3 px-3 text-center">Đã bán</th>
                      <th className="py-3 px-3 text-right">Doanh thu</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận gộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!revenue?.topProducts || revenue.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Chưa có dữ liệu sản phẩm đã bán
                        </td>
                      </tr>
                    ) : (
                      revenue.topProducts.slice(0, 6).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {p.thumbnailUrl ? (
                                <img
                                  src={p.thumbnailUrl}
                                  alt={p.productName}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold">
                                  SP
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                                  {p.productName}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {p.variantName} • <span className="font-mono text-blue-600">{p.sku}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                              {p.quantitySold}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {formatVND(p.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {formatVND(p.grossProfit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Dữ liệu được cập nhật tự động từ các đơn hàng thành công
            </div>
          </div>
        ) : canViewInventory ? (
          <div
            className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between ${
              !canViewRevenue ? 'lg:col-span-2' : ''
            }`}
          >
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <h3 className="text-base font-bold text-slate-900">Sản phẩm sắp hết hàng</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các SKU có tồn kho khả dụng ≤ 10 chiếc cần bổ sung nhập hàng
                  </p>
                </div>
                <Link
                  to="/admin/inventory"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Quản lý kho hàng &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Mặt hàng</th>
                      <th className="py-3 px-2 text-center">Thực tế</th>
                      <th className="py-3 px-2 text-center">Giữ trước</th>
                      <th className="py-3 px-3 text-center">Khả dụng</th>
                      <th className="py-3 px-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!inventory?.lowStockItems || inventory.lowStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          🎉 Tất cả các SKU đều đủ tồn kho an toàn!
                        </td>
                      </tr>
                    ) : (
                      inventory.lowStockItems.slice(0, 8).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.productName}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold">
                                  SP
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                                  {item.productName}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {item.variantName} • <span className="font-mono text-blue-600">{item.sku}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-medium text-slate-700">
                            {item.onHand}
                          </td>
                          <td className="py-3 px-2 text-center text-amber-600 font-medium">
                            {item.reserved}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                                item.available <= 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : item.available <= 5
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {item.available}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.available <= 0 ? (
                              <Badge variant="danger" size="sm" dot>
                                Hết hàng
                              </Badge>
                            ) : (
                              <Badge variant="warning" size="sm" dot>
                                Cần nhập
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-5">
              <span>Được tính tự động: Tồn khả dụng = Thực tế - Giữ trước</span>
              <Link
                to="/admin/inventory"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                + Tạo phiếu nhập hàng &rarr;
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* ──── 8. QUICK OPERATION SHORTCUTS (ROLE ADAPTIVE) ──── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">
          {isSales ? 'Lối tắt điều hành dành cho Nhân viên Kinh doanh' : 'Lối tắt nghiệp vụ thường dùng'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {isSales
            ? 'Các phân hệ nghiệp vụ thuộc quyền hạn Sales & Chăm sóc khách hàng'
            : 'Truy cập nhanh các phân hệ điều hành theo luồng công việc'}
        </p>

        {isSales ? (
          /* Sales-specific shortcuts (No unauthorized inventory or admin setup links) */
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/admin/orders"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📦
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Quản lý đơn hàng
              </span>
              <span className="text-[10px] text-slate-400">Duyệt & chăm sóc đơn hàng</span>
            </Link>

            <Link
              to="/admin/returns"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                ↩️
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Đổi trả & Hoàn tiền
              </span>
              <span className="text-[10px] text-slate-400">Thẩm định yêu cầu khách hàng</span>
            </Link>

            <Link
              to="/admin/discounts"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                🎟️
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Mã giảm giá
              </span>
              <span className="text-[10px] text-slate-400">Tạo voucher kích cầu</span>
            </Link>

            <Link
              to="/admin/reports"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📈
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Báo cáo doanh số
              </span>
              <span className="text-[10px] text-slate-400">Phân tích doanh thu chi tiết</span>
            </Link>
          </div>
        ) : (
          /* General / Admin shortcuts */
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/admin/orders"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📦
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Quản lý đơn hàng
              </span>
              <span className="text-[10px] text-slate-400">Duyệt & xử lý giao vận</span>
            </Link>

            <Link
              to="/admin/inventory"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📥
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Quản lý kho & NCC
              </span>
              <span className="text-[10px] text-slate-400">Phiếu nhập, kiểm kê kho</span>
            </Link>

            <Link
              to="/admin/pricing"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                🏷️
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Lịch biểu giá
              </span>
              <span className="text-[10px] text-slate-400">Flash sale & khuyến mãi</span>
            </Link>

            <Link
              to="/admin/catalog"
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                💻
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Danh mục sản phẩm
              </span>
              <span className="text-[10px] text-slate-400">Biến thể, hình ảnh, 3D</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
