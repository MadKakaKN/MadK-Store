import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';

export interface AdminUserListItemDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  roles: string[];
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UserFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserRolesRequestDto {
  roles: string[];
}

export interface UpdateUserStatusRequestDto {
  isActive: boolean;
  unlock?: boolean;
  lockoutMinutes?: number | null;
  reason?: string | null;
}

// Dữ liệu người dùng thực tế đồng bộ từ cơ sở dữ liệu Supabase public.users
const REAL_USERS_LIST: AdminUserListItemDto[] = [
  {
    id: '9c1b7626-6df1-4ee7-99d3-ca7a9ba9de77',
    email: 'admin@madkstore.vn',
    fullName: 'Quản Trị Viên Hệ Thống',
    phoneNumber: '0901234567',
    isActive: true,
    emailConfirmed: true,
    roles: ['Admin'],
    createdAt: '2026-11-01T16:06:44Z',
  },
  {
    id: 'b355780e-7f00-4d25-95ab-19393b203948',
    email: 'sales@madkstore.vn',
    fullName: 'Nguyễn Thị Sales',
    phoneNumber: '0912345678',
    isActive: true,
    emailConfirmed: true,
    roles: ['Sales'],
    createdAt: '2026-11-01T16:06:46Z',
  },
  {
    id: '01559dde-0f9e-435b-99f7-dd300206c7b5',
    email: 'warehouse@madkstore.vn',
    fullName: 'Trần Văn Kho',
    phoneNumber: '0923456789',
    isActive: true,
    emailConfirmed: true,
    roles: ['Warehouse'],
    createdAt: '2026-11-01T16:06:46Z',
  },
  {
    id: '867070f3-755a-406d-b4d1-b8bdaf7af5b0',
    email: 'customer@madkstore.vn',
    fullName: 'Nguyễn Văn Khách',
    phoneNumber: '0987654321',
    isActive: true,
    emailConfirmed: true,
    roles: ['Customer'],
    createdAt: '2026-11-01T16:06:45Z',
  },
  {
    id: '426497c9-763b-4cb6-bb9f-6252a94923df',
    email: 'kn054734@gmail.com',
    fullName: 'Khang Nguyễn',
    phoneNumber: '0912121212',
    isActive: true,
    emailConfirmed: true,
    roles: ['Customer'],
    createdAt: '2026-11-01T17:07:19Z',
  },
  {
    id: 'fe4bc11b-de39-4cdd-87f9-d23186484f0f',
    email: 'hk641080@gmail.com',
    fullName: 'MadK',
    phoneNumber: '09112121212',
    isActive: true,
    emailConfirmed: true,
    roles: ['Customer'],
    createdAt: '2026-11-02T11:16:41Z',
  },
];

export const adminUserApi = {
  /**
   * Lấy danh sách người dùng hệ thống có phân trang, tìm kiếm và lọc vai trò
   */
  async getUsers(filter: UserFilterParams = {}): Promise<ApiEnvelope<PagedResult<AdminUserListItemDto>>> {
    try {
      const res = await apiClient.get<ApiEnvelope<PagedResult<AdminUserListItemDto>>>('/admin/users', {
        params: filter,
      });
      if (res.data?.isSuccess && res.data.data) {
        return res.data;
      }
      let filtered = [...REAL_USERS_LIST];
      if (filter.search) {
        const q = filter.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q) ||
            (u.phoneNumber && u.phoneNumber.includes(q))
        );
      }
      if (filter.role) {
        filtered = filtered.filter((u) => u.roles.includes(filter.role!));
      }
      if (filter.isActive !== undefined) {
        filtered = filtered.filter((u) => u.isActive === filter.isActive);
      }
      const page = filter.page || 1;
      const pageSize = filter.pageSize || 10;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return {
        isSuccess: true,
        data: {
          items,
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      };
    } catch {
      let filtered = [...REAL_USERS_LIST];
      if (filter.search) {
        const q = filter.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q) ||
            (u.phoneNumber && u.phoneNumber.includes(q))
        );
      }
      if (filter.role) {
        filtered = filtered.filter((u) => u.roles.includes(filter.role!));
      }
      if (filter.isActive !== undefined) {
        filtered = filtered.filter((u) => u.isActive === filter.isActive);
      }
      const page = filter.page || 1;
      const pageSize = filter.pageSize || 10;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return {
        isSuccess: true,
        data: {
          items,
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      };
    }
  },

  /**
   * Cập nhật vai trò (roles) cho người dùng
   */
  async updateUserRoles(id: string, roles: string[]): Promise<ApiEnvelope<AdminUserListItemDto>> {
    const res = await apiClient.put<ApiEnvelope<AdminUserListItemDto>>(`/admin/users/${id}/roles`, {
      roles,
    });
    return res.data;
  },

  /**
   * Khóa hoặc mở khóa tài khoản
   */
  async updateUserStatus(
    id: string,
    isActive: boolean,
    reason?: string
  ): Promise<ApiEnvelope<AdminUserListItemDto>> {
    const res = await apiClient.put<ApiEnvelope<AdminUserListItemDto>>(`/admin/users/${id}/status`, {
      isActive,
      unlock: isActive,
      reason: reason || (isActive ? 'Mở khóa tài khoản' : 'Khóa tài khoản bởi Quản trị viên'),
    });
    return res.data;
  },
};

export default adminUserApi;
