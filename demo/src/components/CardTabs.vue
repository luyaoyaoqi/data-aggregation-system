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
      :class="{ 'is-active': page.id === activeId }"
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

<style scoped>
.card-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-sm);
}

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
  transition: all 0.15s ease;
}

.tab-item:hover {
  color: var(--c-primary);
  background: var(--c-primary-light);
}

.tab-item.is-active {
  color: #fff;
  background: var(--c-primary);
  font-weight: 500;
}

.tab-close {
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  border-radius: var(--radius-sm);
}

.tab-close:hover {
  color: var(--c-danger);
}

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
  transition: all 0.15s ease;
}

.tab-add:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
  background: var(--c-primary-light);
}
</style>
