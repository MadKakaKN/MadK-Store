import React, { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import Badge from '../components/common/Badge';

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'revenue' | 'inventory' | 'summary'>('revenue');

  const isAdmin = user?.roles?.includes('Admin');
  const isSales = user?.roles?.includes('Sales');
  const isWarehouse = user?.roles?.includes('Warehouse');

  const tabs = [
    { id: 'revenue', label: 'Báo cáo doanh thu', visible: isAdmin || isSales },
    { id: 'inventory', label: 'Báo cáo tồn kho', visible: isAdmin || isWarehouse },
    { id: 'summary', label: 'Tổng quan hệ thống', visible: isAdmin },
  ].filter((t) => t.visible);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Báo cáo & Phân tích kinh doanh</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dữ liệu thống kê doanh thu bán hàng, mức luân chuyển tồn kho và hiệu suất vận hành.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            // @ts-expect-error tab type
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Revenue Report Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Tổng doanh thu tháng 10</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">1.240.500.000 đ</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">↑ +18.5% so với tháng trước</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Đơn hàng hoàn tất</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">428 đơn</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Tỷ lệ giao thành công: 96.2%</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Giá trị đơn trung bình (AOV)</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">2.898.000 đ</h3>
              <p className="text-xs text-slate-400 mt-1">Tập trung smartphone & laptop cao cấp</p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Doanh thu theo nhóm ngành hàng</h3>
            <div className="space-y-3">
              {[
                { name: 'Điện thoại thông minh & Tablet', percent: 58, revenue: '719.500.000 đ' },
                { name: 'Laptop & Máy tính xách tay', percent: 28, revenue: '347.340.000 đ' },
                { name: 'Linh kiện PC & Ổ cứng', percent: 9, revenue: '111.640.000 đ' },
                { name: 'Phụ kiện & Gaming Gear', percent: 5, revenue: '62.020.000 đ' },
              ].map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <span className="font-bold text-slate-900">{c.revenue} ({c.percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Inventory Report Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Tổng SKU trong hệ thống</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">156 SKU</h3>
              <p className="text-xs text-slate-500 mt-1">Phân bổ tại 4 danh mục chính</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Tồn kho OnHand</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">2.480 SP</h3>
              <p className="text-xs text-amber-600 font-semibold mt-1">Đang giữ cho đơn: 112 SP</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Cảnh báo sắp hết hàng</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">8 SKU</h3>
              <p className="text-xs text-rose-600 font-semibold mt-1">Cần lập phiếu nhập gấp</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Danh sách SKU cần nhập bổ sung</h3>
            <div className="divide-y divide-slate-100">
              {[
                { sku: 'ASUS-ROG-STRIX-G16', name: 'Laptop ASUS ROG Strix G16', available: 0, status: 'Hết hàng' },
                { sku: 'S24U-512-TITAN', name: 'Samsung Galaxy S24 Ultra 512GB', available: 2, status: 'Nguy cấp' },
                { sku: 'RAM-DDR5-32GB', name: 'Corsair Vengeance 32GB DDR5 6000MHz', available: 4, status: 'Sắp hết' },
              ].map((item) => (
                <div key={item.sku} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">{item.sku}</span>
                    <span className="text-slate-500 ml-2">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600">Còn {item.available} SP</span>
                    <Badge variant={item.available === 0 ? 'danger' : 'warning'} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Executive System Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Chỉ số vận hành hệ thống</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500">Tổng người dùng</span>
                <p className="text-2xl font-black text-slate-900 mt-1">1.250</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500">Đơn hàng luân chuyển</span>
                <p className="text-2xl font-black text-slate-900 mt-1">840</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500">Nhật ký AuditLog</span>
                <p className="text-2xl font-black text-slate-900 mt-1">3.412</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500">Trạng thái API</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">Healthy</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
