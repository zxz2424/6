<template>
  <div class="statistics-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="text" 
          @click="goToHome"
          class="back-home-btn"
          style="margin-right: 16px;"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回主页
        </el-button>
        <h1>数据统计与分析</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
        <el-button @click="refreshAll">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-panel">
      <el-form :model="filterParams" label-width="80px">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filterParams.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="设备类型">
              <el-select
                v-model="filterParams.deviceType"
                placeholder="请选择设备类型"
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="传感器" value="sensor" />
                <el-option label="摄像头" value="camera" />
                <el-option label="控制器" value="controller" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="区域">
              <el-select
                v-model="filterParams.areaId"
                placeholder="请选择区域"
                clearable
                style="width: 100%"
              >
                <el-option label="全部区域" value="" />
                <el-option label="A区" value="area_a" />
                <el-option label="B区" value="area_b" />
                <el-option label="C区" value="area_c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="统计粒度">
              <el-select
                v-model="filterParams.granularity"
                placeholder="请选择统计粒度"
                style="width: 100%"
              >
                <el-option label="按小时" value="hour" />
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
                <el-option label="按月" value="month" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: right;">
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="card-content">
              <div class="card-title">总设备数</div>
              <div class="card-value">156</div>
              <div class="card-trend up">
                <el-icon><CaretTop /></el-icon>
                +5.2%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="card-content">
              <div class="card-title">在线率</div>
              <div class="card-value">95.3%</div>
              <div class="card-trend up">
                <el-icon><CaretTop /></el-icon>
                +1.8%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="card-content">
              <div class="card-title">今日告警</div>
              <div class="card-value">23</div>
              <div class="card-trend down">
                <el-icon><CaretBottom /></el-icon>
                -12.5%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="card-content">
              <div class="card-title">数据采集量</div>
              <div class="card-value">1.2M</div>
              <div class="card-trend up">
                <el-icon><CaretTop /></el-icon>
                +8.3%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="16">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">设备在线率趋势</span>
                <el-button type="text" @click="refreshChart('onlineRate')">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="chart-container" ref="onlineRateChart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">告警统计分布</span>
                <el-button type="text" @click="refreshChart('alarmDistribution')">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="chart-container" ref="alarmDistributionChart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">数据采集成功率</span>
                <el-button type="text" @click="refreshChart('collectionRate')">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="chart-container" ref="collectionRateChart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span class="chart-title">设备类型分布</span>
                <el-button type="text" @click="refreshChart('deviceDistribution')">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="chart-container" ref="deviceDistributionChart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <div class="data-table-section">
      <el-card class="table-card">
        <template #header>
          <div class="table-header">
            <span>详细统计数据</span>
            <div class="table-actions">
              <el-select v-model="tableType" placeholder="选择数据类型" style="width: 120px">
                <el-option label="设备统计" value="device" />
                <el-option label="告警统计" value="alarm" />
                <el-option label="采集统计" value="collection" />
              </el-select>
              <el-button @click="exportTableData">导出表格</el-button>
            </div>
          </div>
        </template>
        <el-table
          :data="tableData"
          style="width: 100%"
          v-loading="tableLoading"
        >
          <el-table-column
            v-if="tableType === 'device'"
            prop="deviceName"
            label="设备名称"
            width="120"
          />
          <el-table-column
            v-if="tableType === 'device'"
            prop="deviceType"
            label="设备类型"
            width="100"
          />
          <el-table-column
            v-if="tableType === 'device'"
            prop="area"
            label="所在区域"
            width="100"
          />
          <el-table-column
            v-if="tableType === 'device'"
            prop="onlineRate"
            label="在线率"
            width="100"
            :formatter="formatPercent"
          />
          <el-table-column
            v-if="tableType === 'device'"
            prop="dataCount"
            label="数据量"
            width="100"
            :formatter="formatNumber"
          />
          
          <el-table-column
            v-if="tableType === 'alarm'"
            prop="alarmId"
            label="告警ID"
            width="120"
          />
          <el-table-column
            v-if="tableType === 'alarm'"
            prop="deviceName"
            label="设备名称"
            width="120"
          />
          <el-table-column
            v-if="tableType === 'alarm'"
            prop="alarmType"
            label="告警类型"
            width="100"
          />
          
          <el-table-column
            v-if="tableType === 'collection'"
            prop="protocol"
            label="协议类型"
            width="100"
          />
          <el-table-column
            v-if="tableType === 'collection'"
            prop="dataType"
            label="数据类型"
            width="100"
          />
          <el-table-column
            v-if="tableType === 'collection'"
            prop="totalCount"
            label="总数"
            width="100"
            :formatter="formatNumber"
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
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, CaretTop, CaretBottom } from '@element-plus/icons-vue'

