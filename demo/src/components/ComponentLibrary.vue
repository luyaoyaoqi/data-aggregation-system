<script>
/**
 * 题型元数据 —— 左侧组件库与底部「添加题目」抽屉共用
 */
export const TYPE_GROUPS = [
  {
    name: '选择',
    items: [
      { type: 'radio', label: '单选' },
      { type: 'checkbox', label: '多选' },
      { type: 'radio-rate', label: '单选打分' },
      { type: 'checkbox-rate', label: '多选打分' }
    ]
  },
  {
    name: '填空',
    items: [
      { type: 'text', label: '单行文本' },
      { type: 'textarea', label: '多行文本' },
      { type: 'number', label: '数字' },
      { type: 'datetime', label: '日期时间' }
    ]
  },
  {
    name: '采集',
    items: [
      { type: 'image', label: '图片' },
      { type: 'tag', label: '标签文本' },
      { type: 'list', label: '列表' },
      { type: 'richtext', label: '富文本' }
    ]
  }
]

/** 带选项列表的题型 */
export const OPTION_TYPES = ['radio', 'checkbox', 'radio-rate', 'checkbox-rate']

const ALL_TYPES = TYPE_GROUPS.flatMap((g) => g.items)

export function getTypeLabel(type) {
  return ALL_TYPES.find((t) => t.type === type)?.label || '未知题型'
}

let seed = 0
const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}_${++seed}`

/** 新建一道题目 */
export function createQuestion(type) {
  const q = {
    id: nextId('q'),
    type,
    title: '',
    desc: '',
    required: false,
    columns: 'single', // single | double 选项排列
    allowClear: true, // 允许清空
    asQuery: false, // 设为查询条件
    showInList: true, // 在数据列表中显示
    defaultOption: false, // 设为默认选项
    linkField: false, // 选项关联字段
    options: []
  }
  if (OPTION_TYPES.includes(type)) {
    q.options = [
      { id: nextId('o'), label: '选项1' },
      { id: nextId('o'), label: '选项2' },
      { id: nextId('o'), label: '选项3' }
    ]
  }
  return q
}

export function createOption(index) {
  return { id: nextId('o'), label: `选项${index}` }
}

export function createCard() {
  return { id: nextId('c'), title: '', questions: [] }
}

export function createPage(index) {
  return {
    id: nextId('p'),
    name: `第${index}页`,
    theme: '',
    cards: [createCard()]
  }
}
</script>

<script setup>
// 普通 script 中的绑定不会自动暴露给模板，这里显式转发
const groups = TYPE_GROUPS

defineEmits(['pick'])
</script>

<template>
  <aside class="component-library">
    <div class="lib-head">组件库</div>

    <div class="lib-body">
      <div v-for="group in groups" :key="group.name" class="lib-group">
        <p class="group-title">{{ group.name }}</p>
        <div class="chip-grid">
          <button
            v-for="item in group.items"
            :key="item.type"
            type="button"
            class="type-chip"
            @click="$emit('pick', item.type)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <p class="lib-tip">点击题型即可插入到当前卡片</p>
  </aside>
</template>

<style scoped>
.component-library {
  width: var(--w-library);
  flex-shrink: 0;
  height: 100%;
  background: var(--c-panel);
  border-right: 1px solid var(--c-line);
  display: flex;
  flex-direction: column;
}

.lib-head {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 var(--sp-lg);
  font-size: var(--fs-14);
  font-weight: 600;
  color: var(--c-text);
  border-bottom: 1px solid var(--c-line-light);
}

.lib-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-lg);
}

.lib-group + .lib-group {
  margin-top: var(--sp-xl);
}

.group-title {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-sm);
}

.type-chip {
  height: 32px;
  padding: 0 var(--sp-sm);
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-text-regular);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-chip:hover {
  color: var(--c-primary);
  border-color: var(--c-primary-border);
  background: var(--c-primary-light);
}

.type-chip:active {
  transform: translateY(1px);
}

.lib-tip {
  margin: 0;
  padding: var(--sp-md) var(--sp-lg);
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
  border-top: 1px solid var(--c-line-light);
}
</style>
