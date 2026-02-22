import { defineStore } from 'pinia';
import type { AlarmQueryParams, AlarmItem, AlarmListResult, AlarmOperateParams } from '@/types/system';
import { AlarmLevel, AlarmStatus } from '@/types/system';

// 模拟API（替换为真实接口时修改此处）
const mockApi = {
  alarm: {
    confirmAlarm: (params: AlarmOperateParams) => Promise.resolve({ success: true, count: Array.isArray(params.id) ? params.id.length : 1 }),
    clearAlarm: (params: AlarmOperateParams) => Promise.resolve({ success: true, count: Array.isArray(params.id) ? params.id.length : 1 }),
    exportAlarm: (params: AlarmQueryParams) => {
      const blob = new Blob(['告警ID,设备名称,告警等级,触发时间\n'], { type: 'application/vnd.ms-excel' });
      return Promise.resolve(blob);
    }
  }
};

export const useAlarmStore = defineStore('business-alarm', {
  state: () => ({
    alarmList: [] as AlarmItem[],
    total: 0,
    page: 1,
    size: 10,
    queryParams: {} as AlarmQueryParams,
    loading: false,
    currentAlarm: null as AlarmItem | null,
    statistics: {
      emergency: 0,
      important: 0,
      normal: 0,
      unhandled: 0,
      confirmed: 0,
      cleared: 0,
      handled: 0
    }
  }),
  actions: {
    async fetchAlarmList(params?: AlarmQueryParams) {
      this.loading = true;
      try {
        const query = params || this.queryParams;
        const res: AlarmListResult = {
          list: [
            {
              id: 'ALM20260205001',
              deviceId: 'DEV001',
              deviceName: '一号监测设备',
              level: AlarmLevel.EMERGENCY,
              status: AlarmStatus.UNHANDLED,
              content: '设备温度超过阈值（85℃）',
              triggerReason: '温度传感器异常',
              triggerTime: '2026-02-05 10:00:00',
              lng: 116.403874,
              lat: 39.914885,
              alt: 20
            },
            {
              id: 'ALM20260205002',
              deviceId: 'DEV002',
              deviceName: '二号监测设备',
              level: AlarmLevel.IMPORTANT,
              status: AlarmStatus.CONFIRMED,
              content: '设备电压不稳定',
              triggerReason: '电压传感器异常',
              triggerTime: '2026-02-05 09:30:00',
              confirmTime: '2026-02-05 09:40:00',
              confirmUser: '管理员',
              lng: 116.413874,
              lat: 39.924885,
              alt: 25
            },
            {
              id: 'ALM20260205003',
              deviceId: 'DEV003',
              deviceName: '三号监测设备',
              level: AlarmLevel.NORMAL,
              status: AlarmStatus.CLEARED,
              content: '信号强度偏低',
              triggerReason: '信号传感器异常',
              triggerTime: '2026-02-05 08:00:00',
              clearTime: '2026-02-05 08:30:00',
              lng: 116.423874,
              lat: 39.934885,
              alt: 30
            }
          ],
          total: 3,
          page: query.page || 1,
          size: query.size || 10
        };
        this.alarmList = res.list;
        this.total = res.total;
        this.queryParams = query;
      } catch (err) {
        console.error('获取告警列表失败：', err);
        this.alarmList = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },

    async fetchAlarmStatistics() {
      try {
        const res = { emergency: 1, important: 1, normal: 1, unhandled: 1, confirmed: 1, cleared: 1 };
        this.statistics = {
          emergency: res.emergency,
          important: res.important,
          normal: res.normal,
          unhandled: res.unhandled,
          confirmed: res.confirmed,
          cleared: res.cleared,
          handled: res.confirmed + res.cleared
        };
      } catch (err) {
        console.error('获取告警统计失败：', err);
        this.statistics = { emergency:0, important:0, normal:0, unhandled:0, confirmed:0, cleared:0, handled:0 };
      }
    },

    async confirmAlarm(ids: string | string[], remark?: string) {
      try {
        const params: AlarmOperateParams = { id: ids, operator: 'currentUser', remark };
        const res = await mockApi.alarm.confirmAlarm(params);
        if (res.success) {
          this.fetchAlarmList();
          this.fetchAlarmStatistics();
        }
        return res;
      } catch (err) {
        console.error('确认告警失败：', err);
        return { success: false, count: 0 };
      }
    },

    async clearAlarm(ids: string | string[], remark?: string) {
      try {
        const params: AlarmOperateParams = { id: ids, operator: 'currentUser', remark };
        const res = await mockApi.alarm.clearAlarm(params);
        if (res.success) {
          this.fetchAlarmList();
          this.fetchAlarmStatistics();
        }
        return res;
      } catch (err) {
        console.error('清除告警失败：', err);
        return { success: false, count: 0 };
      }
    },

    async exportAlarm(params?: AlarmQueryParams) {
      try {
        const query = params || this.queryParams;
        return await mockApi.alarm.exportAlarm(query);
      } catch (err) {
        console.error('导出告警失败：', err);
        throw err;
      }
    },

    setCurrentAlarm(alarm: AlarmItem | null) {
      this.currentAlarm = alarm;
    },

    resetQueryParams() {
      this.queryParams = { page: 1, size: 10 };
      this.page = 1;
      this.size = 10;
    }
  }
});