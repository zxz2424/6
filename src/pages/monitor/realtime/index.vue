<template>
  <div class="monitor-realtime-page" @mousemove="handleMouseMove">
    <!-- 3D场景区域 -->
    <div class="scene-container">
      <!-- 3D场景容器 -->
      <div id="cesium-container" class="cesium-container"></div>
      
      <!-- 地图控制面板（右上角） -->
      <MapControlPanel 
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @reset-view="handleResetView"
        @toggle-layer="handleToggleLayer"
      />
      
      <!-- 告警通知 -->
      <AlarmNotification 
        v-if="alarmList.length > 0"
        :alarms="alarmList"
        @acknowledge="handleAcknowledgeAlarm"
      />
      
      <!-- 设备信息悬浮框 -->
      <DeviceInfoPopup 
        v-if="hoveredDevice"
        :device="hoveredDevice"
        :position="popupPosition"
        @close="hoveredDevice = null"
        @locate="handlePopupLocate"
        @view-details="handlePopupViewDetails"
      />
      
      <!-- 设备控制面板（移到左上角） -->
      <div class="device-control-panel">
        <div class="panel-header">
          <h3>📊 设备控制</h3>
          <div class="header-actions">
            <el-button 
              size="small" 
              type="text" 
              @click="togglePanel"
            >
              {{ isPanelCollapsed ? '▶' : '◀' }}
            </el-button>
          </div>
        </div>
        
        <el-collapse-transition>
          <div v-show="!isPanelCollapsed" class="panel-content">
            <div class="control-section">
              <h4><el-icon><PieChart /></el-icon> 设备状态</h4>
              <div class="status-legend">
                <div class="legend-item">
                  <span class="status-dot online"></span>
                  <span>在线</span>
                </div>
                <div class="legend-item">
                  <span class="status-dot offline"></span>
                  <span>离线</span>
                </div>
                <div class="legend-item">
                  <span class="status-dot fault"></span>
                  <span>故障</span>
                </div>
                <div class="legend-item">
                  <span class="status-dot warning"></span>
                  <span>告警</span>
                </div>
              </div>
            </div>
            
            <div class="control-section">
              <h4><el-icon><Setting /></el-icon> 设备列表</h4>
              <div class="device-list">
                <div 
                  v-for="device in deviceList" 
                  :key="device.id"
                  class="device-item"
                  :class="{ 'selected': selectedDeviceId === device.id }"
                  @click="handleDeviceSelect(device)"
                  @mouseenter="handleDeviceHover(device)"
                  @mouseleave="handleDeviceHover(null)"
                >
                  <div class="device-info">
                    <div class="device-name">
                      <el-icon v-if="device.type === 'sensor'"><DataLine /></el-icon>
                      <el-icon v-if="device.type === 'vehicle'"><VideoCamera /></el-icon>
                      <el-icon v-if="device.type === 'camera'"><VideoCamera /></el-icon>
                      {{ device.name }}
                    </div>
                    <div class="device-status" :class="device.status">
                      {{ getStatusText(device.status) }}
                    </div>
                  </div>
                  <div class="device-data">
                    <div v-if="device.temperature !== undefined" class="data-item">
                      <el-icon><Sunny /></el-icon>
                      <span class="value">{{ device.temperature }}°C</span>
                    </div>
                    <div v-if="device.speed !== undefined" class="data-item">
                      <el-icon><Position /></el-icon>
                      <span class="value">{{ device.speed }}km/h</span>
                    </div>
                    <div v-if="device.pressure !== undefined" class="data-item">
                      <el-icon><Flag /></el-icon>
                      <span class="value">{{ device.pressure }}MPa</span>
                    </div>
                    <div v-if="device.battery !== undefined" class="data-item">
                      <el-icon><Warning /></el-icon>
                      <span class="value">{{ device.battery }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="control-section">
              <h4><el-icon><TrendCharts /></el-icon> 轨迹控制</h4>
              <div class="track-controls">
                <el-switch
                  v-model="showTrajectories"
                  active-text="显示轨迹"
                  inactive-text="隐藏轨迹"
                  size="small"
                />
                <el-button 
                  size="small" 
                  type="danger"
                  plain
                  @click="clearAllTrajectories"
                >
                  清空轨迹
                </el-button>
              </div>
            </div>
            
            <div class="control-section">
              <h4><el-icon><Operation /></el-icon> 快捷操作</h4>
              <div class="quick-actions">
                <el-button 
                  size="small" 
                  @click="refreshDeviceData"
                  :loading="refreshing"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-button>
                <el-button 
                  size="small" 
                  type="info"
                  plain
                  @click="exportDeviceData"
                >
                  <el-icon><Download /></el-icon>
                  导出数据
                </el-button>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>
      
      <!-- 系统状态栏（右下角） -->
      <div class="status-bar">
        <div class="status-item">
          <span class="label">在线设备:</span>
          <span class="value online">{{ onlineCount }}</span>
        </div>
        <div class="status-item">
          <span class="label">离线设备:</span>
          <span class="value offline">{{ offlineCount }}</span>
        </div>
        <div class="status-item">
          <span class="label">告警数量:</span>
          <span class="value warning">{{ alarmList.length }}</span>
        </div>
        <div class="status-item time">
          <span class="label">系统时间:</span>
          <span class="value">{{ currentTime }}</span>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

// 组件
import AlarmNotification from '../components/AlarmNotification.vue'
import MapControlPanel from '../components/MapControlPanel.vue'
import DeviceInfoPopup from '../components/DeviceInfoPopup.vue'

// Hooks
import { useWebSocket } from '../hooks/useWebSocket'
import { useDeviceMonitor } from '../hooks/useDeviceMonitor'

// API
import { monitorApi } from '@/common/request/api/monitor'
import type { 
  DeviceInfo, 
  AlarmInfo
} from '@/types/monitor'

// 设备数据接口
interface DeviceData extends DeviceInfo {
  id: string
  name: string
  type: 'sensor' | 'vehicle' | 'camera' | 'other'
  status: 'online' | 'offline' | 'fault' | 'warning'
  position: [number, number, number] // [lng, lat, alt]
  temperature?: number
  speed?: number
  pressure?: number
  humidity?: number
  battery?: number
  lastUpdate: string
}

// 状态管理
const selectedDeviceId = ref<string | null>(null)
const hoveredDevice = ref<DeviceData | null>(null)
const popupPosition = reactive({ x: 0, y: 0 })
const alarmList = ref<AlarmInfo[]>([])
const loading = ref(false)
const isPanelCollapsed = ref(false)
const showTrajectories = ref(true)
const refreshing = ref(false)
const currentTime = ref('')

// 鼠标位置
const mousePosition = reactive({ x: 0, y: 0 })

// 设备列表（模拟数据）
const deviceList = ref<DeviceData[]>([
  {
    id: 'device-001',
    name: '温度传感器01',
    type: 'sensor',
    status: 'online',
    position: [121.4737, 31.2304, 50],
    temperature: 25.5,
    humidity: 65,
    battery: 85,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'device-002',
    name: '移动设备01',
    type: 'vehicle',
    status: 'online',
    position: [121.4750, 31.2290, 100],
    speed: 60,
    battery: 78,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'device-003',
    name: '压力传感器01',
    type: 'sensor',
    status: 'fault',
    position: [121.4720, 31.2315, 30],
    pressure: 1.2,
    battery: 45,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'device-004',
    name: '监控摄像头01',
    type: 'camera',
    status: 'warning',
    position: [121.4745, 31.2280, 150],
    battery: 92,
    lastUpdate: new Date().toISOString()
  }
])

// 计算属性
const onlineCount = computed(() => {
  return deviceList.value.filter(device => device.status === 'online').length
})

const offlineCount = computed(() => {
  return deviceList.value.filter(device => device.status === 'offline').length
})

// 初始化Hooks
const { initCesiumScene, updateDevicePosition, updateDeviceStatus, highlightDevice, 
        addDeviceMarker, addTrackLine, updateTrackLine, clearAllMarkers, exportDeviceData } = useDeviceMonitor()
const { connectWebSocket, subscribeToDevice, unsubscribeFromDevice } = useWebSocket()

// 初始化
onMounted(async () => {
  loading.value = true
  
  // 更新系统时间
  updateCurrentTime()
  setInterval(updateCurrentTime, 1000)
  
  try {
    // 1. 初始化3D场景
    const initSuccess = await initCesiumScene('cesium-container')
    if (!initSuccess) {
      throw new Error('3D场景初始化失败')
    }
    
    // 2. 连接WebSocket
    await connectWebSocket()
    
    // 3. 加载告警信息
    await fetchAlarms()
    
    // 4. 在3D场景中添加设备点位
    addDevicesToScene()
    
    // 5. 开始模拟实时数据更新（开发环境）
    if (import.meta.env.DEV) {
      startMockDataUpdates()
    }
    
  } catch (error) {
    ElMessage.error('初始化监控页面失败')
    console.error('初始化错误:', error)
  } finally {
    loading.value = false
  }
})

// 鼠标移动事件处理
const handleMouseMove = (event: MouseEvent) => {
  mousePosition.x = event.clientX
  mousePosition.y = event.clientY
}

// 设备悬停处理（设备列表项）
const handleDeviceHover = (device: DeviceData | null) => {
  hoveredDevice.value = device
  
  if (device && hoveredDevice.value) {
    updatePopupPosition()
  }
}

// 更新悬浮框位置（智能判断左右显示）
const updatePopupPosition = () => {
  const popupWidth = 320 // 悬浮框宽度
  const popupHeight = 300 // 悬浮框高度（预估）
  const offset = 20 // 距离鼠标的偏移量
  
  // 判断鼠标在屏幕的哪个区域
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  let x = mousePosition.x + offset
  let y = mousePosition.y + offset
  
  // 如果鼠标在左侧区域（左侧1/3屏幕），悬浮框显示在右侧
  if (mousePosition.x < screenWidth / 3) {
    x = mousePosition.x + offset
  } 
  // 如果鼠标在右侧区域（右侧1/3屏幕），悬浮框显示在左侧
  else if (mousePosition.x > (screenWidth * 2 / 3)) {
    x = mousePosition.x - popupWidth - offset
  }
  // 中间区域，根据设备控制面板位置判断
  else {
    // 如果设备控制面板已展开，悬浮框显示在右侧
    if (!isPanelCollapsed.value && mousePosition.x < 320) {
      x = mousePosition.x + offset
    } else {
      x = mousePosition.x - popupWidth - offset
    }
  }
  
  // 垂直方向：如果靠近底部，向上调整
  if (y + popupHeight > screenHeight) {
    y = mousePosition.y - popupHeight - offset
  }
  
  // 确保不超出屏幕边界
  x = Math.max(10, Math.min(x, screenWidth - popupWidth - 10))
  y = Math.max(10, Math.min(y, screenHeight - popupHeight - 10))
  
  popupPosition.x = x
  popupPosition.y = y
}

// 悬浮框定位事件
const handlePopupLocate = (deviceId: string) => {
  selectedDeviceId.value = deviceId
  highlightDevice(deviceId)
  console.log(`定位到设备: ${deviceId}`)
}

// 悬浮框查看详情事件
const handlePopupViewDetails = (deviceId: string) => {
  const device = deviceList.value.find(d => d.id === deviceId)
  if (device) {
    ElMessageBox.alert(
      `设备详情：${device.name}<br/>类型：${device.type}<br/>状态：${getStatusText(device.status)}`,
      '设备详情',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      }
    )
  }
}

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

