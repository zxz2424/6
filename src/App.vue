<template>
  <!-- 全局连接状态提示 -->
  <div v-if="showWsStatus" class="global-ws-status" :class="wsStatusClass">
    <el-icon v-if="wsStatus === 'connecting'"><Loading /></el-icon>
    <el-icon v-if="wsStatus === 'connected'"><SuccessFilled /></el-icon>
    <el-icon v-if="wsStatus === 'disconnected'"><WarningFilled /></el-icon>
    <el-icon v-if="wsStatus === 'reconnecting'"><Refresh /></el-icon>
    <span class="status-text">{{ wsStatusText }}</span>
    <el-button v-if="wsStatus === 'disconnected'" type="text" size="small" @click="reconnectWebSocket">
      重连
    </el-button>
  </div>
  
  <!-- 主应用内容 -->
  <router-view />
  
  <!-- 全局任务通知 -->
  <el-dialog
    v-model="showTaskNotification"
    :title="notificationTitle"
    width="400px"
    center
    :show-close="false"
    :close-on-click-modal="false"
  >
    <div class="task-notification">
      <div class="notification-content">
        {{ notificationMessage }}
      </div>
      <div v-if="notificationTaskId" class="notification-task">
        任务ID: {{ notificationTaskId }}
      </div>
    </div>
    <template #footer>
      <el-button @click="showTaskNotification = false">关闭</el-button>
      <el-button 
        v-if="notificationTaskId" 
        type="primary" 
        @click="viewTask(notificationTaskId)"
      >
        查看任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Loading,
  SuccessFilled,
  WarningFilled,
  Refresh
} from '@element-plus/icons-vue';
import { webSocketClient } from '@/common/request/websocket';
import { useTaskStore } from '@/common/store/modules/task';

// WebSocket 状态管理
const wsStatus = ref(webSocketClient.getStatus());
const showWsStatus = ref(false);
const router = useRouter();
const taskStore = useTaskStore();

// 任务通知相关
const showTaskNotification = ref(false);
const notificationTitle = ref('');
const notificationMessage = ref('');
const notificationTaskId = ref<string>('');

// 监听 WebSocket 状态变化
const wsStatusText = computed(() => {
  switch (wsStatus.value) {
    case 'connecting': return '正在连接服务器...';
    case 'connected': return '已连接';
    case 'disconnected': return '连接断开';
    case 'reconnecting': return '正在重连...';
    default: return wsStatus.value;
  }
});

const wsStatusClass = computed(() => {
  switch (wsStatus.value) {
    case 'connected': return 'connected';
    case 'disconnected': return 'disconnected';
    case 'reconnecting': return 'reconnecting';
    default: return 'connecting';
  }
});

// 监听状态变化
watch(
  () => webSocketClient.getStatus(),
  (newStatus) => {
    wsStatus.value = newStatus;
    
    // 显示/隐藏状态提示
    if (newStatus === 'reconnecting' || newStatus === 'disconnected') {
      showWsStatus.value = true;
    } else if (newStatus === 'connected') {
      // 连接成功后延迟隐藏状态提示
      setTimeout(() => {
        showWsStatus.value = false;
      }, 2000);
    }
    
    // 显示通知
    if (newStatus === 'connected') {
      showNotification('连接成功', '已连接到实时服务');
    } else if (newStatus === 'disconnected') {
      showNotification('连接断开', '实时服务已断开，正在尝试重连...');
    }
  }
);

// 订阅任务完成通知
const setupTaskNotifications = () => {
  // 订阅所有任务状态变化
  webSocketClient.subscribe('task:*', (message) => {
    const { type, data, taskId } = message.data;
    
    if (type === 'completed') {
      showNotification('任务完成', `任务 ${taskId} 执行完成`, taskId);
      taskStore.updateTaskStatus(taskId, 'completed');
    } else if (type === 'failed') {
      showNotification('任务失败', `任务 ${taskId} 执行失败: ${data.error || '未知错误'}`, taskId);
      taskStore.updateTaskStatus(taskId, 'failed');
    } else if (type === 'cancelled') {
      showNotification('任务取消', `任务 ${taskId} 已被取消`, taskId);
      taskStore.updateTaskStatus(taskId, 'cancelled');
    }
  });
};

// 显示通知
const showNotification = (title: string, message: string, taskId?: string) => {
  notificationTitle.value = title;
  notificationMessage.value = message;
  notificationTaskId.value = taskId || '';
  showTaskNotification.value = true;
  
  // 自动关闭通知
  setTimeout(() => {
    showTaskNotification.value = false;
  }, 5000);
};

// 查看任务详情
const viewTask = (taskId: string) => {
  router.push(`/tasks/${taskId}`);
  showTaskNotification.value = false;
};

// 手动重连 WebSocket
const reconnectWebSocket = () => {
  webSocketClient.connect();
};

// 组件生命周期
onMounted(() => {
  // 初始化 WebSocket 连接
  setTimeout(() => {
    webSocketClient.connect();
  }, 1000); // 延迟连接，确保应用已初始化
  
  // 设置任务通知
  setupTaskNotifications();
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  // 取消所有订阅
  webSocketClient.clearAllSubscriptions();
});

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 页面重新可见时，检查并重连 WebSocket
    if (wsStatus.value === 'disconnected') {
      webSocketClient.connect();
    }
  } else {
    // 页面隐藏时，可以暂停部分功能
    // 这里可以根据需要添加逻辑
  }
};

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 错误:', event.reason);
  
  // 如果是网络错误，尝试重连 WebSocket
  if (event.reason?.message?.includes('Network') || 
      event.reason?.message?.includes('网络')) {
    if (wsStatus.value !== 'connected') {
      webSocketClient.connect();
    }
  }
});
</script>

<style scoped>
.global-ws-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.global-ws-status.connecting {
  background-color: #e6f7ff;
  color: #1890ff;
  border-bottom: 1px solid #91d5ff;
}

.global-ws-status.connected {
  background-color: #f6ffed;
  color: #52c41a;
  border-bottom: 1px solid #b7eb8f;
}

.global-ws-status.disconnected {
  background-color: #fff2f0;
  color: #ff4d4f;
  border-bottom: 1px solid #ffccc7;
}

.global-ws-status.reconnecting {
  background-color: #fff7e6;
  color: #fa8c16;
  border-bottom: 1px solid #ffd591;
}

.status-text {
  margin: 0 8px;
}

.task-notification {
  text-align: center;
  padding: 16px 0;
}

.notification-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.notification-task {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}
</style>