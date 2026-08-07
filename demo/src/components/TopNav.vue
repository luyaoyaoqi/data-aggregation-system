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
        <span>表单中台</span>
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
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-xl);
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
  padding: 0 var(--sp-sm) 0 var(--sp-xs);
  font-family: inherit;
  font-size: var(--fs-16);
  font-weight: 600;
  color: #fff;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s ease;
}

.back-btn:hover {
  background: var(--c-nav-hover);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.nav-item {
  height: 32px;
  padding: 0 var(--sp-lg);
  font-family: inherit;
  font-size: var(--fs-14);
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-item:hover {
  color: #fff;
  background: var(--c-nav-hover);
}

.nav-item.is-active {
  color: #fff;
  background: var(--c-primary);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.nav-avatar {
  background: var(--c-primary);
  font-size: var(--fs-12);
}

.nav-user {
  font-size: var(--fs-14);
  color: rgba(255, 255, 255, 0.9);
}
</style>
