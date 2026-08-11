<script setup>
import { Close, Plus } from '@element-plus/icons-vue'

defineProps({
  pages: { type: Array, required: true },
  activeId: { type: String, default: '' }
})

defineEmits(['change', 'add', 'remove'])
</script>

<template>
  <div class="card-tabs">
    <div
      v-for="page in pages"
      :key="page.id"
      class="tab-item"
      :class="{ 'pill-active': page.id === activeId }"
      @click="$emit('change', page.id)"
    >
      <span class="tab-label">{{ page.name }}</span>
      <el-icon
        v-if="page.id !== activeId"
        class="tab-close"
        @click.stop="$emit('remove', page.id)"
      >
        <Close />
      </el-icon>
    </div>

    <button type="button" class="tab-add" title="新增一页" @click="$emit('add')">
      <el-icon><Plus /></el-icon>
    </button>
  </div>
</template>

<style scoped lang="less">
.card-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-sm);

  // ============ Tab 项 ============
  .tab-item {
    display: flex;
    align-items: center;
    gap: var(--sp-xs);
    height: 32px;
    padding: 0 var(--sp-md);
    font-size: var(--fs-14);
    color: var(--c-text-regular);
    background: var(--c-fill);
    border: 1px solid transparent;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--dur) var(--ease);

    // 悬停 — 中性态进入主色浅底
    &:hover {
      color: var(--c-primary);
      background: var(--c-primary-bg);
    }

    // 激活态(Pill) — 锁定视觉,避免被 :hover 覆盖
    // 嵌套顺序必须晚于 &:hover,否则悬停会改回主色字
    &.pill-active {
      color: var(--c-on-primary);
      background: var(--c-primary);
      font-weight: 500;
      border-color: var(--c-primary);

      &:hover {
        color: var(--c-on-primary);
        background: var(--c-primary-hover);
        border-color: var(--c-primary-hover);
      }
    }
  }

  // ============ 关闭图标(非激活 tab 展示)============
  .tab-close {
    font-size: var(--fs-12);
    color: var(--c-text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--dur) var(--ease);

    &:hover {
      color: var(--c-danger);
    }
  }

  // ============ 新增 Tab 按钮 ============
  .tab-add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--c-text-secondary);
    background: transparent;
    border: 1px dashed var(--c-line);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--dur) var(--ease);

    &:hover {
      color: var(--c-primary);
      border-color: var(--c-primary);
      background: var(--c-primary-bg);
    }
  }
}
</style>
