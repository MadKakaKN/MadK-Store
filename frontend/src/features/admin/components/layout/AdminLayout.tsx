import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export const AdminLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Dọn dẹp trạng thái thu nhỏ cũ nếu có trong localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('madk_admin_sidebar_collapsed');
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 flex text-slate-800">
      {/* Sidebar - Cố định toàn phần, không thu nhỏ */}
      <AdminSidebar
        isCollapsed={false}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
