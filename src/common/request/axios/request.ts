import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/common/store/modules/user/user'

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 开发环境使用Mock数据
const isDev = import.meta.env.DEV
const useMock = import.meta.env.VITE_MOCK_ENABLED === 'true'

// Mock数据函数
const mockResponse = (url: string, method: string, config?: AxiosRequestConfig) => {
  console.log(`[Mock] ${method.toUpperCase()} ${url}`, config?.params || config?.data)
  
  // 模拟延迟
  const delay = Math.random() * 500 + 200
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // 根据不同URL返回不同的Mock数据
      if (url.includes('/device/list')) {
        resolve({
          code: 200,
          message: '成功',
          data: {
            list: [
              { id: '1', name: '温度传感器01', type: 'temperature', status: 'online', lat: 31.2304, lng: 121.4737, value: 25.5, unit: '°C', updateTime: new Date().toISOString() },
              { id: '2', name: '湿度传感器01', type: 'humidity', status: 'online', lat: 31.2310, lng: 121.4740, value: 65.2, unit: '%', updateTime: new Date().toISOString() },
              { id: '3', name: '压力传感器01', type: 'pressure', status: 'error', lat: 31.2298, lng: 121.4730, value: 1.2, unit: 'MPa', updateTime: new Date().toISOString() },
              { id: '4', name: '温度传感器02', type: 'temperature', status: 'offline', lat: 31.2300, lng: 121.4750, value: 0, unit: '°C', updateTime: new Date(Date.now() - 3600000).toISOString() }
            ],
            total: 4,
            page: 1,
            size: 10
          }
        })
      } else if (url.includes('/alarm/list')) {
        resolve({
          code: 200,
          message: '成功',
          data: {
            list: [
              { id: '1', deviceId: '3', deviceName: '压力传感器01', type: '高压报警', level: 'high', time: new Date().toISOString(), status: 'unprocessed' },
              { id: '2', deviceId: '1', deviceName: '温度传感器01', type: '高温预警', level: 'medium', time: new Date(Date.now() - 1800000).toISOString(), status: 'processed' }
            ],
            total: 2
          }
        })
      } else if (url.includes('/device/detail')) {
        resolve({
          code: 200,
          message: '成功',
          data: {
            id: '1',
            name: '温度传感器01',
            type: 'temperature',
            status: 'online',
            lat: 31.2304,
            lng: 121.4737,
            value: 25.5,
            unit: '°C',
            updateTime: new Date().toISOString(),
            manufacturer: '模拟设备公司',
            model: 'TEMP-1000',
            installTime: '2024-01-01',
            maintenanceInfo: '下次维护: 2024-12-01'
          }
        })
      } else {
        resolve({
          code: 200,
          message: 'Mock成功',
          data: {}
        })
      }
    }, delay)
  })
}

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 开发环境且启用Mock时，拦截请求
    if (isDev && useMock) {
      // 标记这个请求应该被Mock
      (config as any).__mock = true
    }
    
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data, config } = response
    
    // 如果是Mock请求，直接返回Mock数据
    if ((config as any).__mock) {
      return data
    }
    
    // 支持项目1的响应格式 { Success, ErrCode, ErrMsg, ResData }
    if (data.Success !== undefined) {
      if (data.Success) {
        return data.ResData
      } else {
        ElMessage.error(data.ErrMsg || '请求失败')
        return Promise.reject(new Error(data.ErrMsg || '请求失败'))
      }
    }
    
    // 支持项目2的响应格式 { code, data, message }
    if (data.code !== undefined) {
      if (data.code === 200) {
        return data.data
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    // 其他格式直接返回
    return data
  },
  (error) => {
    // 开发环境使用Mock时，如果请求失败，返回Mock数据
    if (isDev && useMock) {
      console.log('[Mock] 请求失败，返回Mock数据:', error.config?.url)
      return mockResponse(error.config?.url || '', error.config?.method || 'get', error.config)
    }
    
    // 网络错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          // 清除用户信息并跳转到登录页
          const userStore = useUserStore()
          userStore.clearUserInfo()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error('请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 导出实例
export const request = instance

// 导出常用的请求方法（支持Mock）
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  if (isDev && useMock) {
    return mockResponse(url, 'get', config) as Promise<T>
  }
  return instance.get(url, config)
}

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  if (isDev && useMock) {
    return mockResponse(url, 'post', { ...config, data }) as Promise<T>
  }
  return instance.post(url, data, config)
}

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  if (isDev && useMock) {
    return mockResponse(url, 'put', { ...config, data }) as Promise<T>
  }
  return instance.put(url, data, config)
}

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  if (isDev && useMock) {
    return mockResponse(url, 'delete', config) as Promise<T>
  }
  return instance.delete(url, config)
}

// 默认导出
export const requestManager = instance