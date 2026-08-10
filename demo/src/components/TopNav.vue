<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'

const menus = [
  { key: 'form', label: '表单设置' },
  { key: 'data', label: '应用端数据' }
]
const active = ref('form')
</script>

<template>
  <header class="top-nav">
    <div class="nav-left">
      <button type="button" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        <span>数据采集系统</span>
      </button>

      <nav class="nav-menu">
        <button
          v-for="m in menus"
          :key="m.key"
          type="button"
          class="nav-item"
          :class="{ 'is-active': active === m.key }"
          @click="active = m.key"
        >
          {{ m.label }}
        </button>
      </nav>
    </div>

    <div class="nav-right">
      <el-avatar :size="28" class="nav-avatar">张</el-avatar>
      <span class="nav-user">张三</span>
    </div>
  </header>
</template>

<style scoped>
.top-nav {
  height: var(--h-nav);
  flex-shrink: 0;
  background: var(--c-nav);
  color: var(--c-nav-text);
  border-bottom: 1px solid var(--c-line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-2xl);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: var(--sp-2xl);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  height: 32px;
  padding: 0 var(--sp-sm);
  font-family: var(--ff-display);
  font-size: var(--fs-16);
  font-weight: 700;
  color: var(--c-nav-text);
  background: transparent;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  letter-spacing: -0.01em;
  transition: background 0.15s var(--ease);
}

.back-btn:hover {
  background: var(--c-nav-hover);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
}

.nav-item {
  height: 32px;
  padding: 0 var(--sp-lg);
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s var(--ease);
}

.nav-item:hover {
  color: var(--c-text-strong);
  background: var(--c-nav-hover);
}

.nav-item.is-active {
  color: var(--c-primary);
  background: var(--c-primary-bg);
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.nav-avatar {
  background: var(--c-primary) !important;
  color: #fff;
  font-family: var(--ff-display);
  font-weight: 600;
  font-size: var(--fs-12);
}

.nav-user {
  font-size: var(--fs-14);
  color: var(--c-text-strong);
  font-weight: 500;
}
</style>