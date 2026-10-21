import { UserDto } from '../../../types/auth';

export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  description?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    path: '/admin',
    icon: '📊',
    description: 'Thống kê tổng thể hoạt động kinh doanh',
    requiredRoles: ['Admin', 'Sales', 'Warehouse'],
  },
  {
    id: 'orders',
    label: 'Đơn hàng',
    path: '/admin/orders',
    icon: '📦',
    description: 'Quản lý, duyệt trạng thái & xuất hàng',
    requiredPermissions: ['order.view'],
  },
  {
    id: 'returns',
    label: 'Đổi trả & Hoàn tiền',
    path: '/admin/returns',
    icon: '↩️',
    description: 'Xử lý yêu cầu đổi trả, thẩm định và hoàn tiền',
    requiredPermissions: ['order.view'],
  },
  {
    id: 'inventory',
    label: 'Tồn kho',
    path: '/admin/inventory',
    icon: '🏭',
    description: 'Theo dõi tồn OnHand, Reserved và nhập hàng',
    requiredPermissions: ['inventory.view'],
  },
  {
    id: 'catalog',
    label: 'Sản phẩm & Danh mục',
    path: '/admin/catalog',
    icon: '🏷️',
    description: 'Quản lý sản phẩm, danh mục, thương hiệu và model 3D',
    requiredPermissions: ['catalog.manage'],
  },
  {
    id: 'pricing',
    label: 'Giá & Khuyến mãi',
    path: '/admin/pricing',
    icon: '💰',
    description: 'Lịch sử giá, khuyến mãi theo thời gian cho từng biến thể',
    requiredPermissions: ['catalog.manage'],
  },
  {
    id: 'discounts',
    label: 'Mã giảm giá',
    path: '/admin/discounts',
    icon: '🎟️',
    description: 'Quản lý voucher và chương trình ưu đãi',
    requiredPermissions: ['discount.manage'],
  },
  {
    id: 'users',
    label: 'Người dùng & Quyền',
    path: '/admin/users',
    icon: '👥',
    description: 'Danh sách khách hàng, nhân viên và gán vai trò',
    requiredPermissions: ['user.view'],
  },
  {
    id: 'audit-logs',
    label: 'Audit Log',
    path: '/admin/audit-logs',
    icon: '📜',
    description: 'Lịch sử thao tác quan trọng của nhân viên',
    requiredPermissions: ['audit.view'],
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    path: '/admin/reports',
    icon: '📈',
    description: 'Báo cáo doanh thu, tồn kho và hệ thống',
    requiredPermissions: ['report.revenue', 'report.inventory', 'report.all'],
  },
];

/**
 * Lọc danh sách menu hiển thị dựa trên vai trò và quyền hạn của người dùng đăng nhập.
 * - Admin: Toàn quyền xem mọi menu.
 * - Non-admin: Chỉ xem các menu mà họ sở hữu vai trò hoặc quyền tương ứng.
 */
export function getVisibleAdminNavItems(user: UserDto | null): AdminNavItem[] {
  if (!user) return [];

  // Admin có toàn quyền xem tất cả
  if (user.roles?.includes('Admin')) {
    return ADMIN_NAV_ITEMS;
  }

  const userRoles = new Set(user.roles || []);
  const userPerms = new Set(user.permissions || []);

  return ADMIN_NAV_ITEMS.filter((item) => {
    // Kiểm tra theo role nếu có
    if (item.requiredRoles && item.requiredRoles.some((r) => userRoles.has(r))) {
      return true;
    }

    // Kiểm tra theo permission nếu có
    if (item.requiredPermissions && item.requiredPermissions.some((p) => userPerms.has(p))) {
      return true;
    }

    return false;
  });
}