const router = useRouter()

const goToHome = () => {
  router.push('/home')
}

// 筛选参数
const filterParams = reactive({
  timeRange: [
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substr(0, 19),
    new Date().toISOString().replace('T', ' ').substr(0, 19)
  ],
  deviceType: '',
  areaId: '',
  granularity: 'day'
})

// 图表相关
const onlineRateChart = ref<HTMLElement>()
const alarmDistributionChart = ref<HTMLElement>()
const collectionRateChart = ref<HTMLElement>()
const deviceDistributionChart = ref<HTMLElement>()

let onlineRateChartInstance: echarts.ECharts | null = null
let alarmDistributionChartInstance: echarts.ECharts | null = null
let collectionRateChartInstance: echarts.ECharts | null = null
let deviceDistributionChartInstance: echarts.ECharts | null = null

// 表格相关
const tableType = ref('device')
const tableLoading = ref(false)
const tableData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const exporting = ref(false)

// 格式化函数
const formatPercent = (row: any, column: any, cellValue: any) => {
  if (typeof cellValue === 'number') {
    return `${(cellValue * 100).toFixed(2)}%`
  }
  return cellValue
}

const formatNumber = (row: any, column: any, cellValue: any) => {
  if (typeof cellValue === 'number') {
    return cellValue.toLocaleString()
  }
  return cellValue
}

