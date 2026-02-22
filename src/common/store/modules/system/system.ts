import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemStore = defineStore('system', () => {
  // 用户管理
  const users = ref([])
  const userTotal = ref(0)
  const userLoading = ref(false)
  
  // 角色管理
  const roles = ref([])
  const roleLoading = ref(false)
  
  // 权限管理
  const permissions = ref([])
  const permissionTree = ref([])
  const permissionLoading = ref(false) // 添加权限加载状态
  
  // 系统配置
  const systemConfig = ref(null)
  const configLoading = ref(false)

  // 用户管理方法
  const fetchUsers = async (params: any) => {
    userLoading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      users.value = [
        { id: '1', username: 'admin', nickname: '超级管理员', status: 'active' },
        { id: '2', username: 'user1', nickname: '普通用户', status: 'active' }
      ]
      userTotal.value = 2
    } finally {
      userLoading.value = false
    }
  }

  const createUser = async (data: any) => {
    // 模拟创建用户
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('创建用户:', data)
  }

  const updateUser = async (data: any) => {
    // 模拟更新用户
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('更新用户:', data)
  }

  const deleteUser = async (id: string) => {
    // 模拟删除用户
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('删除用户:', id)
  }

  // 角色管理方法
  const fetchRoles = async () => {
    roleLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      roles.value = [
        { id: '1', name: '超级管理员', code: 'super_admin' },
        { id: '2', name: '普通用户', code: 'user' }
      ]
    } finally {
      roleLoading.value = false
    }
  }

  const createRole = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('创建角色:', data)
  }

  // 权限管理方法 - 新增
  const fetchPermissionTree = async () => {
    permissionLoading.value = true
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟权限树数据
      const mockPermissionTree = [
        {
          id: '1',
          name: '系统管理',
          code: 'system',
          type: 'menu',
          path: '/system',
          icon: 'Setting',
          sort: 1,
          status: 'active',
          children: [
            {
              id: '2',
              name: '用户管理',
              code: 'system:user',
              type: 'menu',
              path: '/system/user',
              icon: 'User',
              sort: 1,
              status: 'active',
              children: [
                { 
                  id: '3', 
                  name: '用户查询', 
                  code: 'system:user:query', 
                  type: 'button', 
                  sort: 1, 
                  status: 'active' 
                },
                { 
                  id: '4', 
                  name: '用户新增', 
                  code: 'system:user:create', 
                  type: 'button', 
                  sort: 2, 
                  status: 'active' 
                },
                { 
                  id: '5', 
                  name: '用户编辑', 
                  code: 'system:user:update', 
                  type: 'button', 
                  sort: 3, 
                  status: 'active' 
                },
                { 
                  id: '6', 
                  name: '用户删除', 
                  code: 'system:user:delete', 
                  type: 'button', 
                  sort: 4, 
                  status: 'active' 
                }
              ]
            },
            {
              id: '7',
              name: '角色管理',
              code: 'system:role',
              type: 'menu',
              path: '/system/role',
              icon: 'UserFilled',
              sort: 2,
              status: 'active',
              children: [
                { 
                  id: '8', 
                  name: '角色查询', 
                  code: 'system:role:query', 
                  type: 'button', 
                  sort: 1, 
                  status: 'active' 
                },
                { 
                  id: '9', 
                  name: '角色新增', 
                  code: 'system:role:create', 
                  type: 'button', 
                  sort: 2, 
                  status: 'active' 
                },
                { 
                  id: '10', 
                  name: '角色编辑', 
                  code: 'system:role:update', 
                  type: 'button', 
                  sort: 3, 
                  status: 'active' 
                },
                { 
                  id: '11', 
                  name: '角色删除', 
                  code: 'system:role:delete', 
                  type: 'button', 
                  sort: 4, 
                  status: 'active' 
                }
              ]
            },
            {
              id: '12',
              name: '权限管理',
              code: 'system:permission',
              type: 'menu',
              path: '/system/permission',
              icon: 'Lock',
              sort: 3,
              status: 'active',
              children: [
                { 
                  id: '13', 
                  name: '权限查询', 
                  code: 'system:permission:query', 
                  type: 'button', 
                  sort: 1, 
                  status: 'active' 
                },
                { 
                  id: '14', 
                  name: '权限新增', 
                  code: 'system:permission:create', 
                  type: 'button', 
                  sort: 2, 
                  status: 'active' 
                },
                { 
                  id: '15', 
                  name: '权限编辑', 
                  code: 'system:permission:update', 
                  type: 'button', 
                  sort: 3, 
                  status: 'active' 
                },
                { 
                  id: '16', 
                  name: '权限删除', 
                  code: 'system:permission:delete', 
                  type: 'button', 
                  sort: 4, 
                  status: 'active' 
                }
              ]
            }
          ]
        },
        {
          id: '17',
          name: '3D可视化',
          code: '3d',
          type: 'menu',
          path: '/3d',
          icon: 'MapLocation',
          sort: 2,
          status: 'active',
          children: [
            {
              id: '18',
              name: '场景管理',
              code: '3d:scene',
              type: 'menu',
              path: '/3d/scene',
              icon: 'Picture',
              sort: 1,
              status: 'active',
              children: [
                { 
                  id: '19', 
                  name: '场景查看', 
                  code: '3d:scene:view', 
                  type: 'button', 
                  sort: 1, 
                  status: 'active' 
                },
                { 
                  id: '20', 
                  name: '场景编辑', 
                  code: '3d:scene:edit', 
                  type: 'button', 
                  sort: 2, 
                  status: 'active' 
                }
              ]
            }
          ]
        }
      ]
      
      permissionTree.value = mockPermissionTree
      return mockPermissionTree
    } finally {
      permissionLoading.value = false
    }
  }

  const createPermission = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('创建权限:', data)
  }

  const updatePermission = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('更新权限:', data)
  }

  const deletePermission = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('删除权限:', id)
  }

  // 系统配置方法
  const fetchSystemConfig = async () => {
    configLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      systemConfig.value = {
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
      }
      return systemConfig.value
    } finally {
      configLoading.value = false
    }
  }

  const updateSystemConfig = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('更新系统配置:', data)
  }

  return {
    // 状态
    users,
    userTotal,
    userLoading,
    roles,
    roleLoading,
    permissions,
    permissionTree,
    permissionLoading,
    systemConfig,
    configLoading,
    
    // 方法
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchRoles,
    createRole,
    fetchPermissionTree, 
    createPermission,
    updatePermission,    
    deletePermission,
    fetchSystemConfig,
    updateSystemConfig
  }
})