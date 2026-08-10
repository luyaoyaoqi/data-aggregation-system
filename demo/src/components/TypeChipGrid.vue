<script setup>
/**
 * 题型网格 —— 左侧组件库 + 底部「添加题目」抽屉共用
 * 列数随容器宽度自适应（auto-fill + minmax 96px）
 *  - 240px 容器 → 2 列
 *  - 880px 容器 → 8 列
 */
defineProps({
  groups: { type: Array, required: true }
})
defineEmits(['pick'])
</script>

<template>
  <div class="type-chip-grid">
    <div v-for="group in groups" :key="group.name" class="chip-group">
      <p class="group-title">{{ group.name }}</p>
      <div class="chip-row">
        <button
          v-for="item in group.items"
          :key="item.type"
          type="button"
          class="type-chip"
          @click="$emit('pick', item.type)"
        >
          <svg
            class="chip-icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            v-html="item.icon"
          ></svg>
          <span class="chip-label">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.type-chip-grid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xl);
}

.chip-group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.group-title {
  margin: 0;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.chip-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--sp-sm);
}

.type-chip {
  /* height: 64px; */
  padding: var(--sp-md) var(--sp-xs);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-sm);
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-text-regular);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
}

.chip-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--c-text-secondary);
  transition: color 0.15s ease, transform 0.15s ease;
}

.chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.type-chip:hover {
  color: var(--c-primary);
  border-color: var(--c-primary-border);
  background: var(--c-primary-bg);
}

.type-chip:hover .chip-icon {
  color: var(--c-primary);
  transform: scale(1.08);
}

.type-chip:active {
  transform: translateY(1px);
}
</style>
