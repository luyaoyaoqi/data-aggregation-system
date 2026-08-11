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
      <button type="button" class="back-btn" title="返回">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <h1 class="nav-title">数据采集系统</h1>

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

<style scoped lang="less">
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

  .nav-left {
    display: flex;
    align-items: center;
    gap: var(--sp-lg);
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-family: inherit;
    font-size: var(--fs-16);
    color: var(--c-nav-text);
    background: transparent;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: background var(--dur) var(--ease);

    &:hover {
      background: var(--c-nav-hover);
    }
  }

  .nav-title {
    margin: 0;
    font-family: var(--ff-display);
    font-size: var(--fs-16);
    font-weight: 700;
    color: var(--c-nav-text);
    letter-spacing: -0.01em;
  }

  .nav-menu {
    display: flex;
    align-items: center;
    gap: var(--sp-xs);
  }

  /* .nav-item.is-active 是主色字 + 主色浅底 → 故意不复用 .pill-active(实底白字) */
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
    transition: all var(--dur) var(--ease);

    &:hover {
      color: var(--c-text-strong);
      background: var(--c-nav-hover);
    }

    &.is-active {
      color: var(--c-primary);
      background: var(--c-primary-bg);
      font-weight: 500;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .nav-avatar {
    background: var(--c-primary) !important;
    color: var(--c-on-primary);
    font-family: var(--ff-display);
    font-weight: 600;
    font-size: var(--fs-12);
  }

  .nav-user {
    font-size: var(--fs-14);
    color: var(--c-text-strong);
    font-weight: 500;
  }
}
</style>