// 初始化图表
const initCharts = () => {
  // 在线率趋势图
  if (onlineRateChart.value) {
    onlineRateChartInstance = echarts.init(onlineRateChart.value)
    onlineRateChartInstance.setOption({
      title: { text: '' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '在线率',
        type: 'line',
        data: [92, 93, 95, 94, 96, 95, 97],
        smooth: true,
        itemStyle: { color: '#409EFF' }
      }]
    })
  }

  // 告警分布图
  if (alarmDistributionChart.value) {
    alarmDistributionChartInstance = echarts.init(alarmDistributionChart.value)
    alarmDistributionChartInstance.setOption({
      title: { text: '' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 10, left: 'center' },
      series: [{
        name: '告警分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 5, name: '高危', itemStyle: { color: '#F56C6C' } },
          { value: 12, name: '中危', itemStyle: { color: '#E6A23C' } },
          { value: 36, name: '低危', itemStyle: { color: '#67C23A' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }

  // 采集成功率图
  if (collectionRateChart.value) {
    collectionRateChartInstance = echarts.init(collectionRateChart.value)
    collectionRateChartInstance.setOption({
      title: { text: '' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['MQTT', 'TCP', 'HTTP', 'WebSocket']
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '成功率',
        type: 'bar',
        data: [99.6, 98.2, 97.8, 99.1],
        itemStyle: { color: '#409EFF' }
      }]
    })
  }

  // 设备类型分布图
  if (deviceDistributionChart.value) {
    deviceDistributionChartInstance = echarts.init(deviceDistributionChart.value)
    deviceDistributionChartInstance.setOption({
      title: { text: '' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 10, left: 'center' },
      series: [{
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 65, name: '传感器', itemStyle: { color: '#409EFF' } },
          { value: 28, name: '摄像头', itemStyle: { color: '#67C23A' } },
          { value: 12, name: '控制器', itemStyle: { color: '#E6A23C' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }
}

// 刷新图表
const refreshChart = (chartType: string) => {
  switch (chartType) {
    case 'onlineRate':
      // 模拟重新加载数据
      if (onlineRateChartInstance) {
        onlineRateChartInstance.showLoading()
        setTimeout(() => {
          onlineRateChartInstance?.hideLoading()
        }, 500)
      }
      break
    case 'alarmDistribution':
      if (alarmDistributionChartInstance) {
        alarmDistributionChartInstance.showLoading()
        setTimeout(() => {
          alarmDistributionChartInstance?.hideLoading()
        }, 500)
      }
      break
    case 'collectionRate':
      if (collectionRateChartInstance) {
        collectionRateChartInstance.showLoading()
        setTimeout(() => {
          collectionRateChartInstance?.hideLoading()
        }, 500)
      }
      break
    case 'deviceDistribution':
      if (deviceDistributionChartInstance) {
        deviceDistributionChartInstance.showLoading()
        setTimeout(() => {
          deviceDistributionChartInstance?.hideLoading()
        }, 500)
      }
      break
  }
}

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (tableType.value === 'device') {
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
    } else if (tableType.value === 'alarm') {
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
    } else if (tableType.value === 'collection') {
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
  } catch (error) {
    console.error('加载表格数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    tableLoading.value = false
  }
}

// 页面事件处理
const handleFilter = () => {
  ElMessage.info('查询条件已应用')
  loadTableData()
}

const handleReset = () => {
  filterParams.timeRange = [
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substr(0, 19),
    new Date().toISOString().replace('T', ' ').substr(0, 19)
  ]
  filterParams.deviceType = ''
  filterParams.areaId = ''
  filterParams.granularity = 'day'
  loadTableData()
}

const refreshAll = () => {
  initCharts()
  loadTableData()
  ElMessage.success('数据已刷新')
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm('请选择要导出的报表类型', '导出报表', {
      confirmButtonText: 'Excel',
      cancelButtonText: 'PDF',
      distinguishCancelAndClose: true,
      type: 'info'
    })
    exporting.value = true
    // 模拟导出
    await new Promise(resolve => setTimeout(resolve, 1500))
    ElMessage.success('报表导出任务已开始，请稍后下载')
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.success('PDF导出任务已开始，请稍后下载')
    }
  } finally {
    exporting.value = false
  }
}

const exportTableData = () => {
  ElMessage.info('表格数据导出功能开发中')
}

const handleView = (row: any) => {
  ElMessage.info(`查看详情: ${JSON.stringify(row)}`)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadTableData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadTableData()
}

// 监听窗口大小变化，重新调整图表
const handleResize = () => {
  if (onlineRateChartInstance) onlineRateChartInstance.resize()
  if (alarmDistributionChartInstance) alarmDistributionChartInstance.resize()
  if (collectionRateChartInstance) collectionRateChartInstance.resize()
  if (deviceDistributionChartInstance) deviceDistributionChartInstance.resize()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initCharts()
    loadTableData()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (onlineRateChartInstance) onlineRateChartInstance.dispose()
  if (alarmDistributionChartInstance) alarmDistributionChartInstance.dispose()
  if (collectionRateChartInstance) collectionRateChartInstance.dispose()
  if (deviceDistributionChartInstance) deviceDistributionChartInstance.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.statistics-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      
      h1 {
        margin: 0;
        color: #303133;
        font-size: 24px;
        font-weight: 500;
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .filter-panel {
    margin-bottom: 20px;
    
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .stat-cards {
    margin: 20px 0;

    .stat-card {
      :deep(.el-card__body) {
        padding: 20px;
      }

      .card-content {
        .card-title {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }

        .card-trend {
          display: flex;
          align-items: center;
          font-size: 12px;

          &.up {
            color: #67c23a;
          }

          &.down {
            color: #f56c6c;
          }

          .el-icon {
            margin-right: 2px;
          }
        }
      }
    }
  }

  .charts-section {
    margin: 20px 0;

    .chart-card {
      height: 400px;
      
      :deep(.el-card__header) {
        padding: 16px 20px;
      }
      
      :deep(.el-card__body) {
        padding: 0;
        height: calc(100% - 56px);
      }

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .chart-title {
          font-weight: 600;
          color: #303133;
        }
      }

      .chart-container {
        height: 100%;
        width: 100%;
      }
    }
  }

  .data-table-section {
    margin-top: 20px;

    .table-card {
      :deep(.el-card__header) {
        padding: 16px 20px;
      }

      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        span {
          font-weight: 500;
          color: #303133;
        }

        .table-actions {
          display: flex;
          gap: 10px;
        }
      }

      .pagination-container {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}
</style>