// src/common/utils/common/alarmUtils.ts
import type { AlarmItem, AlarmLevel } from '@/types/system';

/**
 * 获取告警级别的颜色
 */
export const getAlarmLevelColor = (level: AlarmLevel): string => {
  const colorMap: Record<AlarmLevel, string> = {
    emergency: '#ff4d4f',
    important: '#faad14',
    normal: '#52c41a'
  };
  return colorMap[level] || '#8c8c8c';
};

/**
 * 获取告警级别的文本
 */
export const getAlarmLevelText = (level: AlarmLevel): string => {
  const textMap: Record<AlarmLevel, string> = {
    emergency: '紧急',
    important: '重要',
    normal: '一般'
  };
  return textMap[level] || '未知';
};

/**
 * 格式化告警时间
 */
export const formatAlarmTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * 检查告警是否过期（超过24小时）
 */
export const isAlarmExpired = (triggerTime: string): boolean => {
  const trigger = new Date(triggerTime).getTime();
  const now = new Date().getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - trigger > twentyFourHours;
};