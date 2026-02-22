<template>
  <div class="home-page">
    <h1>三维可视化平台</h1>
    <p>项目开发中</p>
    
    <div class="module-list">
      <div 
        class="module-item" 
        v-for="(module, index) in modules" 
        :key="index"
        @click="navigateTo(module.path)"
        :class="{ 'disabled': !module.available }"
      >
        <h3>{{ module.name }}</h3>
        <div 
          class="module-status"
          :class="{
            'status-developing': module.status === '开发中',
            'status-developed': module.status === '已开发',
            'status-pending': module.status === '待开发'
          }"
        >
          {{ module.status }}
        </div>
        <div v-if="!module.available" class="no-permission">无访问权限</div>
      </div>
    </div>
    
    <div class="development-text">平台持续开发中</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/common/store/modules/user/user'
import { computed, onMounted } from 'vue'

const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  if (import.meta.env.DEV && !userStore.token) {
    if (typeof userStore.autoLoginForDev === 'function') {
      userStore.autoLoginForDev()
    }
  }
})

// 检查用户是否有系统管理权限
const hasSystemPermission = computed(() => {
  if (import.meta.env.DEV) {
    return true
  }
  return userStore.hasPermission(['system:user:query', 'system:role:query', 'system:permission:query'])
})

// 检查用户是否有脚本编辑器权限
const hasScriptEditorPermission = computed(() => {
  if (import.meta.env.DEV) {
    return true
  }
  return userStore.hasPermission(['business:script:editor'])
})

// 检查用户是否有统计权限
const hasStatisticsPermission = computed(() => {
  if (import.meta.env.DEV) {
    return true
  }
  return userStore.hasPermission(['statistics:view'])
})

const modules = computed(() => [
  { 
    name: '三维场景', 
    status: '开发中', 
    path: '/3d',
    available: true
  },
  { 
    name: '实时监控', 
    status: '已开发',
    path: '/monitor',
    available: true
  },
  { 
    name: '告警管理', 
    status: '已开发', 
    path: '/alarm',
    available: true
  },
  { 
    name: '系统管理', 
    status: '已开发', 
    path: '/system',
    available: hasSystemPermission.value
  },
  { 
    name: '脚本编辑器', 
    status: '已开发', 
    path: '/business',
    available: hasScriptEditorPermission.value
  },
  { 
    name: '日志管理', 
    status: '已开发', 
    path: '/log',
    available: true
  },
  { 
    name: '统计分析', 
    status: '已开发',
    path: '/statistics',
    available: hasStatisticsPermission.value
  },

])

const navigateTo = (path: string) => {
  const module = modules.value.find(m => m.path === path)
  if (module && module.available) {
    router.push(path)
  }
}
</script>

<style scoped>
.home-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  padding: 20px;
  text-align: center;
}

.module-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  max-width: 800px;
}

.module-item {
  background: white;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 200px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.module-item:hover:not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.module-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f0f0f0;
}

.module-status {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
  font-weight: 500;
}

.status-developing {
  color: #e6a23c; /* 橙色 - 开发中 */
}

.status-developed {
  color: #67c23a; /* 绿色 - 已开发 */
}

.status-pending {
  color: #909399; /* 灰色 - 待开发 */
}

.no-permission {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}

.development-text {
  font-size: 24px;
  color: #999;
  font-weight: bold;
  margin-top: 30px;
}
</style>