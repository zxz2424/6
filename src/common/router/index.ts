// 3d-visualization-platform\src\common\router\index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/common/store/modules/user/user'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/home/index.vue'),
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/index.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/3d',
    name: '3D',
    component: () => import('@/pages/3d/scene/index.vue'),
    meta: {
      title: '3D场景',
      requiresAuth: true
    }
  },

  {
    path: '/monitor',
    name: 'Monitor',
    component: () => import('@/layouts/basic-layout.vue'),
    meta: {
      title: '实时监控',
      requiresAuth: true,
      icon: 'Monitor',
      //permissions: ['monitor:view']
    },
    redirect: '/monitor/realtime',
    children: [
      {
        path: 'realtime',
        name: 'MonitorRealtime',
        component: () => import('@/pages/monitor/realtime/index.vue'),
        meta: {
          title: '实时监控',
          icon: 'View',
          //permissions: ['monitor:realtime:view']
        }
      }
    ]
  },
  {
    path: '/alarm',
    name: 'Alarm',
    component: () => import('@/pages/alarm/index.vue'),
    meta: {
      title: '告警管理',
      requiresAuth: true,
      permission: 'alarm:view',
      icon: 'Warning'
    }
  },
  {
    path: '/business',
    name: 'ScriptEditor',
    component: () => import('@/pages/business/script-editor/index.vue'),
    alias: '/script-editor',
    meta: {
      title: '脚本编辑器',
      requiresAuth: true,
      // permissions: ['business:script:editor']
    }
  },
  {
    path: '/log',
    name: 'Log',
    component: () => import('@/pages/log/index.vue').catch(err => {
      console.error('日志管理组件加载失败：', err);
      return import('@/pages/404/index.vue');
    }),
    meta: {
      title: '系统日志',
      requiresAuth: true,
      permission: 'log:view', 
      icon: 'Document'
    }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/pages/statistics/index.vue'),
    meta: {
      title: '数据统计',
      requiresAuth: true
    }
  },
  {
    path: '/system',
    name: 'System',
    component: () => import('@/pages/system/index.vue'),
    redirect: '/system/user',
    meta: {
      title: '系统管理',
      requiresAuth: true,
      permissions: ['system:user:query']
    },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/pages/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          requiresAuth: true,
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
          requiresAuth: true,
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
          requiresAuth: true,
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
          requiresAuth: true,
          permissions: ['system:config:query']
        }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/403/index.vue'),
    meta: {
      title: '无权限访问',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/404/index.vue'),
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 权限控制
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 3D可视化平台`
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.token) {
    console.log('需要登录，跳转到登录页')
    next('/login')
    return
  }

  // 特殊处理：访问 /system 根路径时，检查是否有系统管理权限
  if (to.path === '/system') {
    // 检查用户是否有任意系统管理权限
    const hasSystemPermission = userStore.permissions?.some(perm => 
      perm.startsWith('system:')
    )
    
    if (hasSystemPermission) {
      console.log('有系统管理权限，重定向到用户管理')
      next('/system/user')
    } else {
      console.warn('无系统管理权限，跳转到403')
      console.log('用户权限:', userStore.permissions)
      next('/403')
    }
    return
  }

  // 检查权限 - 对于需要特定权限的路由
  if (to.meta.permissions) {
    const hasPermission = userStore.permissions?.some(permission => 
      (to.meta.permissions as string[]).includes(permission)
    )
    
    if (!hasPermission) {
      console.warn('权限不足，需要的权限：', to.meta.permissions, '用户权限：', userStore.permissions)
      next('/403')
      return
    }
  }

  next()
})

export default router