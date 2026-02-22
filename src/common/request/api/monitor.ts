import { requestManager } from '../axios/request'
import type {
  DeviceListParams,
  DeviceListResult,
  DeviceDetailResult,
  RealtimeDataParams,
  RealtimeDataResult,
  AlarmListParams,
  AlarmListResult,
  StatisticsParams,
  StatisticsResult,
  FilterParams,
  ExportDataParams,
  AcknowledgeAlarmParams
} from '@/types/monitor'

// 实时监控API
export const monitorApi = {
  // 获取设备列表
  getDeviceList: (params: DeviceListParams = {}) => {
    return requestManager.get<DeviceListResult>('/api/monitor/devices', params)
  },
  
  // 获取设备详情
  getDeviceDetail: (deviceId: string) => {
    return requestManager.get<DeviceDetailResult>(`/api/monitor/devices/${deviceId}`)
  },
  
  // 获取实时数据
  getRealtimeData: (params: RealtimeDataParams) => {
    return requestManager.get<RealtimeDataResult>('/api/monitor/realtime-data', params)
  },
  
  // 获取历史数据
  getHistoryData: (params: RealtimeDataParams) => {
    return requestManager.get<RealtimeDataResult>('/api/monitor/history-data', params)
  },
  
  // 获取告警列表
  getAlarms: (params: AlarmListParams = {}) => {
    return requestManager.get<AlarmListResult>('/api/monitor/alarms', params)
  },
  
  // 确认告警
  acknowledgeAlarm: (data: AcknowledgeAlarmParams) => {
    return requestManager.post<{ success: boolean }>('/api/monitor/alarms/acknowledge', data)
  },
  
  // 获取统计信息
  getStatistics: (params: StatisticsParams) => {
    return requestManager.get<StatisticsResult>('/api/monitor/statistics', params)
  },
  
  // 导出数据
  exportRealtimeData: (params: ExportDataParams) => {
    return requestManager.get<any>('/api/monitor/export-data', params, {
      responseType: 'blob'
    })
  },
  
  // 获取设备类型
  getDeviceTypes: () => {
    return requestManager.get<{ id: string; name: string }[]>('/api/monitor/device-types')
  },
  
  // 获取监控配置
  getMonitorConfig: () => {
    return requestManager.get<any>('/api/monitor/config')
  },
  
  // 更新监控配置
  updateMonitorConfig: (data: any) => {
    return requestManager.post<{ success: boolean }>('/api/monitor/config', data)
  },
  
  // 批量操作设备
  batchOperation: (operation: string, deviceIds: string[]) => {
    return requestManager.post<{ success: boolean; count: number }>('/api/monitor/batch-operation', {
      operation,
      deviceIds
    })
  }
}

// WebSocket连接配置
export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/monitor', // 修复这里
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  
  // 订阅主题
  topics: {
    DEVICE_STATUS: 'device/status',
    REAL_TIME_DATA: 'device/realtime-data',
    ALARM_NOTIFICATION: 'alarm/notification',
    SYSTEM_STATUS: 'system/status'
  }
}