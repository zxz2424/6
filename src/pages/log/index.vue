<!-- src/pages/log/index.vue -->
<template>
  <div class="log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>日志管理</span>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="日志级别">
          <el-select v-model="queryParams.level" placeholder="请选择日志级别">
            <el-option label="全部" value="" />
            <el-option label="DEBUG" value="debug" />
            <el-option label="INFO" value="info" />
            <el-option label="WARN" value="warn" />
            <el-option label="ERROR" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="queryParams.module" placeholder="请选择模块">
            <el-option label="全部" value="" />
            <el-option label="系统" value="system" />
            <el-option label="设备" value="device" />
            <el-option label="告警" value="alarm" />
            <el-option label="数据采集" value="collection" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="queryParams.operator" placeholder="请输入操作人" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 日志列表 -->
      <el-table
        v-loading="loading"
        :data="logList"
        style="width: 100%"
      >
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="content" label="内容" />
        <el-table-column prop="ip" label="IP地址" width="140" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useLogStore } from '@/common/store/modules/business/log';
import { ElMessage } from 'element-plus';

const logStore = useLogStore();
const { logList, pagination, queryParams, loading } = logStore;

const timeRange = ref<string[]>([]);

onMounted(() => {
  fetchLogList();
});

// 监听时间范围变化
watch(timeRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    logStore.updateQueryParams({
      startTime: newVal[0],
      endTime: newVal[1]
    });
  } else {
    logStore.updateQueryParams({
      startTime: undefined,
      endTime: undefined
    });
  }
});

const fetchLogList = () => {
  // 这里应该调用API获取日志列表
  // 暂时使用模拟数据
  logStore.setLoading(true);
  
  setTimeout(() => {
    const mockLogs = Array.from({ length: 50 }, (_, index) => ({
      id: `LOG${10000 + index}`,
      time: `2026-02-05 ${10 + Math.floor(index / 10)}:${(index % 60).toString().padStart(2, '0')}:00`,
      level: ['info', 'warn', 'error'][index % 3],
      module: ['system', 'device', 'alarm', 'collection'][index % 4],
      operator: ['admin', 'user1', 'user2'][index % 3],
      content: `这是第${index + 1}条日志内容`,
      ip: `192.168.1.${index % 255}`
    }));
    
    logStore.updateLogList(mockLogs.slice(0, pagination.pageSize));
    logStore.updatePagination({ total: mockLogs.length });
    logStore.setLoading(false);
  }, 500);
};

const handleQuery = () => {
  pagination.pageNum = 1;
  fetchLogList();
};

const resetQuery = () => {
  logStore.resetQueryParams();
  timeRange.value = [];
  fetchLogList();
};

const handleExport = async () => {
  try {
    // 这里应该调用API导出日志
    ElMessage.success('导出功能开发中...');
  } catch (err) {
    ElMessage.error('导出失败');
  }
};

const handleSizeChange = (newSize: number) => {
  pagination.pageSize = newSize;
  fetchLogList();
};

const handleCurrentChange = (newPage: number) => {
  pagination.pageNum = newPage;
  fetchLogList();
};

const getLevelType = (level: string) => {
  const map: Record<string, string> = {
    error: 'danger',
    warn: 'warning',
    info: 'success',
    debug: 'info'
  };
  return map[level] || 'info';
};
</script>

<style scoped>
.log-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>