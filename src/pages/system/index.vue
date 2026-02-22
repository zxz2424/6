<template>
  <div class="system-layout">
    <div class="system-sidebar">
      <div class="sidebar-header">
        <el-button 
          type="primary" 
          link 
          @click="handleBack"
          class="back-button"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <h3 class="sidebar-title">系统管理</h3>
      </div>
      
      <el-menu
        :default-active="$route.path"
        router
        class="system-menu"
      >
        <el-menu-item index="/system/user">
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/system/role">
          <span>角色管理</span>
        </el-menu-item>
        <el-menu-item index="/system/permission">
          <span>权限管理</span>
        </el-menu-item>
        <el-menu-item index="/system/config">
          <span>系统配置</span>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="system-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

// 返回首页
const handleBack = () => {
  router.push('/home')
}
</script>

<style scoped>
.system-layout {
  display: flex;
  min-height: 100vh;
}

.system-sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #e6e6e6;
}

.system-menu {
  border: none;
}

.system-content {
  flex: 1;
  padding: 20px;
  background: #f5f5f5;
  overflow: auto;
}

/* 侧边栏头部样式 */
.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e6e6e6;
}

.sidebar-title {
  margin: 10px 0 0 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.back-button {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: flex-start;
  padding: 8px 0;
  color: #409eff;
}

.back-button:hover {
  color: #66b1ff;
  background-color: #f5f7fa;
}
</style>