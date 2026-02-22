<template>
  <div class="basic-layout">
    <header class="layout-header">
      <slot name="header">
        <h1>涓夌淮鍙鍖栧钩鍙?/h1>
      </slot>
    </header>
    <main class="layout-main">
      <slot></slot>
    </main>
    <footer class="layout-footer">
      <slot name="footer">
        <p>漏 2024 涓夌淮鍙鍖栧钩鍙?/p>
      </slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 鍩虹甯冨眬缁勪欢
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #409eff;
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
}

.layout-main {
  flex: 1;
  padding: 20px;
}

.layout-footer {
  background: #f5f7fa;
  padding: 10px 20px;
  text-align: center;
  color: #909399;
}
</style>
