// 设备信息
export interface DeviceInfo {
  id: string
  name: string
  type: string
  status: DeviceStatus
  position: {
    lng: number
    lat: number
    alt: number
  }
  lastUpdateTime: number
  properties: Record<string, any>
}

// 设备状态枚举
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  FAULT = 'fault',
  MAINTENANCE = 'maintenance'
}

// 实时数据
export interface RealtimeData {
  timestamp: number
  deviceId: string
  sensorType: string
  value: number
  unit: string
  quality: number // 数据质量 0-100
}

// 告警信息
export interface AlarmInfo {
  id: string
  deviceId: string
  deviceName: string
  alarmType: string
  level: AlarmLevel
  message: string
  timestamp: number
  status: AlarmStatus
  acknowledged: boolean
  data?: Record<string, any>
}

// 告警级别
export enum AlarmLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 告警状态
export enum AlarmStatus {
  ACTIVE = 'active',
  CLEARED = 'cleared',
  ACKNOWLEDGED = 'acknowledged'
}

// API请求参数类型
export interface DeviceListParams {
  page?: number
  size?: number
  deviceType?: string
  status?: DeviceStatus
  keyword?: string
}

export interface RealtimeDataParams {
  deviceId: string
  timeRange?: string // '1h', '6h', '24h', '7d'
  startTime?: number
  endTime?: number
  sensorTypes?: string[]
}

export interface AlarmListParams {
  page?: number
  size?: number
  deviceId?: string
  alarmType?: string
  level?: AlarmLevel
  status?: AlarmStatus
  startTime?: number
  endTime?: number
}

export interface StatisticsParams {
  timeRange: string
  interval?: string // 'hour', 'day', 'week', 'month'
  deviceType?: string
}

export interface FilterParams {
  deviceType: string
  status: string
  timeRange: string
}

export interface ExportDataParams {
  deviceId?: string
  startTime?: number
  endTime?: number
  format?: 'json' | 'csv' | 'excel'
}

export interface AcknowledgeAlarmParams {
  alarmId: string
  remark?: string
}

// API响应结果类型
export interface DeviceListResult {
  list: DeviceInfo[]
  total: number
  page: number
  size: number
}

export interface DeviceDetailResult extends DeviceInfo {
  history: RealtimeData[]
  alarms: AlarmInfo[]
  statistics: Record<string, any>
}

export interface RealtimeDataResult {
  deviceId: string
  data: RealtimeData[]
  statistics?: {
    avg: number
    max: number
    min: number
    count: number
  }
}

export interface AlarmListResult {
  list: AlarmInfo[]
  total: number
  page: number
  size: number
}

export interface StatisticsResult {
  timeRange: string
  deviceCount: number
  onlineCount: number
  alarmCount: number
  dataPoints: number
  chartData: {
    time: string
    value: number
  }[]
}

// WebSocket消息类型
export interface WebSocketMessage {
  topic: string
  data: any
  timestamp: number
}

// 地图控制配置
export interface MapControlConfig {
  zoomIn: boolean
  zoomOut: boolean
  resetView: boolean
  toggleLayer: (layerId: string, visible: boolean) => void
  locateMe: () => void
  fullScreen: () => void
}

// 设备标记样式
export interface DeviceMarkerStyle {
  color: string
  size: number
  icon?: string
  label?: {
    text: string
    font: string
    color: string
  }
}

// 轨迹线样式
export interface TrackLineStyle {
  width: number
  color: string
  opacity: number
  dash?: number[]
}

// 监控配置
export interface MonitorConfig {
  autoRefresh: boolean
  refreshInterval: number
  showOfflineDevices: boolean
  alarmSound: boolean
  alarmPopup: boolean
  defaultTimeRange: string
  chartTheme: string
  mapTheme: string
}

// 导出选项
export interface ExportOptions {
  format: 'json' | 'csv' | 'excel'
  includeData: boolean
  includeCharts: boolean
  includeMaps: boolean
  timeRange: string
}

// 过滤器状态
export interface FilterState {
  deviceType: string
  status: string
  timeRange: string
  quality: number
  searchKeyword: string
}

// 实时监控状态
export interface RealtimeMonitorState {
  devices: DeviceInfo[]
  selectedDevice: DeviceInfo | null
  realtimeData: RealtimeData[]
  alarms: AlarmInfo[]
  filters: FilterState
  config: MonitorConfig
  isLoading: boolean
  lastUpdateTime: number
}