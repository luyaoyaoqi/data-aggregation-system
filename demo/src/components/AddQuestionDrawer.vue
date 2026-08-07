<script setup>
import { TYPE_GROUPS } from './ComponentLibrary.vue'

const groups = TYPE_GROUPS

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'pick'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function handlePick(type) {
  emit('pick', type)
  visible.value = false
}
</script>

<template>
  <el-drawer
    v-model="visible"
    direction="btt"
    size="320px"
    title="添加题目"
    :with-header="true"
  >
    <div class="drawer-inner">
      <p class="drawer-tip">选择一个题型，插入到当前卡片末尾</p>

      <div v-for="group in groups" :key="group.name" class="drawer-group">
        <p class="group-title">{{ group.name }}</p>
        <div class="chip-row">
          <button
            v-for="item in group.items"
            :key="item.type"
            type="button"
            class="type-chip"
            @click="handlePick(item.type)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-inner {
  max-width: 880px;
  margin: 0 auto;
}

.drawer-tip {
  margin: 0 0 var(--sp-xl);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.drawer-group + .drawer-group {
  margin-top: var(--sp-xl);
}

.group-title {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-md);
}

.type-chip {
  min-width: 96px;
  height: 36px;
  padding: 0 var(--sp-lg);
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-text-regular);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-chip:hover {
  color: var(--c-primary);
  border-color: var(--c-primary-border);
  background: var(--c-primary-light);
}
</style>
