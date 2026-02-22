<template>
  <div v-if="loading" class="worker-loading">
    <el-progress :percentage="progress" :show-text="false" />
    <span>正在加载编辑器组件...</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const progress = ref(0)

onMounted(async () => {
  // 模拟加载进度
  const interval = setInterval(() => {
    progress.value += 10
    if (progress.value >= 90) {
      clearInterval(interval)
    }
  }, 100)

  try {
    const monaco = await import('monaco-editor')
    
    // 等待 Monaco Editor 初始化
    await new Promise(resolve => setTimeout(resolve, 100))
    
    clearInterval(interval)
    progress.value = 100
    
    setTimeout(() => {
      loading.value = false
    }, 300)
  } catch (error) {
    console.error('Failed to load Monaco Editor:', error)
    loading.value = false
  }
})
</script>

<style scoped>
.worker-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.worker-loading span {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}
</style>