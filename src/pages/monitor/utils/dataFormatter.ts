import type { RealtimeData, AlarmInfo, DeviceInfo } from '@/types/monitor'

/**
 * 格式化时间
 */
export function formatTime(timestamp: number, format: string = 'default'): string {
  const date = new Date(timestamp)
  
  if (format === 'iso') {
    return date.toISOString()
  }
  
  if (format === 'date') {
    return date.toLocaleDateString()
  }
  
  if (format === 'time') {
    return date.toLocaleTimeString()
  }
  
  // 默认格式：YYYY-MM-DD HH:mm:ss
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const diffInSeconds = Math.floor(diff / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}小时前`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}天前`
  }
  
  return formatTime(timestamp, 'date')
}

/**
 * 格式化数值
 */
export function formatNumber(value: number, options: {
  decimals?: number
  unit?: string
  thousandSeparator?: boolean
} = {}): string {
  const { decimals = 2, unit = '', thousandSeparator = true } = options
  
  let formatted = value.toFixed(decimals)
  
  if (thousandSeparator) {
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  
  if (unit) {
    return `${formatted} ${unit}`
  }
  
  return formatted
}

/**
 * 格式化传感器数据
 */
export function formatSensorData(data: RealtimeData): string {
  const { value, unit, sensorType, timestamp } = data
  const timeStr = formatTime(timestamp, 'time')
  
  return `${sensorType}: ${formatNumber(value, { decimals: 2, unit })} (${timeStr})`
}

/**
 * 格式化告警级别
 */
export function formatAlarmLevel(level: string): {
  text: string
  color: string
  icon: string
} {
  const levelMap: Record<string, { text: string; color: string; icon: string }> = {
    'critical': { text: '严重', color: '#f5222d', icon: 'error' },
    'error': { text: '错误', color: '#f5222d', icon: 'error' },
    'warning': { text: '警告', color: '#faad14', icon: 'warning' },
    'info': { text: '信息', color: '#1890ff', icon: 'info' }
  }
  
  return levelMap[level] || { text: '未知', color: '#bfbfbf', icon: 'help' }
}

/**
 * 格式化设备状态
 */
export function formatDeviceStatus(status: string): {
  text: string
  color: string
  icon: string
} {
  const statusMap: Record<string, { text: string; color: string; icon: string }> = {
    'online': { text: '在线', color: '#52c41a', icon: 'success' },
    'offline': { text: '离线', color: '#bfbfbf', icon: 'close' },
    'fault': { text: '故障', color: '#f5222d', icon: 'error' },
    'maintenance': { text: '维护中', color: '#faad14', icon: 'warning' }
  }
  
  return statusMap[status] || { text: '未知', color: '#bfbfbf', icon: 'help' }
}

/**
 * 数据质量评估
 */
export function assessDataQuality(quality: number): {
  level: 'good' | 'fair' | 'poor'
  text: string
  color: string
} {
  if (quality >= 80) {
    return { level: 'good', text: '良好', color: '#52c41a' }
  } else if (quality >= 60) {
    return { level: 'fair', text: '一般', color: '#faad14' }
  } else {
    return { level: 'poor', text: '较差', color: '#f5222d' }
  }
}

/**
 * 计算统计信息
 */
export function calculateStatistics(data: RealtimeData[]): {
  count: number
  avg: number
  max: number
  min: number
  sum: number
  stdDev: number
} {
  if (data.length === 0) {
    return { count: 0, avg: 0, max: 0, min: 0, sum: 0, stdDev: 0 }
  }
  
  const values = data.map(d => d.value)
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  // 计算标准差
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  return {
    count: values.length,
    avg,
    max,
    min,
    sum,
    stdDev
  }
}

/**
 * 数据采样（用于大量数据展示）
 */
export function sampleData(data: RealtimeData[], maxPoints: number = 100): RealtimeData[] {
  if (data.length <= maxPoints) {
    return data
  }
  
  const sampled: RealtimeData[] = []
  const step = Math.ceil(data.length / maxPoints)
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i])
  }
  
  return sampled
}

/**
 * 数据分组（按时间间隔）
 */
export function groupDataByTime(data: RealtimeData[], interval: 'hour' | 'day' | 'week' | 'month'): Map<string, RealtimeData[]> {
  const grouped = new Map<string, RealtimeData[]>()
  
  data.forEach(item => {
    const date = new Date(item.timestamp)
    let key: string
    
    switch (interval) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`
        break
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        break
      case 'week':
        const weekNumber = Math.ceil(date.getDate() / 7)
        key = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNumber}`
        break
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth() + 1}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    
    grouped.get(key)!.push(item)
  })
  
  return grouped
}

/**
 * 生成CSV数据
 */
export function generateCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) {
    return ''
  }
  
  const actualHeaders = headers || Object.keys(data[0])
  
  const csvRows = [
    actualHeaders.join(','),
    ...data.map(row => 
      actualHeaders.map(header => {
        const value = row[header]
        // 处理包含逗号、引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}

/**
 * 生成图表数据
 */
export function generateChartData(
  data: RealtimeData[], 
  options: {
    type?: 'line' | 'bar' | 'scatter'
    xField?: string
    yField?: string
    seriesField?: string
  } = {}
): any[] {
  const { type = 'line', xField = 'timestamp', yField = 'value', seriesField = 'sensorType' } = options
  
  if (type === 'scatter') {
    return data.map(item => ({
      [xField]: item.timestamp,
      [yField]: item.value,
      [seriesField]: item.sensorType,
      ...item
    }))
  }
  
  // 按系列分组
  const seriesMap = new Map<string, any[]>()
  
  data.forEach(item => {
    const seriesKey = item[seriesField as keyof RealtimeData] as string
    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, [])
    }
    
    seriesMap.get(seriesKey)!.push({
      [xField]: item.timestamp,
      [yField]: item.value,
      ...item
    })
  })
  
  return Array.from(seriesMap.entries()).map(([name, seriesData]) => ({
    name,
    type,
    data: seriesData
  }))
}