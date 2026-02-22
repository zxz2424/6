import { defineStore } from 'pinia';
import type { LogItem, LogLevel, LogModule, LogQueryParams } from '@/types/log';

// 定义日志Store
export const useLogStore = defineStore('business-log', {
  state: () => ({
    // 日志列表
    logList: [] as LogItem[],
    // 分页信息
    pagination: {
      pageNum: 1,
      pageSize: 10,
      total: 0
    },
    // 查询参数（与页面表单双向绑定）
    queryParams: {
      level: undefined as LogLevel | undefined,
      module: undefined as LogModule | undefined,
      operator: '',
      startTime: undefined as string | undefined,
      endTime: undefined as string | undefined
    } as Omit<LogQueryParams, 'pageNum' | 'pageSize'>,
    // 加载状态
    loading: false,
    // 导出状态
    exportLoading: false
  }),
  actions: {
    /**
     * 更新日志列表
     * @param list 日志列表
     */
    updateLogList(list: LogItem[]) {
      this.logList = list;
    },

    /**
     * 更新分页信息
     * @param pagination 分页参数
     */
    updatePagination(pagination: Partial<typeof this.pagination>) {
      this.pagination = { ...this.pagination, ...pagination };
    },

    /**
     * 更新查询参数
     * @param params 查询参数
     */
    updateQueryParams(params: Partial<typeof this.queryParams>) {
      this.queryParams = { ...this.queryParams, ...params };
    },

    /**
     * 重置查询参数+分页
     */
    resetQueryParams() {
      this.queryParams = {
        level: undefined,
        module: undefined,
        operator: '',
        startTime: undefined,
        endTime: undefined
      };
      this.pagination = {
        pageNum: 1,
        pageSize: 10,
        total: 0
      };
    },

    /**
     * 设置加载状态
     * @param loading 加载状态
     */
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    /**
     * 设置导出状态
     * @param loading 导出状态
     */
    setExportLoading(loading: boolean) {
      this.exportLoading = loading;
    }
  }
});