// 添加设备到3D场景
const addDevicesToScene = () => {
  deviceList.value.forEach(device => {
    // 添加设备点位
    addDeviceMarker({
      id: device.id,
      name: device.name,
      position: device.position,
      status: device.status
    })
    
    // 订阅设备实时更新
    subscribeToDevice(device.id, (data) => {
      handleDeviceUpdate(device.id, data)
    })
  })
}

// 设备数据更新处理
const handleDeviceUpdate = (deviceId: string, data: any) => {
  // 更新设备数据
  const deviceIndex = deviceList.value.findIndex(d => d.id === deviceId)
  if (deviceIndex !== -1) {
    const device = deviceList.value[deviceIndex]
    
    // 更新位置
    if (data.position) {
      device.position = data.position
      updateDevicePosition(deviceId, data.position)
      
      // 更新轨迹线
      if (showTrajectories.value) {
        updateTrackLine(deviceId, [data.position])
      }
    }
    
    // 更新状态
    if (data.status) {
      device.status = data.status
      updateDeviceStatus(deviceId, data.status)
    }
    
    // 更新监控数据
    if (data.sensorData) {
      Object.assign(device, data.sensorData)
    }
    
    device.lastUpdate = new Date().toISOString()
  }
  
  // 检查告警
  if (data.alarm) {
    handleNewAlarm(data.alarm)
  }
}

