import type { RouteRecordRaw } from 'vue-router';

const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    name: 'System',
    component: () => import('@/layouts/basic-layout.vue'),
    meta: {
      title: '系统管理',
      icon: 'Setting',
      requiresAuth: true,
      permissions: ['system:access']
    },
    redirect: '/system/user',
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/pages/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          permissions: ['system:user:query']
        }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/pages/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          permissions: ['system:role:query']
        }
      },
      {
        path: 'permission',
        name: 'SystemPermission',
        component: () => import('@/pages/system/permission/index.vue'),
        meta: {
          title: '权限管理',
          icon: 'Lock',
          permissions: ['system:permission:query']
        }
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/pages/system/config/index.vue'),
        meta: {
          title: '系统配置',
          icon: 'Setting',
          permissions: ['system:config:query']
        }
      }
    ]
  }
];

export default systemRoutes;