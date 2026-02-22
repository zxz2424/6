<!-- src/pages/alarm/index.vue -->
<template>
  <div class="alarm-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>告警管理</span>
          <el-button type="primary" size="small">新增</el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="设备名称">
          <el-input v-model="queryParams.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="告警级别">
          <el-select v-model="queryParams.level" placeholder="请选择告警级别">
            <el-option label="全部" value="" />
            <el-option label="紧急" value="emergency" />
            <el-option label="重要" value="important" />
            <el-option label="一般" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警状态">
          <el-select v-model="queryParams.status" placeholder="请选择告警状态">
            <el-option label="全部" value="" />
            <el-option label="未处理" value="unhandled" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已清除" value="cleared" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="operation-buttons">
        <el-button type="success" @click="handleConfirm(selectedIds)" :disabled="!selectedIds.length">批量确认</el-button>
        <el-button type="warning" @click="handleClear(selectedIds)" :disabled="!selectedIds.length">批量清除</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>

      <!-- 告警列表 -->
      <el-table
        v-loading="loading"
        :data="alarmList"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="告警ID" width="120" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="content" label="告警内容" />
        <el-table-column prop="level" label="告警级别">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">
              {{ getLevelText(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="告警状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerTime" label="触发时间" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">详情</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleConfirm([scope.row.id])"
              v-if="scope.row.status === 'unhandled'"
            >
              确认
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleClear([scope.row.id])"
              v-if="scope.row.status === 'confirmed'"
            >
              清除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAlarmStore } from '@/common/store/modules/business/alarm';
import { ElMessage, ElMessageBox } from 'element-plus';

const alarmStore = useAlarmStore();
const { alarmList, total, page, size, queryParams, loading } = alarmStore;

const selectedIds = ref<string[]>([]);

onMounted(() => {
  alarmStore.fetchAlarmList();
  alarmStore.fetchAlarmStatistics();
});

const handleQuery = () => {
  alarmStore.fetchAlarmList();
};

const resetQuery = () => {
  alarmStore.resetQueryParams();
  alarmStore.fetchAlarmList();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleConfirm = async (ids: string[]) => {
  try {
    await ElMessageBox.confirm('确认处理选中的告警吗？', '提示', {
      type: 'warning'
    });
    await alarmStore.confirmAlarm(ids);
    ElMessage.success('告警确认成功');
    alarmStore.fetchAlarmList();
  } catch (err) {
    // 用户取消
  }
};

const handleClear = async (ids: string[]) => {
  try {
    await ElMessageBox.confirm('确认清除选中的告警吗？', '提示', {
      type: 'warning'
    });
    await alarmStore.clearAlarm(ids);
    ElMessage.success('告警清除成功');
    alarmStore.fetchAlarmList();
  } catch (err) {
    // 用户取消
  }
};

const handleExport = async () => {
  try {
    const blob = await alarmStore.exportAlarm();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `告警列表_${new Date().toLocaleDateString()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    ElMessage.error('导出失败');
  }
};

const handleView = (row: any) => {
  alarmStore.setCurrentAlarm(row);
  // 这里可以跳转到详情页或显示详情弹窗
  ElMessage.info(`查看告警详情：${row.id}`);
};

const handleSizeChange = (newSize: number) => {
  size.value = newSize;
  alarmStore.fetchAlarmList();
};

const handleCurrentChange = (newPage: number) => {
  page.value = newPage;
  alarmStore.fetchAlarmList();
};

const getLevelType = (level: string) => {
  const map: Record<string, string> = {
    emergency: 'danger',
    important: 'warning',
    normal: 'info'
  };
  return map[level] || 'info';
};

const getLevelText = (level: string) => {
  const map: Record<string, string> = {
    emergency: '紧急',
    important: '重要',
    normal: '一般'
  };
  return map[level] || '未知';
};

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    unhandled: 'danger',
    confirmed: 'warning',
    cleared: 'success'
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    unhandled: '未处理',
    confirmed: '已确认',
    cleared: '已清除'
  };
  return map[status] || '未知';
};
</script>

<style scoped>
.alarm-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-buttons {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>