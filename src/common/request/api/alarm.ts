// src/common/request/api/alarm.ts
import { requestManager } from '../index';
import type { 
  AlarmQueryParams, 
  AlarmItem, 
  AlarmListResult, 
  AlarmOperateParams,
  AlarmStatistics 
} from '@/types/system';

export const alarmApi = {
  // 获取告警列表（分页）
  getAlarmList: (params: AlarmQueryParams, options = {}) => {
    return requestManager.get<AlarmListResult>('/api/alarm/list', params, { ...options });
  },

  // 获取告警详情
  getAlarmDetail: (id: string, options = {}) => {
    return requestManager.get<AlarmItem>(`/api/alarm/detail/${id}`, {}, { ...options });
  },

  // 确认告警
  confirmAlarm: (data: AlarmOperateParams, options = {}) => {
    return requestManager.post<{ success: boolean; count: number }>('/api/alarm/confirm', data, { ...options });
  },

  // 清除告警
  clearAlarm: (data: AlarmOperateParams, options = {}) => {
    return requestManager.post<{ success: boolean; count: number }>('/api/alarm/clear', data, { ...options });
  },

  // 获取告警统计
  getAlarmStatistics: (options = {}) => {
    return requestManager.get<AlarmStatistics>('/api/alarm/statistics', {}, { ...options });
  },

  // 导出告警
  exportAlarm: (params: AlarmQueryParams, options = {}) => {
    return requestManager.get<Blob>('/api/alarm/export', params, {
      responseType: 'blob',
      silent: true,
      hideMsg: true,
      ...options
    });
  }
};