// 新告警处理
const handleNewAlarm = (alarm: AlarmInfo) => {
  alarmList.value = [alarm, ...alarmList.value]
  
  // 显示告警通知
  ElMessageBox.alert(
    `设备 ${alarm.deviceName} 触发告警: ${alarm.message}`,
    '告警通知',
    {
      confirmButtonText: '确定',
      type: 'warning',
      callback: () => {
        handleAcknowledgeAlarm(alarm.id)
      }
    }
  )
}

// 确认告警
const handleAcknowledgeAlarm = async (alarmId: string) => {
  try {
    await monitorApi.acknowledgeAlarm(alarmId)
    alarmList.value = alarmList.value.filter(alarm => alarm.id !== alarmId)
    ElMessage.success('告警已确认')
  } catch (error) {
    ElMessage.error('确认告警失败')
  }
}

// 设备选择处理
const handleDeviceSelect = (device: DeviceData) => {
  selectedDeviceId.value = device.id
  highlightDevice(device.id)
  
  // 定位到设备
  // TODO: 调用Cesium相机定位到设备位置
  console.log(`定位到设备: ${device.name}`)
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'online': '在线',
    'offline': '离线',
    'fault': '故障',
    'warning': '告警'
  }
  return statusMap[status] || '未知'
}

// 加载告警信息
const fetchAlarms = async () => {
  try {
    const alarms = await monitorApi.getAlarms({ status: 'active' })
    alarmList.value = alarms
  } catch (error) {
    console.error('加载告警信息失败:', error)
  }
}

