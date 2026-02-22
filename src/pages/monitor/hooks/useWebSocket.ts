import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WS_CONFIG } from '@/common/request/api/monitor'

type WebSocketMessage = {
  topic: string
  data: any
  timestamp: number
}

type SubscriptionCallback = (data: any) => void

// 开发环境配置
const isDev = import.meta.env.DEV
const useMock = import.meta.env.VITE_MOCK_ENABLED === 'true'

/**
 * WebSocket管理Hook
 */
export function useWebSocket() {
  // 如果是开发环境且启用Mock，使用模拟WebSocket
  if (isDev && useMock) {
    return createMockWebSocket()
  }
  
  return createRealWebSocket()
}

/**
 * 创建真实的WebSocket连接
 */
function createRealWebSocket() {
  const wsInstance = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const reconnectCount = ref(0)
  const maxReconnectAttempts = WS_CONFIG.maxReconnectAttempts
  
  // 订阅管理器
  const subscriptions = ref<Map<string, Set<SubscriptionCallback>>>(new Map())
  
  // 消息队列（断线重连时缓存）
  const messageQueue = ref<WebSocketMessage[]>([])

  // 连接WebSocket
  const connectWebSocket = async (): Promise<boolean> => {
    if (isConnecting.value || isConnected.value) {
      return true
    }

    return new Promise((resolve) => {
      isConnecting.value = true
      
      try {
        const ws = new WebSocket(WS_CONFIG.url)
        
        ws.onopen = () => {
          console.log('WebSocket连接成功')
          isConnected.value = true
          isConnecting.value = false
          reconnectCount.value = 0
          
          // 连接成功后处理消息队列
          processMessageQueue()
          
          // 发送连接成功消息
          sendMessage(WS_CONFIG.topics.SYSTEM_STATUS, { 
            type: 'connected',
            timestamp: Date.now()
          })
          
          resolve(true)
        }
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            handleIncomingMessage(message)
          } catch (error) {
            console.error('WebSocket消息解析失败:', error)
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error)
          isConnecting.value = false
          resolve(false)
        }
        
        ws.onclose = (event) => {
          console.log('WebSocket连接关闭:', event.code, event.reason)
          isConnected.value = false
          isConnecting.value = false
          
          // 自动重连
          if (reconnectCount.value < maxReconnectAttempts) {
            setTimeout(() => {
              reconnectCount.value++
              console.log(`第${reconnectCount.value}次重连...`)
              connectWebSocket()
            }, WS_CONFIG.reconnectInterval)
          }
        }
        
        wsInstance.value = ws
      } catch (error) {
        console.error('创建WebSocket连接失败:', error)
        isConnecting.value = false
        resolve(false)
      }
    })
  }

  // 断开WebSocket连接
  const disconnectWebSocket = () => {
    if (wsInstance.value) {
      // 发送断开连接消息
      sendMessage(WS_CONFIG.topics.SYSTEM_STATUS, { 
        type: 'disconnecting',
        timestamp: Date.now()
      })
      
      wsInstance.value.close()
      wsInstance.value = null
      isConnected.value = false
      isConnecting.value = false
      reconnectCount.value = 0
    }
  }

  // 发送消息
  const sendMessage = (topic: string, data: any, cacheIfDisconnected = true) => {
    const message: WebSocketMessage = {
      topic,
      data,
      timestamp: Date.now()
    }

    if (isConnected.value && wsInstance.value) {
      try {
        wsInstance.value.send(JSON.stringify(message))
      } catch (error) {
        console.error('WebSocket发送消息失败:', error)
        if (cacheIfDisconnected) {
          messageQueue.value.push(message)
        }
      }
    } else if (cacheIfDisconnected) {
      // 未连接时缓存消息
      messageQueue.value.push(message)
    }
  }

  // 处理接收到的消息
  const handleIncomingMessage = (message: WebSocketMessage) => {
    const { topic, data } = message
    
    // 查找该主题的所有订阅者
    const callbacks = subscriptions.value.get(topic)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`WebSocket回调执行错误 (${topic}):`, error)
        }
      })
    }
    
    // 广播给所有订阅者（如果需要）
    if (topic === WS_CONFIG.topics.DEVICE_STATUS) {
      broadcastToAllSubscriptions(topic, data)
    }
  }

  // 订阅主题
  const subscribeToTopic = (topic: string, callback: SubscriptionCallback) => {
    if (!subscriptions.value.has(topic)) {
      subscriptions.value.set(topic, new Set())
    }
    
    const callbacks = subscriptions.value.get(topic)!
    callbacks.add(callback)
    
    // 发送订阅请求到服务器
    if (isConnected.value) {
      sendMessage('system/subscribe', { topic }, false)
    }
    
    console.log(`订阅主题: ${topic}`)
  }

  // 取消订阅
  const unsubscribeFromTopic = (topic: string, callback?: SubscriptionCallback) => {
    if (subscriptions.value.has(topic)) {
      const callbacks = subscriptions.value.get(topic)!
      
      if (callback) {
        callbacks.delete(callback)
      } else {
        callbacks.clear()
      }
      
      // 如果该主题没有订阅者了，发送取消订阅请求
      if (callbacks.size === 0 && isConnected.value) {
        sendMessage('system/unsubscribe', { topic }, false)
      }
    }
  }

  // 订阅设备更新
  const subscribeToDevice = (deviceId: string, callback: SubscriptionCallback) => {
    // 订阅设备状态
    subscribeToTopic(`${WS_CONFIG.topics.DEVICE_STATUS}/${deviceId}`, callback)
    
    // 订阅实时数据
    subscribeToTopic(`${WS_CONFIG.topics.REAL_TIME_DATA}/${deviceId}`, callback)
    
    // 订阅告警通知
    subscribeToTopic(`${WS_CONFIG.topics.ALARM_NOTIFICATION}/${deviceId}`, callback)
  }

  // 取消设备订阅
  const unsubscribeFromDevice = (deviceId: string, callback?: SubscriptionCallback) => {
    unsubscribeFromTopic(`${WS_CONFIG.topics.DEVICE_STATUS}/${deviceId}`, callback)
    unsubscribeFromTopic(`${WS_CONFIG.topics.REAL_TIME_DATA}/${deviceId}`, callback)
    unsubscribeFromTopic(`${WS_CONFIG.topics.ALARM_NOTIFICATION}/${deviceId}`, callback)
  }

  // 广播给所有订阅者
  const broadcastToAllSubscriptions = (topic: string, data: any) => {
    subscriptions.value.forEach((callbacks, subscribedTopic) => {
      if (subscribedTopic === topic || subscribedTopic.startsWith(`${topic}/`)) {
        callbacks.forEach(callback => {
          try {
            callback(data)
          } catch (error) {
            console.error(`广播回调执行错误 (${subscribedTopic}):`, error)
          }
        })
      }
    })
  }

  // 处理消息队列
  const processMessageQueue = () => {
    while (messageQueue.value.length > 0 && isConnected.value) {
      const message = messageQueue.value.shift()
      if (message) {
        sendMessage(message.topic, message.data, false)
      }
    }
  }

  // 心跳检测
  const startHeartbeat = () => {
    const heartbeatInterval = setInterval(() => {
      if (isConnected.value) {
        sendMessage('heartbeat', { timestamp: Date.now() }, false)
      }
    }, 30000) // 30秒一次心跳

    // 返回清理函数
    return () => {
      clearInterval(heartbeatInterval)
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    // 取消所有订阅
    subscriptions.value.clear()
    
    // 断开连接
    disconnectWebSocket()
  })

  return {
    // 连接管理
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
    isConnecting,
    
    // 消息管理
    sendMessage,
    
    // 订阅管理
    subscribeToTopic,
    unsubscribeFromTopic,
    subscribeToDevice,
    unsubscribeFromDevice,
    
    // 工具函数
    startHeartbeat
  }
}

