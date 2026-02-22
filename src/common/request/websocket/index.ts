// WebSocket 客户端单例
import { ref } from 'vue'
import type { 
  WebSocketConfig, 
  WebSocketStatus, 
  WebSocketMessage,
  WebSocketMessageHandler,
  WebSocketSubscription
} from './types'

const DEFAULT_CONFIG: WebSocketConfig = {
  url: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000/ws',
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectExponent: 1.5,
  maxReconnectAttempts: 1,
  timeoutInterval: 5000,
  heartbeatInterval: 30000,
  heartbeatMessage: { type: 'ping', data: 'ping' },
  debug: import.meta.env.DEV || true
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private status = ref<WebSocketStatus>('disconnected')
  private reconnectTimer: any = null
  private heartbeatTimer: any = null
  private reconnectAttempts = 0
  private currentReconnectInterval = DEFAULT_CONFIG.reconnectInterval
  private messageHandlers = new Map<string, WebSocketMessageHandler[]>()
  private pendingMessages: WebSocketMessage[] = []
  private config = DEFAULT_CONFIG
  private connectionTimeout: any = null

  // 获取当前状态
  public getStatus(): WebSocketStatus {
    return this.status.value
  }

  // 连接 WebSocket
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已经连接')
      return
    }

    this.status.value = 'connecting'
    console.log('正在连接 WebSocket...', this.config.url)

    try {
      // 确保只创建一个连接
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }

      this.ws = new WebSocket(this.config.url)
      this.setupEventListeners()
      
      // 设置连接超时
      this.connectionTimeout = setTimeout(() => {
        if (this.status.value === 'connecting') {
          console.log('WebSocket 连接超时')
          this.handleDisconnect()
        }
      }, this.config.timeoutInterval)
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      this.handleDisconnect()
    }
  }

  // 断开连接
  public disconnect(): void {
    console.log('手动断开 WebSocket 连接')
    this.clearTimers()
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
    
    this.status.value = 'disconnected'
    this.reconnectAttempts = 0
    this.currentReconnectInterval = this.config.reconnectInterval
    this.pendingMessages = []
  }

  // 发送消息
  public send(type: string, data: any, id?: string): boolean {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingMessages.push(message)
      console.log('消息加入待发送队列:', type)
      return false
    }

    try {
      this.ws.send(JSON.stringify(message))
      console.log('发送消息:', type, data)
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      this.pendingMessages.push(message)
      return false
    }
  }

  // 订阅消息
  public subscribe(type: string, handler: WebSocketMessageHandler): WebSocketSubscription {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)

    return {
      unsubscribe: () => this.unsubscribe(type, handler),
      handler
    }
  }

  // 取消订阅
  public unsubscribe(type: string, handler?: WebSocketMessageHandler): void {
    const handlers = this.messageHandlers.get(type)
    if (!handlers) return
    
    if (handler) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.messageHandlers.set(type, [])
    }
    
    if (this.messageHandlers.get(type)?.length === 0) {
      this.messageHandlers.delete(type)
    }
  }

  // 清空所有订阅
  public clearAllSubscriptions(): void {
    this.messageHandlers.clear()
  }

  // 发送待处理消息
  private sendPendingMessages(): void {
    if (this.pendingMessages.length === 0) return
    
    console.log('发送待处理消息:', this.pendingMessages.length)
    const messages = [...this.pendingMessages]
    this.pendingMessages = []
    
    messages.forEach(message => {
      this.send(message.type, message.data, message.id)
    })
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket 连接成功')
      this.clearConnectionTimeout()
      this.status.value = 'connected'
      this.reconnectAttempts = 0
      this.currentReconnectInterval = this.config.reconnectInterval
      
      this.startHeartbeat()
      this.sendPendingMessages()
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket 连接关闭:', event.code, event.reason)
      this.clearConnectionTimeout()
      this.handleDisconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket 连接错误:', error)
      this.clearConnectionTimeout()
      this.handleDisconnect()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('收到消息:', message.type, message.data)
        
        if (message.type === 'pong') {
          return
        }
        
        this.dispatchMessage(message)
      } catch (error) {
        console.error('消息解析失败:', error, event.data)
      }
    }
  }

  // 分发消息
  private dispatchMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type) || []
    handlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('消息处理函数执行失败:', error)
      }
    })
  }

  // 处理断开连接
  private handleDisconnect(): void {
    if (this.status.value === 'disconnected') return
    
    this.status.value = 'disconnected'
    this.stopHeartbeat()
    
    if (this.config.maxReconnectAttempts === 0 || 
        this.reconnectAttempts < this.config.maxReconnectAttempts) {
      
      this.status.value = 'reconnecting'
      this.reconnectAttempts++
      
      this.currentReconnectInterval = Math.min(
        this.currentReconnectInterval * this.config.reconnectExponent,
        this.config.maxReconnectInterval
      )
      
      console.log(`准备第 ${this.reconnectAttempts} 次重连，间隔 ${this.currentReconnectInterval}ms`)
      
      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, this.currentReconnectInterval)
    } else {
      console.log('已达到最大重连次数，停止重连')
    }
  }

  // 开始心跳
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(
          this.config.heartbeatMessage.type,
          this.config.heartbeatMessage.data
        )
      }
    }, this.config.heartbeatInterval)
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 清除连接超时
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  // 清除所有定时器
  private clearTimers(): void {
    this.clearConnectionTimeout()
    this.stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// 导出单例
export const webSocketClient = new WebSocketClient()

// 组合式函数
export function useWebSocket() {
  return {
    connect: webSocketClient.connect.bind(webSocketClient),
    disconnect: webSocketClient.disconnect.bind(webSocketClient),
    send: webSocketClient.send.bind(webSocketClient),
    subscribe: webSocketClient.subscribe.bind(webSocketClient),
    unsubscribe: webSocketClient.unsubscribe.bind(webSocketClient),
    clearAllSubscriptions: webSocketClient.clearAllSubscriptions.bind(webSocketClient),
    getStatus: () => webSocketClient.getStatus()
  }
}