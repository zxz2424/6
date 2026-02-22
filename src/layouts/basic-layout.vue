<template>
  <div class="monitor-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 这是一个简单的全屏布局，没有任何侧边栏或顶部导航
</script>

<style scoped>
.monitor-layout {
  width: 100%;
  height: 100vh;
}
</style>