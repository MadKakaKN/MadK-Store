import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import authApi from '../../../api/authApi';
import { AddressList } from '../components/AddressList';
import { OrderList } from '../components/orders/OrderList';

export const AccountPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as 'profile' | 'security' | 'addresses' | 'orders' | null;
  const validTabs = ['profile', 'security', 'addresses', 'orders'];
  const [activeTab, setActiveTabState] = useState<'profile' | 'security' | 'addresses' | 'orders'>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);

  const setActiveTab = (tab: 'profile' | 'security' | 'addresses' | 'orders') => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Test silent refresh state
  const [refreshTestStatus, setRefreshTestStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!currentPassword) {
      setPwdError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setPwdSubmitting(true);
    const res = await authApi.changePassword({
      currentPassword,
      newPassword,
    });
    setPwdSubmitting(false);

    if (res.isSuccess) {
      setPwdSuccess('Đổi mật khẩu thành công! Các phiên đăng nhập khác đã được thu hồi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPwdError(res.error || 'Đổi mật khẩu thất bại.');
    }
  };

  const handleTestSilentRefresh = async () => {
    setRefreshTestStatus('Đang kiểm tra làm mới token ngầm...');
    try {
      // Gọi getMe qua apiClient (nếu token hết hạn, interceptor sẽ tự động refresh token)
      const res = await authApi.getMe();
      if (res.isSuccess) {
        setRefreshTestStatus('✅ Phiên làm việc hợp lệ! Dữ liệu tài khoản đã được đồng bộ mà không gián đoạn.');
        refreshUser();
      } else {
        setRefreshTestStatus(`⚠️ ${res.error || 'Phiên làm việc không phản hồi'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kiểm tra token';
      setRefreshTestStatus(`❌ Lỗi: ${msg}`);
    }
    setTimeout(() => setRefreshTestStatus(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shadow-brand-600/30 flex-shrink-0">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {user?.fullName || 'Người dùng MadK'}
              </h1>
              {user?.roles?.map((role) => (
                <span
                  key={role}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    role === 'Admin'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span>{user?.email}</span>
              {user?.emailConfirmed ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  ✓ Đã xác thực
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                  ! Chưa xác thực email
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestSilentRefresh}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 shadow-2xs"
            title="Thử nghiệm cơ chế làm mới token ngầm không làm gián đoạn người dùng"
          >
            🔄 Kiểm tra Token ngầm
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 shadow-2xs"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {refreshTestStatus && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm animate-fade-in flex items-center justify-between">
          <span>{refreshTestStatus}</span>
          <button
            type="button"
            onClick={() => setRefreshTestStatus(null)}
            className="text-xs text-indigo-600 font-bold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Account Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-sm space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-brand-50 text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">👤</span>
              <span>Thông tin tài khoản</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-brand-50 text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">🔒</span>
              <span>Bảo mật & Mật khẩu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'addresses'
                  ? 'bg-brand-50 text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">📍</span>
              <span>Sổ địa chỉ</span>
              <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                VN 63 tỉnh
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-brand-50 text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">📦</span>
              <span>Đơn hàng của tôi</span>
              <span className="ml-auto text-[10px] bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                Trực tiếp
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900 pb-4 border-b border-slate-100">
                Thông tin cá nhân
              </h2>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{user?.fullName || 'Chưa cập nhật'}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ Email</label>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{user?.email}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</label>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {user?.phoneNumber || 'Chưa cập nhật số điện thoại'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái tài khoản</label>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang hoạt động (Active)
                  </p>
                </div>
              </div>

              {/* Roles & Permissions detail */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Phân quyền hệ thống (RBAC)</h3>
                <div className="flex flex-wrap gap-2">
                  {user?.roles?.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      Vai trò: <strong>{r}</strong>
                    </span>
                  ))}
                  {user?.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-mono border border-indigo-100"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic py-1">Quyền chuẩn khách hàng storefront</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Change Password & Security */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm max-w-xl">
              <h2 className="text-lg font-extrabold text-slate-900 pb-4 border-b border-slate-100">
                Đổi mật khẩu tài khoản
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                Để bảo vệ an toàn cho tài khoản, vui lòng sử dụng mật khẩu mạnh từ 6 ký tự trở lên.
              </p>

              {pwdSuccess && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  {pwdSuccess}
                </div>
              )}

              {pwdError && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                  {pwdError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    required
                  />
                </div>

                <div className="flex items-center pt-1">
                  <input
                    id="show-pwd-toggle"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                  />
                  <label htmlFor="show-pwd-toggle" className="ml-2 text-xs text-slate-600">
                    Hiển thị các ký tự mật khẩu
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwdSubmitting}
                    className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all"
                  >
                    {pwdSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Addresses */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <AddressList userId={user?.id} />
            </div>
          )}

          {/* TAB 4: Orders Management */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <div className="mb-6 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Quản lý Đơn hàng</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Theo dõi vòng đời đơn hàng, lịch sử chuyển trạng thái và hủy đơn COD khi còn hợp lệ.
                  </p>
                </div>
              </div>
              <OrderList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
