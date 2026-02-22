<template>
  <div class="monitor-alarm-page">
    <div class="page-header">
      <h1>监控告警</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="warning" @click="handleClearAll">
          <el-icon><Delete /></el-icon>
          全部清除
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    
    <div class="alarm-content">
      <!-- 告警统计 -->
      <div class="statistics-cards">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>活跃告警</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ activeAlarmCount }}</div>
            <div class="stat-label">当前活跃告警数量</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>今日新增</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ todayAlarmCount }}</div>
            <div class="stat-label">今日新增告警</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>已处理</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ processedAlarmCount }}</div>
            <div class="stat-label">已处理告警</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>告警率</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-value">{{ alarmRate }}%</div>
            <div class="stat-label">设备告警比例</div>
          </div>
        </el-card>
      </div>
      
      <!-- 告警列表 -->
      <el-card class="alarm-list-card">
        <template #header>
          <div class="card-header">
            <span>告警列表</span>
            <div class="filter-controls">
              <el-select v-model="filter.level" placeholder="告警级别" clearable>
                <el-option label="严重" value="critical" />
                <el-option label="错误" value="error" />
                <el-option label="警告" value="warning" />
                <el-option label="信息" value="info" />
              </el-select>
              
              <el-select v-model="filter.status" placeholder="告警状态" clearable>
                <el-option label="活跃" value="active" />
                <el-option label="已确认" value="acknowledged" />
                <el-option label("已清除" value="cleared" />
              </el-select>
              
              <el-date-picker
                v-model="filter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </div>
          </div>
        </template>
        
        <el-table :data="filteredAlarms" v-loading="loading">
          <el-table-column prop="deviceName" label="设备名称" width="150" />
          <el-table-column prop="alarmType" label="告警类型" width="120" />
          <el-table-column prop="level" label="级别" width="80">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.level)">
                {{ formatLevel(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="告警信息" min-width="200" />
          <el-table-column prop="timestamp" label="发生时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ row.acknowledged ? '已确认' : '未确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="handleViewAlarm(row)">
                详情
              </el-button>
              <el-button
                v-if="!row.acknowledged"
                size="small"
                type="primary"
                @click="handleAcknowledge(row.id)"
              >
                确认
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalAlarms"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 告警详情弹窗 -->
    <el-dialog
      v-model="showAlarmDetail"
      :title="selectedAlarm ? `告警详情 - ${selectedAlarm.deviceName}` : '告警详情'"
      width="600px"
    >
      <div v-if="selectedAlarm" class="alarm-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>设备名称：</label>
              <span>{{ selectedAlarm.deviceName }}</span>
            </div>
            <div class="detail-item">
              <label>告警类型：</label>
              <span>{{ selectedAlarm.alarmType }}</span>
            </div>
            <div class="detail-item">
              <label>告警级别：</label>
              <el-tag :type="getLevelTagType(selectedAlarm.level)">
                {{ formatLevel(selectedAlarm.level) }}
              </el-tag>
            </div>
            <div class="detail-item">
              <label>发生时间：</label>
              <span>{{ formatTime(selectedAlarm.timestamp) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>告警信息</h3>
          <div class="alarm-message">
            {{ selectedAlarm.message }}
          </div>
        </div>
        
        <div v-if="selectedAlarm.data" class="detail-section">
          <h3>附加数据</h3>
          <pre class="alarm-data">{{ JSON.stringify(selectedAlarm.data, null, 2) }}</pre>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAlarmDetail = false">关闭</el-button>
          <el-button
            v-if="selectedAlarm && !selectedAlarm.acknowledged"
            type="primary"
            @click="handleAcknowledge(selectedAlarm.id)"
          >
            确认告警
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, Download } from '@element-plus/icons-vue'
import { monitorApi } from '@/common/request/api/monitor'
import { useMonitorStore } from '@/common/store/modules/monitor'
import type { AlarmInfo } from '@/types/monitor'
import { formatTime, formatAlarmLevel } from '../utils/dataFormatter'

const monitorStore = useMonitorStore()

// 状态
const loading = ref(false)
const showAlarmDetail = ref(false)
const selectedAlarm = ref<AlarmInfo | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalAlarms = ref(0)

// 过滤器
const filter = ref({
  level: '',
  status: '',
  dateRange: [] as Date[]
})

// 计算属性
const activeAlarmCount = computed(() => {
  return monitorStore.alarms.filter(a => a.status === 'active').length
})

const todayAlarmCount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return monitorStore.alarms.filter(a => 
    a.timestamp >= today.getTime() && a.status === 'active'
  ).length
})

const processedAlarmCount = computed(() => {
  return monitorStore.alarms.filter(a => 
    a.acknowledged || a.status === 'cleared'
  ).length
})

const alarmRate = computed(() => {
  const totalDevices = monitorStore.devices.length
  const devicesWithAlarms = new Set(monitorStore.alarms.map(a => a.deviceId)).size
  return totalDevices > 0 ? Math.round((devicesWithAlarms / totalDevices) * 100) : 0
})

const filteredAlarms = computed(() => {
  let filtered = [...monitorStore.alarms]
  
  // 级别过滤
  if (filter.value.level) {
    filtered = filtered.filter(a => a.level === filter.value.level)
  }
  
  // 状态过滤
  if (filter.value.status) {
    filtered = filtered.filter(a => a.status === filter.value.status)
  }
  
  // 日期过滤
  if (filter.value.dateRange && filter.value.dateRange.length === 2) {
    const [start, end] = filter.value.dateRange
    const startTime = start.getTime()
    const endTime = end.getTime() + 86400000 // 包括结束日期的全天
    
    filtered = filtered.filter(a => 
      a.timestamp >= startTime && a.timestamp <= endTime
    )
  }
  
  totalAlarms.value = filtered.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 初始化
onMounted(async () => {
  await loadAlarms()
})

// 加载告警数据
const loadAlarms = async () => {
  loading.value = true
  try {
    const result = await monitorApi.getAlarms({
      page: currentPage.value,
      size: pageSize.value
    })
    monitorStore.setAlarms(result.list)
    totalAlarms.value = result.total
  } catch (error) {
    ElMessage.error('加载告警数据失败')
    console.error('加载告警错误:', error)
  } finally {
    loading.value = false
  }
}

// 查看告警详情
const handleViewAlarm = (alarm: AlarmInfo) => {
  selectedAlarm.value = alarm
  showAlarmDetail.value = true
}

// 确认告警
const handleAcknowledge = async (alarmId: string) => {
  try {
    await monitorApi.acknowledgeAlarm({ alarmId })
    monitorStore.acknowledgeAlarm(alarmId)
    ElMessage.success('告警已确认')
  } catch (error) {
    ElMessage.error('确认告警失败')
  }
}

// 刷新
const handleRefresh = async () => {
  await loadAlarms()
  ElMessage.success('告警数据已刷新')
}

// 清除所有
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm('确认清除所有告警记录？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // TODO: 调用API清除所有告警
    monitorStore.setAlarms([])
    ElMessage.success('所有告警已清除')
  } catch {
    // 用户取消
  }
}

// 导出
const handleExport = async () => {
  loading.value = true
  try {
    const data = await monitorApi.exportRealtimeData({
      format: 'excel',
      startTime: filter.value.dateRange?.[0]?.getTime(),
      endTime: filter.value.dateRange?.[1]?.getTime()
    })
    
    // 创建下载链接
    const blob = new Blob([data], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alarms_${new Date().getTime()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadAlarms()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadAlarms()
}

// 工具函数
const getLevelTagType = (level: string) => {
  switch (level) {
    case 'critical': return 'danger'
    case 'error': return 'danger'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return ''
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'danger'
    case 'acknowledged': return 'warning'
    case 'cleared': return 'success'
    default: return ''
  }
}

const formatLevel = (level: string) => {
  const levelInfo = formatAlarmLevel(level)
  return levelInfo.text
}
</script>

<style scoped>
.monitor-alarm-page {
  padding: 20px;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.alarm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  text-align: center;
}

.card-header {
  font-weight: bold;
}

.card-content {
  padding: 20px 0;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.alarm-list-card {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.alarm-detail {
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item label {
  font-weight: bold;
  color: #666;
  min-width: 80px;
}

.alarm-message {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  line-height: 1.5;
}

.alarm-data {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>