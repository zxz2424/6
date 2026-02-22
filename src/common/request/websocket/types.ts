export type WebSocketStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'reconnecting' 
  | 'error'

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectInterval: number
  reconnectExponent: number
  maxReconnectAttempts: number
  timeoutInterval: number
  heartbeatInterval: number
  heartbeatMessage: any
  debug: boolean
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export interface WebSocketSubscribeOptions {
  once?: boolean
  filter?: (message: WebSocketMessage) => boolean
}

export type WebSocketMessageHandler = (message: WebSocketMessage) => void

export interface WebSocketSubscription {
  unsubscribe: () => void
  handler: WebSocketMessageHandler
}