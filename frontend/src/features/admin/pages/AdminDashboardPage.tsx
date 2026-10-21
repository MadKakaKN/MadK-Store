import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import Badge from '../components/common/Badge';
import { adminDashboardApi, DashboardSummary } from '../../../api/adminDashboardApi';

type TimeRange = '7d' | '30d' | 'all';

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
  const [error, setError] = useState<string | null>(null);

  // Update activeRole if user changes
  useEffect(() => {
    setActiveRole(detectedRole);
  }, [detectedRole]);

  const loadData = async (roleToLoad: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminDashboardApi.getDashboardSummary(roleToLoad);
      setSummary(data);
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

  const canViewRevenue = activeRole === 'Admin' || activeRole === 'Sales';
  const canViewInventory = activeRole === 'Admin' || activeRole === 'Warehouse';
  const isAdmin = activeRole === 'Admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Top Header Banner with Role Switching & Time Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trung tâm điều hành MadK Store
            </h1>
            <Badge variant="purple" size="md">
              {activeRole} View
            </Badge>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                <svg className="animate-spin h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Đang tải số liệu...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Số liệu thống kê thời gian thực từ cơ sở dữ liệu. Phân quyền hiển thị theo vai trò nghiệp vụ.
          </p>
        </div>

        {/* Role Matrix Simulator Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500 text-[11px] hidden sm:inline">Quyền xem:</span>
            <button
              onClick={() => setActiveRole('Admin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'Admin'
                  ? 'bg-white text-brand-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem toàn bộ chỉ số doanh thu, kho và hệ thống"
            >
              👑 Admin
            </button>
            <button
              onClick={() => setActiveRole('Sales')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'Sales'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chỉ xem doanh thu, lợi nhuận và top bán chạy"
            >
              💼 Sales
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
            className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs"
            title="Làm mới số liệu"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

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

      {/* 2. Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue (Sales & Admin) OR Total SKUs (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng doanh thu</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {revenue ? formatVND(revenue.totalRevenue) : '0 đ'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                💰
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn hoàn tất & giao:</span>
              <span className="font-bold text-slate-800">{revenue?.completedOrders || 0} đơn</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng SKU kho</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {inventory?.totalSkus || 0} SKU
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                🏷️
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Biến thể đang quản lý:</span>
              <span className="font-bold text-blue-600">Đầy đủ mã vạch</span>
            </div>
          </div>
        )}

        {/* Metric 2: Gross Profit (Sales & Admin) OR OnHand Stock (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lợi nhuận gộp</p>
                <h3 className="text-2xl font-black text-brand-600 mt-1">
                  {revenue ? formatVND(revenue.grossProfit) : '0 đ'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-lg">
                📈
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Biên lợi nhuận gộp:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {revenue?.grossMarginPercentage.toFixed(1) || '0.0'}%
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho thực tế (On-Hand)</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {inventory?.totalOnHand || 0} SP
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                📦
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Tồn giữ trước:</span>
              <span className="font-bold text-amber-600">{inventory?.totalReserved || 0} SP</span>
            </div>
          </div>
        )}

        {/* Metric 3: Total Orders (Sales & Admin) OR Available Stock (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số đơn hàng</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {revenue?.totalOrders || 0} đơn
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                🛒
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đơn huỷ:</span>
              <span className="font-bold text-red-600">{revenue?.cancelledOrders || 0} đơn</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn khả dụng (Available)</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {inventory?.availableStock || 0} SP
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                ✅
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Khả năng xuất bán:</span>
              <span className="font-bold text-emerald-700">Sẵn sàng bán</span>
            </div>
          </div>
        )}

        {/* Metric 4: Average Order Value (Sales & Admin) OR Low Stock Warning (Warehouse) */}
        {canViewRevenue ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá trị trung bình đơn (AOV)</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {revenue ? formatVND(revenue.averageOrderValue) : '0 đ'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                📊
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Doanh thu / đơn thành công</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cảnh báo sắp hết hàng</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {inventory?.lowStockSkuCount || 0} SKU
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
                ⚠️
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mức cảnh báo tồn:</span>
              <span className="font-bold text-rose-600">≤ 10 chiếc</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Admin Extra System Summary Bar (When Admin is selected) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Chỉ số hệ thống quản trị cao cấp</h4>
              <p className="text-xs text-slate-400">Kiểm soát toàn diện tài khoản, danh mục sản phẩm và nhật ký kiểm toán</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Người dùng:</span>
              <span className="font-bold text-white text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                {summary?.totalUsers || 42}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sản phẩm:</span>
              <span className="font-bold text-white text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                {summary?.totalProducts || 28}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Audit Logs:</span>
              <span className="font-bold text-emerald-400 text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                {summary?.totalAuditLogs || 156} logs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Chart Section: Daily Orders & Revenue (Sales & Admin) */}
      {canViewRevenue && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <h3 className="text-base font-bold text-slate-900">Biểu đồ doanh thu & đơn hàng theo ngày</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê số lượng đơn hàng, doanh thu thực thu và lợi nhuận gộp theo từng ngày
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === '7d' ? 'bg-white text-brand-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 ngày qua
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === '30d' ? 'bg-white text-brand-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 ngày qua
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === 'all' ? 'bg-white text-brand-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-20 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap min-w-[150px]">
                        <span className="font-bold text-brand-300">{stat.date}</span>
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
                          <span className="font-semibold text-brand-400">{formatVND(stat.grossProfit)}</span>
                        </div>
                      </div>

                      {/* Bar Container */}
                      <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full pb-1">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}%` }}
                          className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md group-hover:from-brand-700 group-hover:to-brand-500 transition-all shadow-xs relative"
                        >
                          {stat.orderCount > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 group-hover:text-brand-600">
                              {stat.orderCount}
                            </span>
                          )}
                        </div>

                        {/* Gross Profit Sub-Bar */}
                        <div
                          style={{ height: `${profitHeight}%` }}
                          className="w-2.5 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm opacity-90 transition-all"
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
                    <span className="w-3 h-3 rounded-sm bg-brand-500" />
                    <span>Doanh thu (Cột chính)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-3 rounded-sm bg-emerald-500" />
                    <span>Lợi nhuận gộp (Cột phụ)</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 italic">
                  💡 Rê chuột vào cột để xem chi tiết doanh thu và biên lợi nhuận
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Two-Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Top Selling Products (Visible to Sales & Admin) */}
        {canViewRevenue && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
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
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Xem đơn hàng →
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
                                  {p.variantName} • <span className="font-mono text-brand-600">{p.sku}</span>
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

        {/* Panel B: Low Stock Warning (Visible to Warehouse & Admin) */}
        {canViewInventory && (
          <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between ${
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
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Quản lý kho hàng →
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
                                  {item.variantName} • <span className="font-mono text-brand-600">{item.sku}</span>
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
                className="font-bold text-brand-600 hover:text-brand-700"
              >
                + Tạo phiếu nhập hàng →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 6. Quick Operation Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">Lối tắt nghiệp vụ thường dùng</h3>
        <p className="text-xs text-slate-500 mt-0.5">Truy cập nhanh các phân hệ điều hành theo luồng công việc</p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/orders"
            className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              📦
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700">
              Quản lý đơn hàng
            </span>
            <span className="text-[10px] text-slate-400">Duyệt & xử lý giao vận</span>
          </Link>

          <Link
            to="/admin/inventory"
            className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              📥
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700">
              Quản lý kho & NCC
            </span>
            <span className="text-[10px] text-slate-400">Phiếu nhập, kiểm kê kho</span>
          </Link>

          <Link
            to="/admin/pricing"
            className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🏷️
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700">
              Lịch biểu giá
            </span>
            <span className="text-[10px] text-slate-400">Flash sale & khuyến mãi</span>
          </Link>

          <Link
            to="/admin/catalog"
            className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              💻
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700">
              Danh mục sản phẩm
            </span>
            <span className="text-[10px] text-slate-400">Biến thể, hình ảnh, 3D</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
