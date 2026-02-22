import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 开发环境下的默认用户数据
  const defaultUser = {
    id: 1,
    username: 'admin',
    nickname: '管理员',
    avatar: '',
    roles: ['admin'],
    permissions: [
      'system:user:query',
      'system:user:add', 
      'system:user:edit',
      'system:user:delete',
      'system:role:query',
      'system:role:add',
      'system:role:edit', 
      'system:role:delete',
      'system:permission:query',
      'system:permission:add',
      'system:permission:edit',
      'system:permission:delete',
      'system:config:query',
      'system:config:edit',
      'business:script:editor',
      '3d:scene:view',
      'monitor:view', 
      'alarm:view',
      'log:view',
      'statistics:view'
    ]
  }

  // 初始化状态
  const token = ref(import.meta.env.DEV ? 'dev-token-' + Date.now() : '')
  const userInfo = ref<any>(import.meta.env.DEV ? defaultUser : null)
  const permissions = ref<string[]>(import.meta.env.DEV ? defaultUser.permissions : [])

  const setToken = (newToken: string) => {
    token.value = newToken
  }

  const setUserInfo = (info: any) => {
    userInfo.value = info
  }

  const setPermissions = (perms: string[]) => {
    permissions.value = perms
  }

  const clearUserInfo = () => {
    token.value = ''
    userInfo.value = null
    permissions.value = []
  }

  // 检查是否有权限 - 开发模式默认有所有权限
  const hasPermission = (permission: string | string[]): boolean => {
    // 开发环境：返回true，拥有所有权限
    if (import.meta.env.DEV) {
      return true
    }
    
    if (!permissions.value.length) return false
    
    if (Array.isArray(permission)) {
      return permission.some(perm => permissions.value.includes(perm))
    }
    return permissions.value.includes(permission)
  }

  // 开发环境：自动登录
  const autoLoginForDev = () => {
    if (import.meta.env.DEV && !token.value) {
      token.value = 'dev-token-' + Date.now()
      userInfo.value = defaultUser
      permissions.value = defaultUser.permissions
      console.log('开发环境：自动登录为管理员用户')
    }
  }

  return {
    token,
    userInfo,
    permissions,
    setToken,
    setUserInfo,
    setPermissions,
    clearUserInfo,
    hasPermission,
    autoLoginForDev
  }
})