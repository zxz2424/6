<template>
  <div class="data-table">
    <div v-if="loading" class="table-loading">
      <el-skeleton :rows="6" animated />
    </div>
    
    <div v-else-if="!tableData || tableData.length === 0" class="table-empty">
      <el-empty description="暂无数据" />
    </div>
    
    <el-table
      v-else
      :data="tableData"
      style="width: 100%"
      :border="true"
      v-bind="$attrs"
    >
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :formatter="column.formatter"
      />
      
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="text" @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  type: {
    type: String,
    default: 'device'
  },
  params: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const tableData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 根据表格类型生成列配置
const columns = computed(() => {
  if (props.type === 'device') {
    return [
      { prop: 'deviceName', label: '设备名称', width: 120 },
      { prop: 'deviceType', label: '设备类型', width: 100 },
      { prop: 'area', label: '所在区域', width: 100 },
      { prop: 'onlineRate', label: '在线率', width: 100, formatter: (row: any) => `${(row.onlineRate * 100).toFixed(2)}%` },
      { prop: 'dataCount', label: '数据量', width: 100, formatter: (row: any) => row.dataCount.toLocaleString() },
      { prop: 'lastOnlineTime', label: '最后在线时间', width: 150 },
      { prop: 'status', label: '状态', width: 80, formatter: (row: any) => row.status === 'online' ? '在线' : '离线' }
    ]
  }
  
  if (props.type === 'alarm') {
    return [
      { prop: 'alarmId', label: '告警ID', width: 120 },
      { prop: 'deviceName', label: '设备名称', width: 120 },
      { prop: 'alarmType', label: '告警类型', width: 100 },
      { prop: 'alarmLevel', label: '告警级别', width: 100, formatter: (row: any) => {
        const levels: Record<string, string> = { high: '高危', medium: '中危', low: '低危' }
        return levels[row.alarmLevel] || row.alarmLevel
      }},
      { prop: 'triggerTime', label: '触发时间', width: 150 },
      { prop: 'duration', label: '持续时间', width: 100, formatter: (row: any) => `${row.duration}分钟` },
      { prop: 'status', label: '状态', width: 80, formatter: (row: any) => row.status === 'handled' ? '已处理' : '未处理' }
    ]
  }
  
  if (props.type === 'collection') {
    return [
      { prop: 'protocol', label: '协议类型', width: 100 },
      { prop: 'dataType', label: '数据类型', width: 100 },
      { prop: 'totalCount', label: '总数', width: 100, formatter: (row: any) => row.totalCount.toLocaleString() },
      { prop: 'successCount', label: '成功数', width: 100, formatter: (row: any) => row.successCount.toLocaleString() },
      { prop: 'failCount', label: '失败数', width: 100, formatter: (row: any) => row.failCount.toLocaleString() },
      { prop: 'successRate', label: '成功率', width: 100, formatter: (row: any) => `${(row.successRate * 100).toFixed(2)}%` },
      { prop: 'avgResponseTime', label: '平均响应时间', width: 120, formatter: (row: any) => `${row.avgResponseTime}ms` }
    ]
  }
  
  return []
})

// 监听类型变化
watch(() => props.type, () => {
  loadTableData()
})

// 监听参数变化
watch(() => props.params, () => {
  loadTableData()
}, { deep: true })

// 加载表格数据
const loadTableData = () => {
  emit('refresh')
  // 模拟数据加载
  if (props.type === 'device') {
    tableData.value = [
      {
        id: '1',
        deviceName: '温度传感器01',
        deviceType: 'sensor',
        area: 'A区',
        onlineRate: 0.95,
        dataCount: 24500,
        lastOnlineTime: '2024-01-20 14:30:00',
        status: 'online'
      },
      {
        id: '2',
        deviceName: '湿度传感器02',
        deviceType: 'sensor',
        area: 'B区',
        onlineRate: 0.88,
        dataCount: 19800,
        lastOnlineTime: '2024-01-20 13:45:00',
        status: 'online'
      }
    ]
    total.value = 50
  } else if (props.type === 'alarm') {
    tableData.value = [
      {
        alarmId: 'ALM001',
        deviceName: '摄像头01',
        alarmType: '离线告警',
        alarmLevel: 'high',
        triggerTime: '2024-01-20 10:30:00',
        duration: 120,
        status: 'handled'
      }
    ]
    total.value = 30
  } else if (props.type === 'collection') {
    tableData.value = [
      {
        protocol: 'MQTT',
        dataType: 'sensor',
        totalCount: 50000,
        successCount: 49800,
        failCount: 200,
        successRate: 0.996,
        avgResponseTime: 120
      }
    ]
    total.value = 10
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadTableData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadTableData()
}

const handleView = (row: any) => {
  ElMessage.info(`查看详情: ${JSON.stringify(row)}`)
}

// 初始加载
onMounted(() => {
  loadTableData()
})
</script>

<style scoped lang="scss">
.data-table {
  .table-loading,
  .table-empty {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>