// 刷新设备数据
const refreshDeviceData = async () => {
  refreshing.value = true
  try {
    // TODO: 重新获取设备数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  } finally {
    refreshing.value = false
  }
}

// 3D场景控制
const handleZoomIn = () => {
  console.log('放大视图')
}

const handleZoomOut = () => {
  console.log('缩小视图')
}

const handleResetView = () => {
  console.log('重置视图')
}

const handleToggleLayer = (layer: string, visible: boolean) => {
  console.log(`切换图层 ${layer}: ${visible ? '显示' : '隐藏'}`)
}

// 控制面板操作
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

const clearAllTrajectories = () => {
  // TODO: 调用useDeviceMonitor清除所有轨迹
  clearAllMarkers()
  console.log('清空所有轨迹')
  ElMessage.success('轨迹已清空')
}

// 模拟实时数据更新（开发环境）
const startMockDataUpdates = () => {
  if (!import.meta.env.DEV) return
  
  setInterval(() => {
    deviceList.value.forEach(device => {
      // 模拟位置变化（仅移动设备）
      if (device.type === 'vehicle' && device.status === 'online') {
        const newLng = device.position[0] + (Math.random() - 0.5) * 0.0005
        const newLat = device.position[1] + (Math.random() - 0.5) * 0.0005
        
        const newPosition: [number, number, number] = [newLng, newLat, device.position[2]]
        
        // 发送模拟更新
        handleDeviceUpdate(device.id, {
          position: newPosition,
          sensorData: {
            speed: Math.floor(Math.random() * 100),
            battery: Math.max(0, (device.battery || 100) - 0.1)
          }
        })
      }
      
      // 模拟传感器数据变化
      if (device.type === 'sensor' && device.status === 'online') {
        handleDeviceUpdate(device.id, {
          sensorData: {
            temperature: device.temperature ? device.temperature + (Math.random() - 0.5) : undefined,
            pressure: device.pressure ? device.pressure + (Math.random() - 0.5) * 0.1 : undefined,
            humidity: device.humidity ? device.humidity + (Math.random() - 0.5) * 2 : undefined,
            battery: Math.max(0, (device.battery || 100) - 0.05)
          }
        })
      }
    })
  }, 3000) // 每3秒更新一次
}

