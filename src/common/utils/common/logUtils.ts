// src/common/utils/common/logUtils.ts
import type { LogLevel } from '@/types/log';

/**
 * 获取日志级别的颜色
 */
export const getLogLevelColor = (level: LogLevel): string => {
  const colorMap: Record<LogLevel, string> = {
    error: '#ff4d4f',
    warn: '#faad14',
    info: '#52c41a',
    debug: '#8c8c8c'
  };
  return colorMap[level] || '#8c8c8c';
};

/**
 * 格式化日志时间
 */
export const formatLogTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * 截断长日志内容
 */
export const truncateLogContent = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};