import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import authApi from '../../../api/authApi';
import { AddressList } from '../components/AddressList';
import { OrderList } from '../components/orders/OrderList';
import { WishlistList } from '../components/WishlistList';
import { LoyaltyRewardsTab } from '../components/LoyaltyRewardsTab';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  type TabKey = 'profile' | 'security' | 'addresses' | 'orders' | 'wishlist' | 'loyalty';
  const tabParam = searchParams.get('tab') as TabKey | null;
  const validTabs: TabKey[] = ['profile', 'security', 'addresses', 'orders', 'wishlist', 'loyalty'];
  const [activeTab, setActiveTabState] = useState<TabKey>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);

  const setActiveTab = (tab: TabKey) => {
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

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
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

  

  return (
    <div className="py-4 sm:py-6 px-4 md:px-6 max-w-[1200px] mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
        <a className="hover:text-[#1D4ED8]" href="/">Trang chủ</a>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">Tài khoản</span>
        <span className="text-gray-300">/</span>
        <span className="text-[#111827] font-semibold">
          {activeTab === 'profile' && 'Hồ sơ cá nhân'}
          {activeTab === 'orders' && 'Đơn hàng của tôi'}
          {activeTab === 'addresses' && 'Sổ địa chỉ'}
          {activeTab === 'loyalty' && 'Điểm thưởng & Hạng thành viên'}
          {activeTab === 'wishlist' && 'Sản phẩm yêu thích'}
          {activeTab === 'security' && 'Bảo mật tài khoản'}
        </span>
      </nav>

      {/* Main 2-Column Content Layout (Screen 13 Spec) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Vertical Menu (w-full lg:w-64) */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
              <div className="w-11 h-11 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-semibold text-gray-900 truncate">
                  {user?.fullName || 'Khách hàng'}
                </h2>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-blue-50 text-[#1D4ED8] text-[10px] font-semibold rounded border border-blue-100">
                  {user?.roles?.includes('Admin') ? 'Quản trị viên' : 'Diamond Member'}
                </span>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-left ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-left ${
                  activeTab === 'orders'
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  <span>Đơn hàng của tôi</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-left ${
                  activeTab === 'addresses'
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>Sổ địa chỉ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-left ${
                  activeTab === 'loyalty'
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">military_tech</span>
                <span>Điểm thưởng &amp; Hạng VIP</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-left ${
                  activeTab === 'wishlist'
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">favorite</span>
                <span>Sản phẩm yêu thích</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-left ${
                  activeTab === 'security'
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Bảo mật tài khoản</span>
              </button>

              <div className="pt-2 border-t border-[#E5E7EB] mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[#D70018] hover:bg-red-50 rounded text-left transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Help box */}
          <div className="mt-3 bg-white border border-[#E5E7EB] rounded-lg p-3 text-xs text-gray-600">
            <div className="flex items-center gap-2 text-gray-900 font-medium mb-1">
              <span className="material-symbols-outlined text-[16px] text-[#1D4ED8]">support_agent</span>
              <span>Hỗ trợ khách hàng</span>
            </div>
            <p className="text-gray-500 mb-1">Tổng đài giải đáp khiếu nại đơn hàng:</p>
            <a className="text-sm font-semibold text-[#1D4ED8] hover:underline" href="tel:18006868">1800 6868</a>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 w-full space-y-5">
          {/* LOYALTY TIER CARD (Screen 13 Flat Retail Style) */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1D4ED8] text-[20px]">diamond</span>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Thành viên Diamond</h3>
                  <span className="px-2 py-0.5 bg-blue-50 text-[#1D4ED8] text-[10px] font-semibold rounded border border-blue-200">
                    Hạng cao cấp
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mã tài khoản: #{user?.id?.slice(0, 8).toUpperCase() || 'MK-VIP'} • Thành viên thân thiết
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-gray-500">Quyền lợi thành viên</span>
                <div className="text-sm font-bold text-[#1D4ED8]">
                  Chiết khấu 2% • Miễn phí GHN 2h
                </div>
              </div>
            </div>

            {/* Perks Summary Grid */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-[#1D4ED8] flex-shrink-0">percent</span>
                <div>
                  <p className="font-medium text-gray-900">Chiết khấu 2%</p>
                  <p className="text-gray-500 text-[11px]">Trừ trực tiếp vào mỗi đơn</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-[#1D4ED8] flex-shrink-0">local_shipping</span>
                <div>
                  <p className="font-medium text-gray-900">Freeship GHN 2h</p>
                  <p className="text-gray-500 text-[11px]">Miễn phí vận chuyển hỏa tốc</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-[#1D4ED8] flex-shrink-0">cake</span>
                <div>
                  <p className="font-medium text-gray-900">Quà sinh nhật VIP</p>
                  <p className="text-gray-500 text-[11px]">Voucher áp dụng tháng sinh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content Panel */}
          <div>
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
                    Đang hoạt động
                  </p>
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
                    className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
                    className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
                    className="mt-1.5 w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>

                <div className="flex items-center pt-1">
                  <input
                    id="show-pwd-toggle"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="show-pwd-toggle" className="ml-2 text-xs text-slate-600">
                    Hiển thị các ký tự mật khẩu
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwdSubmitting}
                    className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
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

          {/* TAB 5: Wishlist */}
          {activeTab === 'wishlist' && <WishlistList />}

          {/* TAB 6: Loyalty Rewards */}
          {activeTab === 'loyalty' && <LoyaltyRewardsTab />}
        </div>
      </div>
    </div>
  </div>
);
};

export default AccountPage;
