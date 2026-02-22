// src/hooks/business/useLog.ts
import { ref } from 'vue';
import { useLogStore } from '@/common/store/modules/business/log';
import { api } from '@/common/request/api';

export const useLog = () => {
  const logStore = useLogStore();
  const loading = ref(false);
  const exportLoading = ref(false);

  // 获取日志列表
  const fetchLogs = async (params?: any) => {
    loading.value = true;
    try {
      const res = await api.log.getLogPage(params);
      logStore.updateLogList(res.list);
      logStore.updatePagination({
        total: res.total,
        pageNum: params?.pageNum || 1,
        pageSize: params?.pageSize || 10
      });
      return res;
    } catch (error) {
      console.error('获取日志列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 导出日志
  const exportLogs = async (params?: any) => {
    exportLoading.value = true;
    try {
      const blob = await api.log.exportLog(params);
      return blob;
    } catch (error) {
      console.error('导出日志失败:', error);
      throw error;
    } finally {
      exportLoading.value = false;
    }
  };

  // 搜索日志
  const searchLogs = (params: any) => {
    logStore.updateQueryParams(params);
    return fetchLogs({
      ...params,
      pageNum: 1,
      pageSize: logStore.pagination.pageSize
    });
  };

  return {
    // 状态
    logList: logStore.logList,
    pagination: logStore.pagination,
    queryParams: logStore.queryParams,
    loading,
    exportLoading,
    
    // 方法
    fetchLogs,
    exportLogs,
    searchLogs
  };
};