// src/hooks/business/useAlarm.ts
import { ref, computed } from 'vue';
import { useAlarmStore } from '@/common/store/modules/business/alarm';
import { api } from '@/common/request/api';

export const useAlarm = () => {
  const alarmStore = useAlarmStore();
  const loading = ref(false);
  const exportLoading = ref(false);

  // 获取告警列表
  const fetchAlarms = async (params?: any) => {
    loading.value = true;
    try {
      const res = await api.alarm.getAlarmList(params);
      alarmStore.alarmList = res.list;
      alarmStore.total = res.total;
      return res;
    } catch (error) {
      console.error('获取告警列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 确认告警
  const confirmAlarm = async (ids: string | string[], remark?: string) => {
    try {
      const res = await api.alarm.confirmAlarm({
        id: ids,
        operator: 'currentUser',
        remark
      });
      return res;
    } catch (error) {
      console.error('确认告警失败:', error);
      throw error;
    }
  };

  // 清除告警
  const clearAlarm = async (ids: string | string[], remark?: string) => {
    try {
      const res = await api.alarm.clearAlarm({
        id: ids,
        operator: 'currentUser',
        remark
      });
      return res;
    } catch (error) {
      console.error('清除告警失败:', error);
      throw error;
    }
  };

  // 导出告警
  const exportAlarm = async (params?: any) => {
    exportLoading.value = true;
    try {
      const blob = await api.alarm.exportAlarm(params);
      return blob;
    } catch (error) {
      console.error('导出告警失败:', error);
      throw error;
    } finally {
      exportLoading.value = false;
    }
  };

  // 获取告警统计
  const fetchAlarmStatistics = async () => {
    try {
      const res = await api.alarm.getAlarmStatistics();
      alarmStore.statistics = {
        emergency: res.emergency || 0,
        important: res.important || 0,
        normal: res.normal || 0,
        unhandled: res.unhandled || 0,
        confirmed: res.confirmed || 0,
        cleared: res.cleared || 0,
        handled: (res.confirmed || 0) + (res.cleared || 0)
      };
      return res;
    } catch (error) {
      console.error('获取告警统计失败:', error);
      throw error;
    }
  };

  // 计算属性
  const emergencyAlarms = computed(() => 
    alarmStore.alarmList.filter(alarm => alarm.level === 'emergency')
  );
  
  const unhandledAlarms = computed(() => 
    alarmStore.alarmList.filter(alarm => alarm.status === 'unhandled')
  );

  return {
    // 状态
    alarmList: alarmStore.alarmList,
    total: alarmStore.total,
    statistics: alarmStore.statistics,
    loading,
    exportLoading,
    
    // 方法
    fetchAlarms,
    confirmAlarm,
    clearAlarm,
    exportAlarm,
    fetchAlarmStatistics,
    
    // 计算属性
    emergencyAlarms,
    unhandledAlarms
  };
};