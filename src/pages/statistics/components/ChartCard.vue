<template>
  <el-card class="chart-card">
    <template #header>
      <div class="chart-header">
        <span class="chart-title">{{ title }}</span>
        <div class="chart-actions">
          <el-button
            v-if="refreshable"
            type="text"
            :icon="Refresh"
            @click="handleRefresh"
            :loading="loading"
          >
            刷新
          </el-button>
          <el-dropdown v-if="exportable" @command="handleExport">
            <el-button type="text" :icon="Download">
              导出
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="png">PNG图片</el-dropdown-item>
                <el-dropdown-item command="csv">CSV数据</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>
    
    <div v-if="loading" class="chart-loading">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="!data || Object.keys(data).length === 0" class="chart-empty">
      <el-empty description="暂无数据" />
    </div>
    
    <div v-else class="chart-container" ref="chartRef"></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Refresh, Download } from '@element-plus/icons-vue'
import type { EChartsType } from 'echarts/core'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'line'
  },
  refreshable: {
    type: Boolean,
    default: true
  },
  exportable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['refresh'])

const chartRef = ref<HTMLElement>()
let chartInstance: EChartsType | null = null

// 根据不同类型生成图表配置
const generateChartOption = (type: string, data: any) => {
  const baseOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#dcdfe6',
      borderWidth: 1
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  if (type === 'line') {
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        data: data.xAxis || []
      },
      yAxis: {
        type: 'value'
      },
      series: data.series || []
    }
  }

  if (type === 'pie') {
    return {
      ...baseOption,
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: 10,
        left: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.series || [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }

  if (type === 'bar') {
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        data: data.xAxis || []
      },
      yAxis: {
        type: 'value'
      },
      series: data.series || []
    }
  }

  return baseOption
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  if (props.data && Object.keys(props.data).length > 0) {
    const option = generateChartOption(props.type, props.data)
    chartInstance.setOption(option)
  }
  
  // 响应式调整
  window.addEventListener('resize', handleResize)
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (chartInstance && newData && Object.keys(newData).length > 0) {
    const option = generateChartOption(props.type, newData)
    chartInstance.setOption(option)
  }
}, { deep: true })

// 监听loading状态
watch(() => props.loading, (newVal) => {
  if (!newVal && chartRef.value) {
    nextTick(() => {
      initChart()
    })
  }
})

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

const handleRefresh = () => {
  emit('refresh')
}

const handleExport = (command: string) => {
  console.log(`导出图表: ${command}`)
  // 这里可以添加导出逻辑
}

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.chart-card {
  height: 400px;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .chart-title {
      font-weight: 600;
      color: #303133;
    }
    
    .chart-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .chart-loading,
  .chart-empty {
    height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chart-container {
    height: 320px;
    width: 100%;
  }
}
</style>