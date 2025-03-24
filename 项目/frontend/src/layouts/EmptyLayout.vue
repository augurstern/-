<template>
  <div class="empty-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 空布局组件，不包含任何导航栏、侧边栏等元素
// 用于登录页等特殊页面
</script>

<style scoped>
.empty-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}
</style> 