// 组件卸载时清理
onUnmounted(() => {
  clearAllMarkers()
  deviceList.value.forEach(device => {
    unsubscribeFromDevice(device.id)
  })
})
</script>

<style scoped>
/* 样式部分保持不变，与上面相同 */
.monitor-realtime-page {
  width: 100%;
  height: 100vh;
  background: #001529;
  position: relative;
  overflow: hidden;
}

.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.cesium-container {
  width: 100%;
  height: 100%;
}

/* 设备控制面板 - 移到左上角 */
.device-control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 300px;
  background: rgba(0, 21, 41, 0.95);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  color: white;
  z-index: 99;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.panel-content {
  padding: 16px;
}

.control-section {
  margin-bottom: 20px;
}

.control-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 状态图例 */
.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
}

.status-dot.offline {
  background: #bfbfbf;
}

.status-dot.fault {
  background: #f5222d;
}

.status-dot.warning {
  background: #faad14;
}

/* 设备列表 */
.device-list {
  max-height: 300px;
  overflow-y: auto;
}

.device-item {
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.device-item:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.3);
}

.device-item.selected {
  background: rgba(64, 158, 255, 0.2);
  border-color: #409eff;
}

.device-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-name {
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.device-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
}

.device-status.online {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
}

.device-status.offline {
  color: #bfbfbf;
  background: rgba(191, 191, 191, 0.1);
}

.device-status.fault {
  color: #f5222d;
  background: rgba(245, 34, 45, 0.1);
}

.device-status.warning {
  color: #faad14;
  background: rgba(250, 173, 20, 0.1);
}

.device-data {
  font-size: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.data-item .value {
  color: white;
  font-weight: 500;
}

/* 轨迹控制 */
.track-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 10px;
}

/* 系统状态栏（右下角） */
.status-bar {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 21, 41, 0.9);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 20px;
  z-index: 98;
  backdrop-filter: blur(5px);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.status-item .value {
  font-size: 14px;
  font-weight: 600;
}

.status-item .value.online {
  color: #52c41a;
}

.status-item .value.offline {
  color: #bfbfbf;
}

.status-item .value.warning {
  color: #faad14;
}

.status-item.time {
  min-width: 120px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 9999;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .device-control-panel {
    width: 280px;
    left: 10px;
    top: 10px;
  }
  
  .status-bar {
    flex-wrap: wrap;
    width: auto;
    max-width: calc(100% - 40px);
    bottom: 10px;
    right: 10px;
  }
}
</style>