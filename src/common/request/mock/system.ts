import type { User, Role, Permission, SystemConfig, ListResponse } from '@/types/system';

// 模拟数据
let users: User[] = [
  {
    id: '1',
    username: 'admin',
    nickname: '超级管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    status: 'active',
    createTime: '2024-01-01 10:00:00',
    lastLoginTime: '2024-02-03 09:30:00',
    roles: []
  }
];

let roles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有所有权限',
    createTime: '2024-01-01 10:00:00',
    permissions: []
  }
];

let permissions: Permission[] = [
  {
    id: '1',
    name: '系统管理',
    code: 'system',
    type: 'menu',
    children: [
      {
        id: '2',
        name: '用户管理',
        code: 'system:user',
        type: 'menu',
        parentId: '1'
      },
      {
        id: '3',
        name: '角色管理',
        code: 'system:role',
        type: 'menu',
        parentId: '1'
      }
    ]
  }
];

const systemConfig: SystemConfig = {
  scene: {
    baseMap: 'amap',
    terrain: true,
    defaultView: {
      longitude: 116.3974,
      latitude: 39.9093,
      height: 1000,
      heading: 0,
      pitch: -45
    }
  },
  refresh: {
    frequency: 5,
    realtime: true
  },
  theme: {
    mode: 'light',
    primaryColor: '#409EFF'
  },
  security: {
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    sessionTimeout: 7200
  }
};

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockUserApi = {
  async getUsers(params: any) {
    await delay(500);
    const { page = 1, size = 10, keyword = '' } = params;
    
    let filteredUsers = users;
    if (keyword) {
      filteredUsers = users.filter(user => 
        user.username.includes(keyword) || 
        user.nickname.includes(keyword) ||
        user.email.includes(keyword)
      );
    }
    
    const start = (page - 1) * size;
    const end = start + size;
    const list = filteredUsers.slice(start, end);
    
    return {
      code: 200,
      message: 'success',
      {
        list,
        total: filteredUsers.length,
        page,
        size
      }
    };
  },

  async createUser any) {
    await delay(300);
    const newUser = {
      ...data,
      id: Date.now().toString(),
      createTime: new Date().toISOString(),
      roles: []
    };
    users.push(newUser);
    return { code: 200, message: '创建成功', data: newUser.id };
  },

  async updateUser(data: any) {
    await delay(300);
    const index = users.findIndex(user => user.id === data.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
    }
    return { code: 200, message: '更新成功' };
  },

  async deleteUser(id: string) {
    await delay(300);
    users = users.filter(user => user.id !== id);
    return { code: 200, message: '删除成功' };
  }
};

export const mockRoleApi = {
  async getRoles() {
    await delay(300);
    return { code: 200, message: 'success', data: roles };
  },

  async createRole(data: any) {
    await delay(300);
    const newRole = {
      ...data,
      id: Date.now().toString(),
      createTime: new Date().toISOString(),
      permissions: []
    };
    roles.push(newRole);
    return { code: 200, message: '创建成功', data: newRole.id };
  }
};

export const mockConfigApi = {
  async getConfig() {
    await delay(300);
    return { code: 200, message: 'success', systemConfig };
  },

  async updateConfig(data: any) {
    await delay(300);
    Object.assign(systemConfig, data);
    return { code: 200, message: '更新成功' };
  }
};