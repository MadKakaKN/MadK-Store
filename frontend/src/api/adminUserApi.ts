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

export const adminUserApi = {
  /**
   * Lấy danh sách người dùng hệ thống có phân trang, tìm kiếm và lọc vai trò
   */
  async getUsers(filter: UserFilterParams = {}): Promise<ApiEnvelope<PagedResult<AdminUserListItemDto>>> {
    const res = await apiClient.get<ApiEnvelope<PagedResult<AdminUserListItemDto>>>('/admin/users', {
      params: filter,
    });
    return res.data;
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
