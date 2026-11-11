import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import Badge, { BadgeVariant } from '../components/common/Badge';
import { adminDashboardApi, DashboardSummary } from '../../../api/adminDashboardApi';
import { adminOrderApi } from '../../../api/adminOrderApi';
import { OrderDto, ORDER_STATUS_CONFIG } from '../../../types/order';
import {
  IconMoney,
  IconPackage,
  IconClock,
  IconTarget,
  IconDiamond,
  IconTrendingUp,
  IconTruck,
  IconRotateCcw,
  IconTicket,
  IconShield,
  IconBriefcase,
  IconWarehouse,
  IconCrown,
  IconPhone,
  IconFlame,
  IconCreditCard,
  IconTag,
  IconCheck,
  IconAlertTriangle,
  IconGear,
} from '../../../components/common/Icons';

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

const PAYMENT_STYLE_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  MoMo: { label: 'MoMo', className: 'bg-pink-50 text-pink-700 border-pink-200', icon: <IconMoney className="w-3 h-3 text-pink-600" /> },
  VNPay: { label: 'VNPAY', className: 'bg-red-50 text-red-700 border-red-200', icon: <IconCreditCard className="w-3 h-3 text-red-600" /> },
  COD: { label: 'COD', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <IconMoney className="w-3 h-3 text-amber-600" /> },
  BankTransfer: { label: 'Chuyển khoản', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <IconCreditCard className="w-3 h-3 text-blue-600" /> },
};

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // User's genuine role
  const detectedRole = useMemo(() => {
    if (user?.roles?.includes('Admin')) return 'Admin';
    if (user?.roles?.includes('Sales')) return 'Sales';
    if (user?.roles?.includes('Warehouse')) return 'Warehouse';
    return 'Admin';
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
      const dataPromise = adminDashboardApi.getDashboardSummary(roleToLoad);
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

  // Total revenue in selected period
  const periodTotalRevenue = useMemo(() => {
    return filteredDailyStats.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [filteredDailyStats]);

  const isSales = activeRole === 'Sales';
  const isWarehouse = activeRole === 'Warehouse';
  const isAdmin = activeRole === 'Admin';
  const canViewRevenue = isAdmin || isSales;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ──── 1. TOP HEADER BANNER & GREETING ──── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                {isSales ? <IconBriefcase className="w-5 h-5 text-white" /> : isWarehouse ? <IconWarehouse className="w-5 h-5 text-white" /> : <IconShield className="w-5 h-5 text-white" />}
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>
                    {isSales
                      ? `Xin chào, ${user?.fullName || 'Chuyên viên Sales'}`
                      : isWarehouse
                        ? `Trung tâm Điều hành Kho vận & Tồn kho`
                        : `Trung tâm Điều hành Toàn diện MadK`}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {isSales
                    ? 'Bảng điều hành kinh doanh & chăm sóc khách hàng • Ca trực hôm nay'
                    : isWarehouse
                      ? 'Theo dõi tồn kho thực tế, nhập xuất và chuẩn bị đóng gói hàng hóa'
                      : 'Hệ thống quản trị điều hành tổng thể toàn bộ chuỗi cung ứng & kinh doanh'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Role Switcher & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold shadow-inner">
              <span className="px-2.5 text-slate-500 text-[11px] hidden sm:inline">Phân hệ:</span>
              <button
                onClick={() => setActiveRole('Sales')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeRole === 'Sales'
                    ? 'bg-white text-blue-700 shadow-xs font-bold ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Giao diện kinh doanh dành riêng cho nhân viên Sales"
              >
                <IconBriefcase className="w-3.5 h-3.5" />
                <span>Sales</span>
              </button>
              <button
                onClick={() => setActiveRole('Admin')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeRole === 'Admin'
                    ? 'bg-white text-purple-700 shadow-xs font-bold ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Giao diện toàn quyền cho quản trị viên"
              >
                <IconCrown className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setActiveRole('Warehouse')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeRole === 'Warehouse'
                    ? 'bg-white text-amber-700 shadow-xs font-bold ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Giao diện kho vận & quản lý tồn kho"
              >
                <IconWarehouse className="w-3.5 h-3.5" />
                <span>Kho</span>
              </button>
            </div>

            <button
              onClick={() => loadData(activeRole)}
              disabled={loading}
              className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs"
              title="Làm mới dữ liệu thời gian thực"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sales Priority Highlights (Only when viewing Sales) */}
        {isSales && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống bán hàng trực tuyến
              </span>
              <span className="text-slate-500">
                Đang có <strong className="text-slate-900 font-bold">{ordersList.length}</strong> đơn hàng đã ghi nhận trong kỳ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin/orders?status=Pending"
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <IconPhone className="w-3.5 h-3.5 text-amber-700" />
                <span>Đơn cần gọi:</span>
                <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {urgentOrdersCount}
                </span>
              </Link>
              <Link
                to="/admin/returns"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <IconRotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Đổi trả: {orderStatusCounts.returned}</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="w-5 h-5 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(activeRole)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold rounded-xl"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ──── 2. PRIMARY KPI METRICS GRID (4 LUXURY CARDS) ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Revenue (Sales & Admin) OR Total SKUs (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isSales ? 'Doanh số thực thu' : 'Tổng doanh thu'}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {revenue ? formatVND(revenue.totalRevenue) : '0 đ'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <IconMoney className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn giao thành công:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {revenue?.completedOrders || 0} đơn
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng SKU kho</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {inventory?.totalSkus || 0} SKU
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <IconTag className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Biến thể đang quản lý:</span>
              <span className="font-bold text-blue-600">Đầy đủ mã vạch</span>
            </div>
          </div>
        )}

        {/* Metric 2: Sales: Orders Needing Attention | Admin: Gross Profit | Warehouse: OnHand Stock */}
        {isSales ? (
          <div className={`bg-white rounded-3xl border ${urgentOrdersCount > 0 ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-200/80'} p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Cần gọi / Xử lý gấp</span>
                  {urgentOrdersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {urgentOrdersCount} đơn hàng
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <IconClock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Chờ duyệt / Đóng gói:</span>
              <Link to="/admin/orders?status=Pending" className="font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-0.5">
                Xử lý ngay &rarr;
              </Link>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận gộp</p>
                <h3 className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 tracking-tight">
                  {revenue ? formatVND(revenue.grossProfit) : '0 đ'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <IconTrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Biên lợi nhuận gộp:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {revenue?.grossMarginPercentage.toFixed(1) || '0.0'}%
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tồn kho thực tế (On-Hand)</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {inventory?.totalOnHand || 0} SP
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <IconPackage className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Tồn giữ trước:</span>
              <span className="font-bold text-amber-600">{inventory?.totalReserved || 0} SP</span>
            </div>
          </div>
        )}

        {/* Metric 3: Sales: Fulfillment Rate | Admin: Total Orders | Warehouse: Available Stock */}
        {isSales ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ hoàn tất đơn</p>
                <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1 tracking-tight">
                  {fulfillmentRate}%
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <IconTarget className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn hủy:</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                {revenue?.cancelledOrders || orderStatusCounts.cancelled || 0} đơn
              </span>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng số đơn hàng</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {revenue?.totalOrders || 0} đơn
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <IconPackage className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn huỷ:</span>
              <span className="font-bold text-rose-600">{revenue?.cancelledOrders || 0} đơn</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tồn khả dụng (Available)</p>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tracking-tight">
                  {inventory?.availableStock || 0} SP
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <IconCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Khả năng xuất bán:</span>
              <span className="font-bold text-emerald-700">Sẵn sàng bán</span>
            </div>
          </div>
        )}

        {/* Metric 4: Average Order Value (Sales & Admin) OR Low Stock Warning (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Giá trị TB đơn (AOV)</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {revenue ? formatVND(revenue.averageOrderValue) : '0 đ'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <IconDiamond className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Doanh số / đơn thành công</span>
              <span className="font-bold text-blue-600">Chuẩn bán lẻ</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cảnh báo sắp hết hàng</p>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 tracking-tight">
                  {inventory?.lowStockSkuCount || 0} SKU
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-400 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                <IconAlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mức cảnh báo tồn:</span>
              <span className="font-bold text-rose-600">≤ 10 chiếc</span>
            </div>
          </div>
        )}
      </div>

      {/* ──── 3. VISUAL SALES ORDER PIPELINE (FUNNEL) ──── */}
      {canViewRevenue && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <IconTarget className="w-5 h-5 text-blue-600" />
                <span>Phễu Trạng Thái Đơn Hàng (Sales Pipeline)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp vào từng trạng thái để mở danh sách đơn hàng tương ứng
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              Mở toàn bộ đơn hàng &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Pending */}
            <Link
              to="/admin/orders?status=Pending"
              className="p-4 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 to-amber-50/30 hover:bg-amber-100/70 hover:border-amber-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Chờ xác nhận</span>
                <IconClock className="w-4 h-4 text-amber-700" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-amber-900">{orderStatusCounts.pending}</span>
                <span className="text-[10px] text-amber-700 group-hover:underline font-bold">Duyệt ngay</span>
              </div>
            </Link>

            {/* 2. Processing */}
            <Link
              to="/admin/orders?status=Processing"
              className="p-4 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/70 to-blue-50/30 hover:bg-blue-100/70 hover:border-blue-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                <span>Đang đóng gói</span>
                <IconGear className="w-4 h-4 text-blue-700" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-blue-900">{orderStatusCounts.processing}</span>
                <span className="text-[10px] text-blue-700 group-hover:underline font-bold">Theo dõi</span>
              </div>
            </Link>

            {/* 3. Shipping */}
            <Link
              to="/admin/orders?status=Shipping"
              className="p-4 rounded-2xl border border-purple-200/80 bg-gradient-to-b from-purple-50/70 to-purple-50/30 hover:bg-purple-100/70 hover:border-purple-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                <span>Đang giao hàng</span>
                <IconTruck className="w-4 h-4 text-purple-700" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-purple-900">{orderStatusCounts.shipping}</span>
                <span className="text-[10px] text-purple-700 group-hover:underline font-bold">Xem GHN</span>
              </div>
            </Link>

            {/* 4. Completed */}
            <Link
              to="/admin/orders?status=Completed"
              className="p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 to-emerald-50/30 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Giao thành công</span>
                <IconCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-900">{orderStatusCounts.completed}</span>
                <span className="text-[10px] text-emerald-700 group-hover:underline font-bold">Đã thu tiền</span>
              </div>
            </Link>

            {/* 5. Returns */}
            <Link
              to="/admin/returns"
              className="p-4 rounded-2xl border border-orange-200/80 bg-gradient-to-b from-orange-50/70 to-orange-50/30 hover:bg-orange-100/70 hover:border-orange-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-orange-800">
                <span>Đổi trả & Hoàn</span>
                <IconRotateCcw className="w-4 h-4 text-orange-700" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-orange-900">{orderStatusCounts.returned}</span>
                <span className="text-[10px] text-orange-700 group-hover:underline font-bold">Thẩm định</span>
              </div>
            </Link>

            {/* 6. Cancelled */}
            <Link
              to="/admin/orders?status=Cancelled"
              className="p-4 rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/70 to-rose-50/30 hover:bg-rose-100/70 hover:border-rose-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                <span>Đơn đã hủy</span>
                <IconAlertTriangle className="w-4 h-4 text-rose-700" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-rose-900">{orderStatusCounts.cancelled}</span>
                <span className="text-[10px] text-rose-700 group-hover:underline font-bold">Lý do hủy</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ──── 4. REIMAGINED REVENUE & ORDER TREND CHART ──── */}
      {canViewRevenue && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <IconTrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Biểu Đồ Doanh Thu & Nhịp Độ Bán Hàng
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tổng doanh số kỳ chọn: <strong className="text-blue-600 font-bold">{formatVND(periodTotalRevenue)}</strong> • Phân tích doanh thu & số đơn chốt hàng ngày
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold shadow-inner">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  timeRange === '7d' ? 'bg-white text-blue-700 shadow-xs font-bold ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 ngày qua
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  timeRange === '30d' ? 'bg-white text-blue-700 shadow-xs font-bold ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 ngày qua
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  timeRange === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Visual Chart with Luxury Styling */}
          {filteredDailyStats.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Chưa có dữ liệu đơn hàng trong khoảng thời gian này
            </div>
          ) : (
            <div className="mt-8">
              {/* Chart Grid Lines Background */}
              <div className="relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                </div>

                <div className="h-72 flex items-end gap-2 sm:gap-4 pt-10 pb-2 px-3 overflow-x-auto relative z-10">
                  {filteredDailyStats.map((stat, idx) => {
                    const rawRev = (stat.revenue / maxDailyRevenue) * 100;
                    const revHeight = stat.revenue > 0 ? Math.max(14, Math.round(rawRev)) : 6;
                    const rawProfit = (stat.grossProfit / maxDailyRevenue) * 100;
                    const profitHeight = stat.grossProfit > 0 ? Math.max(8, Math.round(rawProfit)) : 4;

                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[55px] flex flex-col items-center h-full justify-end group relative p-1.5 rounded-2xl hover:bg-slate-50/90 transition-colors"
                      >
                        {/* Luxury Floating Tooltip on Hover */}
                        <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col z-30 bg-slate-950/95 text-white text-xs py-2.5 px-4 rounded-2xl shadow-2xl pointer-events-none whitespace-nowrap min-w-[170px] border border-slate-800 backdrop-blur-md animate-in fade-in">
                          <span className="font-extrabold text-blue-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                            <span>{stat.date}</span>
                            <span className="text-[10px] font-mono text-slate-400">Ca bán hàng</span>
                          </span>
                          <div className="mt-2 space-y-1 text-slate-300 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span>Số đơn chốt:</span>
                              <span className="font-bold text-white">{stat.orderCount} đơn</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span>Doanh thu:</span>
                              <span className="font-bold text-emerald-400">{formatVND(stat.revenue)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span>Lợi nhuận gộp:</span>
                              <span className="font-bold text-blue-400">{formatVND(stat.grossProfit)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dual Bar Graphic */}
                        <div className="w-full max-w-[46px] flex items-end justify-center gap-1.5 h-full pb-1 relative">
                          {/* Revenue Bar */}
                          <div
                            style={{ height: `${revHeight}%` }}
                            className="w-full bg-gradient-to-t from-blue-600 via-indigo-600 to-blue-400 rounded-t-xl group-hover:from-blue-700 group-hover:to-indigo-500 transition-all shadow-md shadow-blue-500/10 relative flex items-start justify-center"
                          >
                            {stat.orderCount > 0 && (
                              <span className="absolute -top-6 text-[11px] font-black text-slate-700 group-hover:text-blue-600 group-hover:scale-110 transition-transform bg-white/90 px-1.5 rounded-md shadow-2xs border border-slate-100">
                                {stat.orderCount}
                              </span>
                            )}
                          </div>

                          {/* Gross Profit Sub-Bar */}
                          <div
                            style={{ height: `${profitHeight}%` }}
                            className="w-3 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg opacity-90 transition-all"
                            title={`Lợi nhuận: ${formatVND(stat.grossProfit)}`}
                          />
                        </div>

                        {/* X-Axis Date Label */}
                        <span className="text-[11px] font-bold text-slate-500 mt-2.5 truncate w-full text-center group-hover:text-slate-900 transition-colors">
                          {stat.date.split('-').slice(1).join('/')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-2xs" />
                    <span className="font-semibold text-slate-700">Doanh thu thuần (Cột chính)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-2xs" />
                    <span className="font-semibold text-slate-700">Lợi nhuận gộp (Cột phụ)</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 italic">
                  Rê chuột vào từng cột để xem chi tiết doanh số & số lượng đơn chốt
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──── 5. PERFECTLY BALANCED 2-COLUMN GRID (NO EMPTY VOID!) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12 cols ~ 58% width): Recent Orders Action Feed */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <IconPackage className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Đơn hàng mới nhất cần xác nhận
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Gọi điện tư vấn, xác nhận và duyệt đơn cho khách hàng</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                Mở tất cả &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Mã đơn & Khách hàng</th>
                    <th className="py-3.5 px-3 text-center">Thanh toán</th>
                    <th className="py-3.5 px-4 text-right">Tổng tiền</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
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
                        icon: <IconCreditCard className="w-3 h-3 text-slate-600" />,
                      };

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5">
                            <p className="font-extrabold text-slate-900 font-mono text-[13px]">{o.orderNumber}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                              {o.customerEmail || o.customerPhone || 'Khách vãng lai'}
                            </p>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-lg border shadow-2xs ${paymentConfig.className}`}>
                              <span>{paymentConfig.icon}</span>
                              <span>{paymentConfig.label}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                            {formatVND(o.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge variant={badgeVariant} size="sm" dot>
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/admin/orders?search=${encodeURIComponent(o.orderNumber)}`}
                              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-xl transition-all shadow-2xs inline-block"
                            >
                              Duyệt &rarr;
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

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-5">
            <span>Hiển thị 6 đơn hàng mới nhất</span>
            <Link to="/admin/orders" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Mở trung tâm quản lý đơn hàng &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column (5/12 cols ~ 42% width): Top Selling Products Leaderboard */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <IconFlame className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Top sản phẩm bán chạy nhất</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Xếp hạng theo số lượng bán và lợi nhuận</p>
              </div>
              <Link
                to="/admin/catalog"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Danh mục &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {!revenue?.topProducts || revenue.topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Chưa có dữ liệu sản phẩm đã bán
                </div>
              ) : (
                revenue.topProducts.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="p-4 sm:px-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank badge */}
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-slate-50 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Product thumbnail */}
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.productName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold text-xs">
                          SP
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">
                          {p.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {p.variantName} • <span className="font-mono text-blue-600">{p.sku}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-900 text-xs">{formatVND(p.revenue)}</p>
                      <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                        Đã bán: <span className="font-bold text-slate-800">{p.quantitySold}</span> chiếc
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Biên lợi nhuận được đồng bộ tự động từ giá snapshot
          </div>
        </div>
      </div>

      {/* ──── 6. DYNAMIC QUICK OPERATION SHORTCUTS BY ROLE ──── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        {activeRole === 'Warehouse' ? (
          <>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <IconWarehouse className="w-5 h-5 text-amber-600" />
              Lối Tắt Nghiệp Vụ Kho Vận & Quản Lý Tồn Kho
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Truy cập nhanh các phân hệ nghiệp vụ thuộc quyền hạn Thủ kho (Warehouse)
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <Link
                to="/admin/inventory"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconWarehouse className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                  Quản lý tồn kho
                </span>
                <span className="text-[11px] text-slate-400">OnHand & Cảnh báo cạn kho</span>
              </Link>

              <Link
                to="/admin/orders"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconPackage className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                  Đơn hàng cần xuất
                </span>
                <span className="text-[11px] text-slate-400">Đóng gói & xuất kho GHN</span>
              </Link>

              <Link
                to="/admin/returns"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-rose-500 hover:bg-rose-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconRotateCcw className="w-6 h-6 text-rose-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                  Đổi trả & Bảo hành
                </span>
                <span className="text-[11px] text-slate-400">Tiếp nhận sản phẩm hoàn/lỗi</span>
              </Link>

              <Link
                to="/admin/catalog"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconTag className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  Sản phẩm & Linh kiện
                </span>
                <span className="text-[11px] text-slate-400">Tra cứu mã SKU & cấu hình</span>
              </Link>
            </div>
          </>
        ) : activeRole === 'Sales' ? (
          <>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <IconBriefcase className="w-5 h-5 text-blue-600" />
              Lối Tắt Nghiệp Vụ Bán Hàng & Chăm Sóc Khách Hàng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Truy cập nhanh các phân hệ nghiệp vụ thuộc quyền hạn Thu ngân / Bán hàng (Sales)
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <Link
                to="/admin/pos"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconCreditCard className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  Bán tại quầy (POS)
                </span>
                <span className="text-[11px] text-slate-400">Quét mã vạch & in bill K80</span>
              </Link>

              <Link
                to="/admin/orders"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconPackage className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                  Quản lý đơn hàng
                </span>
                <span className="text-[11px] text-slate-400">Duyệt & xử lý giao vận</span>
              </Link>

              <Link
                to="/admin/returns"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconRotateCcw className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                  Đổi trả & Hoàn tiền
                </span>
                <span className="text-[11px] text-slate-400">Thẩm định khiếu nại</span>
              </Link>

              <Link
                to="/admin/discounts"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-purple-500 hover:bg-purple-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconTicket className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                  Mã giảm giá
                </span>
                <span className="text-[11px] text-slate-400">Tạo voucher kích cầu</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <IconCrown className="w-5 h-5 text-purple-600" />
              Lối Tắt Quản Trị Hệ Thống Toàn Diện
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Truy cập nhanh các phân hệ vận hành và quản lý quan trọng của Quản trị viên
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <Link
                to="/admin/orders"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconPackage className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                  Quản lý đơn hàng
                </span>
                <span className="text-[11px] text-slate-400">Toàn bộ chu trình đơn hàng</span>
              </Link>

              <Link
                to="/admin/inventory"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconWarehouse className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                  Quản lý kho hàng
                </span>
                <span className="text-[11px] text-slate-400">Theo dõi tồn kho toàn hệ thống</span>
              </Link>

              <Link
                to="/admin/users"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-purple-500 hover:bg-purple-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconCrown className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                  Người dùng & Quyền
                </span>
                <span className="text-[11px] text-slate-400">Phân quyền nhân viên</span>
              </Link>

              <Link
                to="/admin/reports"
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <IconTrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  Báo cáo kinh doanh
                </span>
                <span className="text-[11px] text-slate-400">Doanh thu & biên lợi nhuận</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
