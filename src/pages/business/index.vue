<!-- 3d-visualization-platform\src\pages\business\index.vue -->
<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
    <el-card style="text-align: center; padding: 20px;">
      <el-icon size="48" style="margin-bottom: 20px;"><Loading /></el-icon>
      <p>正在跳转到脚本编辑器...</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'

const router = useRouter()

onMounted(() => {
  // 自动重定向到脚本编辑器页面
  setTimeout(() => {
    router.replace('/business')
  }, 100)
})
</script>