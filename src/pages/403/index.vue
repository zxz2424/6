<template>
  <div class="forbidden-container">
    <el-result
      icon="warning"
      title="403"
      sub-title="抱歉，您没有访问此页面的权限"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/home')">
          返回首页
        </el-button>
        <el-button @click="$router.go(-1)">返回上页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.forbidden-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}
</style>