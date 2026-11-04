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

const MOCK_USERS_LIST: AdminUserListItemDto[] = [
  {
    id: 'usr-admin-default',
    email: 'admin@madkstore.vn',
    fullName: 'Quản Trị Viên Hệ Thống',
    phoneNumber: '0901234567',
    isActive: true,
    emailConfirmed: true,
    roles: ['Admin'],
    createdAt: '2026-10-11T12:00:00Z',
  },
  {
    id: 'usr-sales-default',
    email: 'sales@madkstore.vn',
    fullName: 'Nguyễn Thị Sales',
    phoneNumber: '0912345678',
    isActive: true,
    emailConfirmed: true,
    roles: ['Sales'],
    createdAt: '2026-10-11T12:00:00Z',
  },
  {
    id: 'usr-warehouse-default',
    email: 'warehouse@madkstore.vn',
    fullName: 'Trần Văn Kho',
    phoneNumber: '0923456789',
    isActive: true,
    emailConfirmed: true,
    roles: ['Warehouse'],
    createdAt: '2026-10-11T12:00:00Z',
  },
  {
    id: 'usr-customer-default',
    email: 'customer@madkstore.vn',
    fullName: 'Nguyễn Văn Khách',
    phoneNumber: '0987654321',
    isActive: true,
    emailConfirmed: true,
    roles: ['Customer'],
    createdAt: '2026-10-11T12:00:00Z',
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
      return {
        isSuccess: true,
        data: {
          items: MOCK_USERS_LIST,
          page: 1,
          pageSize: 10,
          totalItems: MOCK_USERS_LIST.length,
          totalPages: 1,
        },
      };
    } catch {
      return {
        isSuccess: true,
        data: {
          items: MOCK_USERS_LIST,
          page: 1,
          pageSize: 10,
          totalItems: MOCK_USERS_LIST.length,
          totalPages: 1,
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
