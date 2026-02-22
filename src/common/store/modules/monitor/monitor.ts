import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DeviceInfo,
  RealtimeData,
  AlarmInfo,
  FilterState,
  MonitorConfig,
  RealtimeMonitorState
} from '@/types/monitor'
import { monitorApi } from '@/common/request/api/monitor'

export const useMonitorStore = defineStore('monitor', () => {
  // 状态
  const devices = ref<DeviceInfo[]>([])
  const selectedDevice = ref<DeviceInfo | null>(null)
  const realtimeData = ref<RealtimeData[]>([])
  const alarms = ref<AlarmInfo[]>([])
  const filters = ref<FilterState>({
    deviceType: '',
    status: '',
    timeRange: '1h',
    quality: 0,
    searchKeyword: ''
  })
  const config = ref<MonitorConfig>({
    autoRefresh: true,
    refreshInterval: 30000, // 30秒
    showOfflineDevices: true,
    alarmSound: true,
    alarmPopup: true,
    defaultTimeRange: '1h',
    chartTheme: 'light',
    mapTheme: 'default'
  })
  const isLoading = ref(false)
  const lastUpdateTime = ref(0)
  const error = ref<string | null>(null)

  // 计算属性
  const filteredDevices = computed(() => {
    return devices.value.filter(device => {
      // 设备类型过滤
      if (filters.value.deviceType && device.type !== filters.value.deviceType) {
        return false
      }
      
      // 状态过滤
      if (filters.value.status && device.status !== filters.value.status) {
        return false
      }
      
      // 关键词搜索
      if (filters.value.searchKeyword) {
        const keyword = filters.value.searchKeyword.toLowerCase()
        return device.name.toLowerCase().includes(keyword) ||
               device.id.toLowerCase().includes(keyword)
      }
      
      return true
    })
  })

  const onlineDeviceCount = computed(() => {
    return devices.value.filter(d => d.status === 'online').length
  })

  const alarmDeviceCount = computed(() => {
    return devices.value.filter(d => d.status === 'fault').length
  })

  const dataStatistics = computed(() => {
    const totalDevices = devices.value.length
    const onlineRate = totalDevices > 0 ? (onlineDeviceCount.value / totalDevices) * 100 : 0
    const alarmRate = totalDevices > 0 ? (alarmDeviceCount.value / totalDevices) * 100 : 0
    
    return {
      totalDevices,
      onlineDeviceCount: onlineDeviceCount.value,
      alarmDeviceCount: alarmDeviceCount.value,
      onlineRate: Math.round(onlineRate),
      alarmRate: Math.round(alarmRate)
    }
  })

  const hasActiveAlarms = computed(() => {
    return alarms.value.some(alarm => alarm.status === 'active')
  })

  // Actions
  const setDevices = (newDevices: DeviceInfo[]) => {
    devices.value = newDevices
    lastUpdateTime.value = Date.now()
  }

  const setSelectedDevice = (device: DeviceInfo | null) => {
    selectedDevice.value = device
  }

  const setRealtimeData = (data: RealtimeData[]) => {
    realtimeData.value = data
  }

  const setAlarms = (newAlarms: AlarmInfo[]) => {
    alarms.value = newAlarms
  }

  const setFilters = (newFilters: Partial<FilterState>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setConfig = (newConfig: Partial<MonitorConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  // 数据操作
  const addRealtimeData = (data: RealtimeData) => {
    realtimeData.value.push(data)
    
    // 限制数据量
    if (realtimeData.value.length > 1000) {
      realtimeData.value = realtimeData.value.slice(-1000)
    }
  }

  const addAlarm = (alarm: AlarmInfo) => {
    // 防止重复添加
    if (!alarms.value.find(a => a.id === alarm.id)) {
      alarms.value.unshift(alarm)
    }
  }

  const removeAlarm = (alarmId: string) => {
    alarms.value = alarms.value.filter(alarm => alarm.id !== alarmId)
  }

  const acknowledgeAlarm = (alarmId: string) => {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      alarm.acknowledged = true
      alarm.status = 'acknowledged'
    }
  }

  const updateDeviceStatus = (deviceId: string, status: string) => {
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      device.status = status as any
      device.lastUpdateTime = Date.now()
    }
  }

  const updateDevicePosition = (deviceId: string, position: { lng: number, lat: number, alt: number }) => {
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      device.position = position
      device.lastUpdateTime = Date.now()
    }
  }

  // API调用
  const fetchAllDevices = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await monitorApi.getDeviceList()
      setDevices(result.list)
      return result.list
    } catch (err) {
      setError('获取设备列表失败')
      console.error('获取设备列表错误:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceData = async (deviceId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const [device, data, deviceAlarms] = await Promise.all([
        monitorApi.getDeviceDetail(deviceId),
        monitorApi.getRealtimeData({ deviceId, timeRange: filters.value.timeRange }),
        monitorApi.getAlarms({ deviceId, status: 'active' })
      ])
      
      // 更新选中设备
      setSelectedDevice(device)
      setRealtimeData(data.data)
      
      // 合并告警
      const existingAlarmIds = new Set(alarms.value.map(a => a.id))
      const newAlarms = deviceAlarms.list.filter(alarm => !existingAlarmIds.has(alarm.id))
      setAlarms([...alarms.value, ...newAlarms])
      
      return { device, data: data.data, alarms: deviceAlarms.list }
    } catch (err) {
      setError(`获取设备${deviceId}数据失败`)
      console.error('获取设备数据错误:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (!selectedDevice.value) {
      return
    }
    
    try {
      const data = await monitorApi.getRealtimeData({
        deviceId: selectedDevice.value.id,
        timeRange: filters.value.timeRange
      })
      setRealtimeData(data.data)
      lastUpdateTime.value = Date.now()
    } catch (err) {
      console.error('刷新数据错误:', err)
    }
  }

  const clearAllData = () => {
    devices.value = []
    selectedDevice.value = null
    realtimeData.value = []
    alarms.value = []
    lastUpdateTime.value = 0
    error.value = null
  }

  // 初始化
  const initialize = async () => {
    await fetchAllDevices()
    
    // 如果有默认设备，加载其数据
    if (devices.value.length > 0) {
      await fetchDeviceData(devices.value[0].id)
    }
  }

  return {
    // 状态
    devices,
    selectedDevice,
    realtimeData,
    alarms,
    filters,
    config,
    isLoading,
    lastUpdateTime,
    error,
    
    // 计算属性
    filteredDevices,
    onlineDeviceCount,
    alarmDeviceCount,
    dataStatistics,
    hasActiveAlarms,
    
    // Actions
    setDevices,
    setSelectedDevice,
    setRealtimeData,
    setAlarms,
    setFilters,
    setConfig,
    setLoading,
    setError,
    
    // 数据操作
    addRealtimeData,
    addAlarm,
    removeAlarm,
    acknowledgeAlarm,
    updateDeviceStatus,
    updateDevicePosition,
    
    // API操作
    fetchAllDevices,
    fetchDeviceData,
    refreshData,
    clearAllData,
    initialize
  }
})