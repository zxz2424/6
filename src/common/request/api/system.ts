import { request } from '../axios';
import { mockUserApi, mockRoleApi, mockConfigApi } from '../mock/system';
import type { 
  User, CreateUserParams, UpdateUserParams, Role, Permission, 
  SystemConfig, ListResponse, UserQueryParams, CreateRoleParams 
} from '@/types/system';

import { useUserStore } from '@/common/store/modules/user/user'

// 用户管理API
export const userApi = {
  getUsers: (params: UserQueryParams) => 
    // TODO: 对接真实API后替换为：request.get<ListResponse<User>>('/api/system/users', { params })
    mockUserApi.getUsers(params) as Promise<any>,

  createUser: ( CreateUserParams) =>
    // request.post<string>('/api/system/user', data)
    mockUserApi.createUser(data) as Promise<any>,

  updateUser: ( UpdateUserParams) =>
    // request.put<void>(`/api/system/user/${data.id}`, data)
    mockUserApi.updateUser(data) as Promise<any>,

  deleteUser: (id: string) =>
    // request.delete<void>(`/api/system/user/${id}`)
    mockUserApi.deleteUser(id) as Promise<any>,

  resetPassword: (id: string, password: string) =>
    request.patch<void>(`/api/system/user/${id}/password`, { password })
};

// 角色管理API
export const roleApi = {
  getRoles: () => 
    // request.get<Role[]>('/api/system/roles')
    mockRoleApi.getRoles() as Promise<any>,

  createRole: (data: CreateRoleParams) =>
    // request.post<string>('/api/system/role', data)
    mockRoleApi.createRole(data) as Promise<any>,

  updateRole: ( Role) =>
    request.put<void>(`/api/system/role/${data.id}`, data),

  deleteRole: (id: string) =>
    request.delete<void>(`/api/system/role/${id}`),

  assignPermissions: (roleId: string, permissionIds: string[]) =>
    request.post<void>(`/api/system/role/${roleId}/permissions`, { permissionIds })
};

// 权限管理API
export const permissionApi = {
  getPermissions: () => request.get<Permission[]>('/api/system/permissions'),
  getPermissionTree: () => request.get<Permission[]>('/api/system/permissions/tree'),
  updateDataPermission: (roleId: string, dataScope: string, deptIds?: string[]) =>
    request.post<void>(`/api/system/role/${roleId}/data-permission`, { dataScope, deptIds })
};

// 系统配置API
export const configApi = {
  getConfig: () => 
    // request.get<SystemConfig>('/api/system/config')
    mockConfigApi.getConfig() as Promise<any>,

  updateConfig: (data: Partial<SystemConfig>) =>
    // request.put<void>('/api/system/config', data)
    mockConfigApi.updateConfig(data) as Promise<any>,

  updateSceneConfig: (data: Partial<SystemConfig['scene']>) =>
    request.patch<void>('/api/system/config/scene', data),

  getLogs: (params: any) =>
    request.get<ListResponse<any>>('/api/system/logs', { params }),

  exportLogs: (params: any) =>
    request.post<{ url: string }>('/api/system/logs/export', params, { responseType: 'blob' })
};