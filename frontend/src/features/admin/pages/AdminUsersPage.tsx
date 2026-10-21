import React, { useState } from 'react';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import Badge, { BadgeVariant } from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import { useToast } from '../components/common/ToastContext';

interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

const INITIAL_USERS: AdminUserRow[] = [
  {
    id: 'u-1',
    email: 'admin@madkstore.vn',
    fullName: 'Quản Trị Viên Hệ Thống',
    phoneNumber: '0901234567',
    roles: ['Admin'],
    isActive: true,
    createdAt: '2026-10-11',
  },
  {
    id: 'u-2',
    email: 'sales@madkstore.vn',
    fullName: 'Nguyễn Thị Sales',
    phoneNumber: '0912345678',
    roles: ['Sales'],
    isActive: true,
    createdAt: '2026-10-12',
  },
  {
    id: 'u-3',
    email: 'warehouse@madkstore.vn',
    fullName: 'Trần Văn Kho',
    phoneNumber: '0923456789',
    roles: ['Warehouse'],
    isActive: true,
    createdAt: '2026-10-12',
  },
  {
    id: 'u-4',
    email: 'customer@madkstore.vn',
    fullName: 'Nguyễn Văn Khách',
    phoneNumber: '0987654321',
    roles: ['Customer'],
    isActive: true,
    createdAt: '2026-10-13',
  },
  {
    id: 'u-5',
    email: 'leminh@example.com',
    fullName: 'Lê Văn Minh',
    phoneNumber: '0934567890',
    roles: ['Customer'],
    isActive: false,
    createdAt: '2026-10-14',
  },
];

const AVAILABLE_ROLES = ['Admin', 'Sales', 'Warehouse', 'Customer'];

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRow[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toast = useToast();

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber.includes(searchQuery)
  );

  const handleOpenRoleModal = (user: AdminUserRow) => {
    setSelectedUser(user);
    setSelectedRoles([...user.roles]);
    setIsRoleModalOpen(true);
  };

  const handleToggleRoleSelection = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    if (selectedRoles.length === 0) {
      toast.warning('Người dùng phải có ít nhất 1 vai trò.', 'Cảnh báo');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, roles: selectedRoles } : u))
      );

      toast.success(
        `Đã gán vai trò [${selectedRoles.join(', ')}] cho ${selectedUser.email}`,
        'Phân quyền thành công'
      );
      setIsRoleModalOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi phân quyền.', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLockModal = (user: AdminUserRow) => {
    setSelectedUser(user);
    setIsLockModalOpen(true);
  };

  const handleConfirmLockToggle = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newStatus = !selectedUser.isActive;
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, isActive: newStatus } : u))
      );

      toast.success(
        `Tài khoản ${selectedUser.email} đã được ${newStatus ? 'mở khóa' : 'vô hiệu hóa'}.`,
        'Cập nhật thành công'
      );
      setIsLockModalOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra.', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      key: 'fullName',
      title: 'Họ và tên',
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{row.fullName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      title: 'Số điện thoại',
      render: (row) => <span className="text-xs font-mono text-slate-700">{row.phoneNumber}</span>,
    },
    {
      key: 'roles',
      title: 'Vai trò (Roles)',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((r) => {
            const variant: BadgeVariant =
              r === 'Admin' ? 'purple' : r === 'Sales' ? 'info' : r === 'Warehouse' ? 'warning' : 'neutral';
            return (
              <Badge key={r} variant={variant} size="sm">
                {r}
              </Badge>
            );
          })}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'} dot size="sm">
          {row.isActive ? 'Hoạt động' : 'Đã khóa'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (row) => <span className="text-xs text-slate-500">{row.createdAt}</span>,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenRoleModal(row)}
            className="px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md transition-colors"
          >
            Phân vai trò
          </button>

          <button
            type="button"
            onClick={() => handleOpenLockModal(row)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              row.isActive
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold'
            }`}
          >
            {row.isActive ? 'Khóa' : 'Mở khóa'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Quản lý Người dùng & Phân quyền</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Xem danh sách tài khoản, điều chỉnh vai trò và kiểm soát trạng thái hoạt động.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm theo tên, email hoặc số điện thoại..."
        currentPage={1}
        pageSize={10}
        onPageChange={() => {}}
      />

      {/* Role Assignment Modal */}
      <ConfirmModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onConfirm={handleConfirmRoleChange}
        title="Gán vai trò người dùng"
        message={
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Chọn vai trò hệ thống cho tài khoản:{' '}
              <strong className="text-slate-900">{selectedUser?.email}</strong>
            </p>

            <div className="space-y-2 pt-1">
              {AVAILABLE_ROLES.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(r)}
                    onChange={() => handleToggleRoleSelection(r)}
                    className="w-4 h-4 text-brand-600 rounded-sm border-slate-300 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">{r}</span>
                    <p className="text-[11px] text-slate-500">
                      {r === 'Admin'
                        ? 'Toàn quyền quản trị hệ thống'
                        : r === 'Sales'
                          ? 'Quản lý đơn hàng, mã giảm giá & xem báo cáo'
                          : r === 'Warehouse'
                            ? 'Quản lý kho hàng & xem đơn hàng cần đóng gói'
                            : 'Khách hàng mua sắm thông thường'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        }
        confirmText="Lưu vai trò"
        isLoading={isSubmitting}
      />

      {/* Lock / Unlock Modal */}
      <ConfirmModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onConfirm={handleConfirmLockToggle}
        title={selectedUser?.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={
          selectedUser?.isActive ? (
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn khóa tài khoản{' '}
              <strong className="text-slate-900">{selectedUser?.email}</strong>? Người dùng này sẽ không thể
              đăng nhập cho đến khi được mở khóa lại.
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Mở khóa tài khoản <strong className="text-slate-900">{selectedUser?.email}</strong> để người dùng
              có thể tiếp tục đăng nhập và thao tác bình thường.
            </p>
          )
        }
        confirmText={selectedUser?.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
        variant={selectedUser?.isActive ? 'danger' : 'primary'}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AdminUsersPage;