/**
 * 创建模拟WebSocket连接
 */
function createMockWebSocket() {
  const isConnected = ref(true)
  const isConnecting = ref(false)
  
  // 订阅管理器
  const subscriptions = ref<Map<string, Set<SubscriptionCallback>>>(new Map())
  
  console.log('[Mock WebSocket] 使用模拟WebSocket连接')

  // 模拟设备数据
  const mockDevices = [
    { id: '1', name: '温度传感器01', type: 'temperature', status: 'online', lat: 31.2304, lng: 121.4737, value: 25.5, unit: '°C' },
    { id: '2', name: '湿度传感器01', type: 'humidity', status: 'online', lat: 31.2310, lng: 121.4740, value: 65.2, unit: '%' },
    { id: '3', name: '压力传感器01', type: 'pressure', status: 'error', lat: 31.2298, lng: 121.4730, value: 1.2, unit: 'MPa' }
  ]

  // 模拟实时数据更新
  let mockInterval: NodeJS.Timeout | null = null

  // 连接WebSocket（模拟）
  const connectWebSocket = async (): Promise<boolean> => {
    console.log('[Mock WebSocket] 连接成功')
    isConnected.value = true
    
    // 开始模拟数据推送
    startMockDataPush()
    
    return Promise.resolve(true)
  }

  // 断开WebSocket连接（模拟）
  const disconnectWebSocket = () => {
    console.log('[Mock WebSocket] 断开连接')
    isConnected.value = false
    
    // 停止模拟数据推送
    if (mockInterval) {
      clearInterval(mockInterval)
      mockInterval = null
    }
  }

  // 发送消息（模拟）
  const sendMessage = (topic: string, data: any, cacheIfDisconnected = true) => {
    console.log(`[Mock WebSocket] 发送消息: ${topic}`, data)
    
    // 模拟服务器响应
    if (topic === 'system/subscribe') {
      console.log(`[Mock WebSocket] 订阅主题: ${data.topic}`)
    }
  }

  // 订阅主题
  const subscribeToTopic = (topic: string, callback: SubscriptionCallback) => {
    if (!subscriptions.value.has(topic)) {
      subscriptions.value.set(topic, new Set())
    }
    
    const callbacks = subscriptions.value.get(topic)!
    callbacks.add(callback)
    
    console.log(`[Mock WebSocket] 订阅主题: ${topic}`)
    
    // 如果是设备状态主题，立即发送一次模拟数据
    if (topic.includes('device/status')) {
      const deviceId = topic.split('/')[2] || '1'
      const device = mockDevices.find(d => d.id === deviceId) || mockDevices[0]
      setTimeout(() => {
        callback({
          deviceId: device.id,
          status: device.status,
          value: device.value,
          updateTime: new Date().toISOString()
        })
      }, 100)
    }
  }

  // 取消订阅
  const unsubscribeFromTopic = (topic: string, callback?: SubscriptionCallback) => {
    if (subscriptions.value.has(topic)) {
      const callbacks = subscriptions.value.get(topic)!
      
      if (callback) {
        callbacks.delete(callback)
      } else {
        callbacks.clear()
      }
      
      console.log(`[Mock WebSocket] 取消订阅: ${topic}`)
    }
  }

  // 订阅设备更新
  const subscribeToDevice = (deviceId: string, callback: SubscriptionCallback) => {
    // 订阅设备状态
    subscribeToTopic(`device/status/${deviceId}`, callback)
    
    // 订阅实时数据
    subscribeToTopic(`realtime/data/${deviceId}`, callback)
    
    // 订阅告警通知
    subscribeToTopic(`alarm/notification/${deviceId}`, callback)
  }

  // 取消设备订阅
  const unsubscribeFromDevice = (deviceId: string, callback?: SubscriptionCallback) => {
    unsubscribeFromTopic(`device/status/${deviceId}`, callback)
    unsubscribeFromTopic(`realtime/data/${deviceId}`, callback)
    unsubscribeFromTopic(`alarm/notification/${deviceId}`, callback)
  }

  // 开始模拟数据推送
  const startMockDataPush = () => {
    if (mockInterval) {
      clearInterval(mockInterval)
    }
    
    mockInterval = setInterval(() => {
      // 随机选择一个设备更新数据
      const deviceIndex = Math.floor(Math.random() * mockDevices.length)
      const device = mockDevices[deviceIndex]
      
      // 模拟数据变化
      let newValue = device.value
      const change = (Math.random() - 0.5) * 2
      
      switch (device.type) {
        case 'temperature':
          newValue = Math.max(20, Math.min(40, device.value + change))
          break
        case 'humidity':
          newValue = Math.max(30, Math.min(80, device.value + change * 2))
          break
        case 'pressure':
          newValue = Math.max(0.8, Math.min(1.5, device.value + change * 0.1))
          break
      }
      
      device.value = parseFloat(newValue.toFixed(1))
      
      // 模拟状态变化
      if (Math.random() < 0.05) {
        device.status = Math.random() > 0.7 ? 'error' : 'online'
      }
      
      // 向所有订阅者推送更新
      const message = {
        deviceId: device.id,
        status: device.status,
        value: device.value,
        lat: device.lat + (Math.random() - 0.5) * 0.0001, // 模拟位置微调
        lng: device.lng + (Math.random() - 0.5) * 0.0001,
        updateTime: new Date().toISOString()
      }
      
      // 推送到设备状态主题
      const callbacks = subscriptions.value.get(`device/status/${device.id}`)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message)
          } catch (error) {
            console.error('Mock WebSocket回调执行错误:', error)
          }
        })
      }
      
      // 模拟告警
      if (Math.random() < 0.02) {
        const alarmMessage = {
          id: `alarm-${Date.now()}`,
          deviceId: device.id,
          deviceName: device.name,
          type: device.value > (device.type === 'temperature' ? 35 : device.type === 'pressure' ? 1.3 : 75) ? '高值报警' : '低值报警',
          level: 'high',
          time: new Date().toISOString(),
          value: device.value,
          unit: device.unit
        }
        
        // 推送到告警主题
        const alarmCallbacks = subscriptions.value.get(`alarm/notification/${device.id}`)
        if (alarmCallbacks) {
          alarmCallbacks.forEach(callback => {
            try {
              callback(alarmMessage)
            } catch (error) {
              console.error('Mock WebSocket告警回调执行错误:', error)
            }
          })
        }
      }
      
    }, 3000) // 每3秒更新一次
  }

  // 心跳检测（模拟）
  const startHeartbeat = () => {
    const heartbeatInterval = setInterval(() => {
      console.log('[Mock WebSocket] 心跳')
    }, 30000)

    // 返回清理函数
    return () => {
      clearInterval(heartbeatInterval)
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    // 取消所有订阅
    subscriptions.value.clear()
    
    // 断开连接
    disconnectWebSocket()
  })

  return {
    // 连接管理
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
    isConnecting,
    
    // 消息管理
    sendMessage,
    
    // 订阅管理
    subscribeToTopic,
    unsubscribeFromTopic,
    subscribeToDevice,
    unsubscribeFromDevice,
    
    // 工具函数
    startHeartbeat
  }
}