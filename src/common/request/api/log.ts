import { requestManager } from '../index';
import type { LogQueryParams, LogPageResult, LogExportParams } from '@/types/log';

// 日志模块API封装
export const logApi = {
  /**
   * 日志分页查询
   * @param params 日志查询参数
   * @param options 可选配置（隐藏加载、隐藏提示）
   */
  getLogPage: (params: LogQueryParams, options = {}) => {
    return requestManager.get<LogPageResult>('/api/log/page', params, { ...options });
  },

  /**
   * 日志导出
   * @param params 日志导出参数
   * @param options 可选配置
   */
  exportLog: (params: LogExportParams, options = {}) => {
    // 导出为文件流，需设置responseType为blob
    return requestManager.get<Blob>('/api/log/export', params, {
      responseType: 'blob',
      silent: true, // 关闭全局加载
      hideMsg: true, // 关闭默认提示
      ...options
    });
  }
};