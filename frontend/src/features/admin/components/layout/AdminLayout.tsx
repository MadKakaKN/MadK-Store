import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export const AdminLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.removeItem('madk_admin_sidebar_collapsed');
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-gray-900 font-sans text-[13px]">
      {/* Sidebar - Solid Charcoal 240px */}
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
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
