//数据统计模块 - 数据格式化工具
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const formatPercent = (value: number, decimals = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

export const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天${hours % 24}小时`
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`
  return `${seconds}秒`
}

export const generateChartData = (
  xData: any[],
  series: any[],
  options: { type: string } = { type: 'line' }
) => {
  return {
    xAxis: xData,
    series: series.map((item, index) => ({
      name: item.name || `系列${index + 1}`,
      type: options.type,
      data: item.data,
      smooth: true,
      itemStyle: {
        color: item.color
      }
    }))
  }
}


export const generatePieData = (
  data: Array<{ name: string; value: number; color?: string }>
) => {
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
  
  return {
    series: data.map((item, index) => ({
      ...item,
      itemStyle: {
        color: item.color || colors[index % colors.length]
      }
    }))
  }
}