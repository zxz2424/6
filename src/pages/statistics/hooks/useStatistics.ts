import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
// 稍后需要导入 API
// import { statisticsApi } from '@/common/request/api/statistics'

export function useStatistics() {
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

  // 快速统计数据
  const quickStats = ref([
    {
      title: '总设备数',
      value: 156,
      trend: 5.2,
      trendIcon: true,
      trendClass: 'up'
    },
    {
      title: '在线率',
      value: '95.3%',
      trend: 1.8,
      trendIcon: true,
      trendClass: 'up'
    },
    {
      title: '今日告警',
      value: 23,
      trend: -12.5,
      trendIcon: true,
      trendClass: 'down'
    },
    {
      title: '数据采集量',
      value: '1.2M',
      trend: 8.3,
      trendIcon: true,
      trendClass: 'up'
    }
  ])

  // 图表数据
  const chartData = reactive({
    onlineRate: {
      xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      series: [{
        name: '在线率',
        type: 'line',
        data: [92, 93, 95, 94, 96, 95, 97],
        smooth: true
      }]
    },
    alarmDistribution: {
      series: [
        { name: '高危', value: 5 },
        { name: '中危', value: 12 },
        { name: '低危', value: 36 }
      ]
    },
    collectionRate: {
      xAxis: ['MQTT', 'TCP', 'HTTP', 'WebSocket'],
      series: [{
        name: '成功率',
        type: 'bar',
        data: [99.6, 98.2, 97.8, 99.1]
      }]
    },
    deviceDistribution: {
      series: [
        { name: '传感器', value: 65 },
        { name: '摄像头', value: 28 },
        { name: '控制器', value: 12 }
      ]
    }
  })

  // 加载状态
  const chartLoading = reactive({
    onlineRate: false,
    alarmDistribution: false,
    collectionRate: false,
    deviceDistribution: false
  })

  const tableLoading = ref(false)
  const tableData = ref<any[]>([])
  const tableType = ref('device')
  const exporting = ref(false)

  // 加载所有数据
  const loadAllData = async () => {
    await Promise.all([
      loadQuickStats(),
      loadCharts()
    ])
  }

  // 加载快速统计
  const loadQuickStats = async () => {
    try {
      // const result = await statisticsApi.getDeviceStats({ ...filterParams })
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500))
      ElMessage.success('统计数据已更新')
    } catch (error) {
      console.error('加载快速统计失败:', error)
    }
  }

  // 加载所有图表
  const loadCharts = async () => {
    await Promise.all([
      loadOnlineRateChart(),
      loadAlarmDistributionChart(),
      loadCollectionRateChart(),
      loadDeviceDistributionChart()
    ])
  }

  // 加载在线率图表
  const loadOnlineRateChart = async () => {
    chartLoading.onlineRate = true
    try {
      // const result = await statisticsApi.getOnlineRateStats({ ...filterParams })
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 800))
      // 更新图表数据
    } catch (error) {
      console.error('加载在线率图表失败:', error)
    } finally {
      chartLoading.onlineRate = false
    }
  }

  // 加载告警分布图表
  const loadAlarmDistributionChart = async () => {
    chartLoading.alarmDistribution = true
    try {
      // const result = await statisticsApi.getAlarmStats({ ...filterParams })
      await new Promise(resolve => setTimeout(resolve, 600))
    } catch (error) {
      console.error('加载告警分布图表失败:', error)
    } finally {
      chartLoading.alarmDistribution = false
    }
  }

  // 加载采集成功率图表
  const loadCollectionRateChart = async () => {
    chartLoading.collectionRate = true
    try {
      // const result = await statisticsApi.getCollectionStats({ ...filterParams })
      await new Promise(resolve => setTimeout(resolve, 700))
    } catch (error) {
      console.error('加载采集成功率图表失败:', error)
    } finally {
      chartLoading.collectionRate = false
    }
  }

  // 加载设备分布图表
  const loadDeviceDistributionChart = async () => {
    chartLoading.deviceDistribution = true
    try {
      // const result = await statisticsApi.getDeviceStats({ ...filterParams })
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('加载设备分布图表失败:', error)
    } finally {
      chartLoading.deviceDistribution = false
    }
  }

  // 加载表格数据
  const loadTableData = async () => {
    tableLoading.value = true
    try {
      // 根据表格类型调用不同 API
      // switch (tableType.value) {
      //   case 'device':
      //     await statisticsApi.getDeviceStats({ ...filterParams })
      //     break
      //   case 'alarm':
      //     await statisticsApi.getAlarmStats({ ...filterParams })
      //     break
      //   case 'collection':
      //     await statisticsApi.getCollectionStats({ ...filterParams })
      //     break
      // }
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('加载表格数据失败:', error)
    } finally {
      tableLoading.value = false
    }
  }

  // 筛选条件变化
  const handleFilterChange = (params: any) => {
    Object.assign(filterParams, params)
    loadAllData()
  }

  // 重置筛选
  const handleResetFilter = () => {
    filterParams.timeRange = [
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substr(0, 19),
      new Date().toISOString().replace('T', ' ').substr(0, 19)
    ]
    filterParams.deviceType = ''
    filterParams.areaId = ''
    filterParams.granularity = 'day'
    loadAllData()
  }

  return {
    filterParams,
    quickStats,
    chartData,
    chartLoading,
    tableLoading,
    tableData,
    tableType,
    exporting,
    loadAllData,
    loadCharts,
    loadTableData,
    loadOnlineRateChart,
    loadAlarmDistributionChart,
    loadCollectionRateChart,
    loadDeviceDistributionChart,
    handleFilterChange,
    handleResetFilter
  }
}