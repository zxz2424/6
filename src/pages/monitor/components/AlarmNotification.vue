<template>
  <div class="alarm-notification">
    <div class="notification-header">
      <el-icon class="bell-icon"><Bell /></el-icon>
      <span class="title">告警通知</span>
      <el-badge :value="alarms.length" class="badge" />
    </div>
    
    <div class="alarm-list">
      <div
        v-for="alarm in alarms.slice(0, 3)"
        :key="alarm.id"
        :class="['alarm-item', alarm.level]"
        @click="handleAlarmClick(alarm)"
      >
        <div class="alarm-content">
          <div class="alarm-title">
            <strong>{{ alarm.deviceName }}</strong>
            <span class="alarm-type">{{ alarm.alarmType }}</span>
          </div>
          <div class="alarm-message">{{ alarm.message }}</div>
          <div class="alarm-time">{{ formatTime(alarm.timestamp) }}</div>
        </div>
        <div class="alarm-actions">
          <el-button size="small" type="text" @click.stop="handleAcknowledge(alarm.id)">
            确认
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-if="alarms.length > 3" class="view-all">
      <el-button type="text" @click="handleViewAll">查看全部告警</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue'
import type { AlarmInfo } from '@/types/monitor'

const props = defineProps<{
  alarms: AlarmInfo[]
}>()

const emit = defineEmits<{
  'acknowledge': [alarmId: string]
}>()

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return `${Math.floor(diff / 86400000)}天前`
  }
}

const handleAlarmClick = (alarm: AlarmInfo) => {
  // 处理告警点击，例如定位到设备
  console.log('点击告警:', alarm)
}

const handleAcknowledge = (alarmId: string) => {
  emit('acknowledge', alarmId)
}

const handleViewAll = () => {
  // 跳转到告警管理页面
  console.log('查看全部告警')
}
</script>

<style scoped>
.alarm-notification {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.notification-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff7e6;
  border-bottom: 1px solid #ffe7ba;
}

.bell-icon {
  font-size: 18px;
  color: #fa8c16;
  margin-right: 8px;
}

.title {
  font-weight: bold;
  flex: 1;
}

.badge {
  margin-left: 8px;
}

.alarm-list {
  max-height: 300px;
  overflow-y: auto;
}

.alarm-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.alarm-item:hover {
  background: #f5f5f5;
}

.alarm-item.critical,
.alarm-item.error {
  border-left: 4px solid #f5222d;
}

.alarm-item.warning {
  border-left: 4px solid #faad14;
}

.alarm-item.info {
  border-left: 4px solid #1890ff;
}

.alarm-content {
  flex: 1;
}

.alarm-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.alarm-type {
  font-size: 12px;
  color: #666;
}

.alarm-message {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.alarm-time {
  font-size: 12px;
  color: #999;
}

.alarm-actions {
  margin-top: 8px;
}

.view-all {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}
</style>