<template>
  <div 
    class="device-info-popup"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`
    }"
  >
    <div class="popup-header">
      <h4>{{ device.name }}</h4>
      <el-button 
        size="small" 
        type="text" 
        @click="$emit('close')"
        class="close-btn"
      >
        ×
      </el-button>
    </div>
    
    <div class="popup-content">
      <div class="device-info">
        <div class="info-item">
          <span class="label">设备ID:</span>
          <span class="value">{{ device.id }}</span>
        </div>
        <div class="info-item">
          <span class="label">设备类型:</span>
          <span class="value">{{ getDeviceTypeText(device.type) }}</span>
        </div>
        <div class="info-item">
          <span class="label">状态:</span>
          <span class="value" :class="device.status">
            {{ getStatusText(device.status) }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">位置:</span>
          <span class="value">
            {{ device.position[0].toFixed(6) }}, {{ device.position[1].toFixed(6) }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">最后更新:</span>
          <span class="value">
            {{ formatTime(device.lastUpdate) }}
          </span>
        </div>
      </div>
      
      <div class="sensor-data" v-if="hasSensorData">
        <h5>实时数据</h5>
        <div class="data-grid">
          <div v-if="device.temperature !== undefined" class="data-item">
            <span class="label">温度:</span>
            <span class="value">{{ device.temperature }}°C</span>
          </div>
          <div v-if="device.speed !== undefined" class="data-item">
            <span class="label">速度:</span>
            <span class="value">{{ device.speed }}km/h</span>
          </div>
          <div v-if="device.pressure !== undefined" class="data-item">
            <span class="label">压力:</span>
            <span class="value">{{ device.pressure }}MPa</span>
          </div>
          <div v-if="device.humidity !== undefined" class="data-item">
            <span class="label">湿度:</span>
            <span class="value">{{ device.humidity }}%</span>
          </div>
          <div v-if="device.battery !== undefined" class="data-item">
            <span class="label">电量:</span>
            <span class="value">{{ device.battery }}%</span>
          </div>
        </div>
      </div>
      
      <div class="popup-actions">
        <el-button size="small" type="primary" @click="handleLocate">
          定位到设备
        </el-button>
        <el-button size="small" @click="handleViewDetails">
          查看详情
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DeviceData {
  id: string
  name: string
  type: string
  status: string
  position: [number, number, number]
  temperature?: number
  speed?: number
  pressure?: number
  humidity?: number
  battery?: number
  lastUpdate: string
}

interface Props {
  device: DeviceData
  position: { x: number; y: number }
}

interface Emits {
  (e: 'close'): void
  (e: 'locate', deviceId: string): void
  (e: 'view-details', deviceId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasSensorData = computed(() => {
  return props.device.temperature !== undefined || 
         props.device.speed !== undefined || 
         props.device.pressure !== undefined ||
         props.device.humidity !== undefined ||
         props.device.battery !== undefined
})

const getDeviceTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'sensor': '传感器',
    'vehicle': '移动设备',
    'camera': '摄像头',
    'other': '其他'
  }
  return typeMap[type] || type
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'online': '在线',
    'offline': '离线',
    'fault': '故障',
    'warning': '告警'
  }
  return statusMap[status] || '未知'
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const handleLocate = () => {
  emit('locate', props.device.id)
}

const handleViewDetails = () => {
  emit('view-details', props.device.id)
}
</script>

<style scoped>
.device-info-popup {
  position: absolute;
  width: 320px;
  background: rgba(0, 21, 41, 0.95);
  border: 1px solid rgba(64, 158, 255, 0.5);
  border-radius: 8px;
  color: white;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.popup-header h4 {
  margin: 0;
  color: #409eff;
}

.close-btn {
  color: white;
  font-size: 18px;
  padding: 0;
  width: 24px;
  height: 24px;
}

.popup-content {
  padding: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.info-item .value {
  color: white;
}

.info-item .value.online {
  color: #52c41a;
}

.info-item .value.offline {
  color: #bfbfbf;
}

.info-item .value.fault {
  color: #f5222d;
}

.info-item .value.warning {
  color: #faad14;
}

.sensor-data {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sensor-data h5 {
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 14px;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 13px;
}

.data-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.data-item .value {
  color: white;
  font-weight: 500;
}

.popup-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>