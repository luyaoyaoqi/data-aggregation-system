<script>
/**
 * 题型元数据 —— 左侧组件库与底部「添加题目」抽屉共用
 * icon: 16x16 viewBox，stroke 风格（1.5px），用 currentColor 自适配颜色
 */
export const TYPE_GROUPS = [
  {
    name: '选择',
    items: [
      { type: 'radio', label: '单选', icon: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/>' },
      { type: 'checkbox', label: '多选', icon: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M5 8l2 2 4-4"/>' },
      { type: 'radio-rate', label: '单选打分', icon: '<circle cx="8" cy="8" r="6"/><path d="M8 4.5l1 2 2.2.3-1.6 1.5.4 2.2L8 9.3l-2 1.2.4-2.2L4.8 6.8 7 6.5z" fill="currentColor" stroke="none"/>' },
      { type: 'checkbox-rate', label: '多选打分', icon: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M8 5l.9 1.8 2 .3-1.45 1.4.35 2L8 9.7l-1.8 1 .35-2L5.1 7.1l2-.3z" fill="currentColor" stroke="none"/>' }
    ]
  },
  {
    name: '填空',
    items: [
      { type: 'text', label: '单行文本', icon: '<path d="M2.5 8h11"/>' },
      { type: 'textarea', label: '多行文本', icon: '<path d="M2.5 5h11M2.5 8h11M2.5 11h7"/>' },
      { type: 'number', label: '数字', icon: '<path d="M5.5 3l-1.5 10M11.5 3l-1.5 10M3.5 6.5h9M3 9.5h9"/>' },
      { type: 'datetime', label: '日期时间', icon: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/><circle cx="8" cy="10" r="0.8" fill="currentColor"/>' }
    ]
  },
  {
    name: '采集',
    items: [
      { type: 'image', label: '图片', icon: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="7" r="1"/><path d="M2.5 11.5l3-3 2.5 2.5 2-2 3.5 3.5"/>' },
      { type: 'tag', label: '标签文本', icon: '<path d="M5 3.5h6.4a1.2 1.2 0 0 1 .85.35l2.4 2.4a1.2 1.2 0 0 1 0 1.7l-2.4 2.4a1.2 1.2 0 0 1-.85.35H5L2 7l3-3.5z"/><circle cx="4.5" cy="7" r="0.9" fill="currentColor" stroke="none"/>' },
      { type: 'list', label: '列表', icon: '<circle cx="3.5" cy="4.5" r="0.9" fill="currentColor"/><circle cx="3.5" cy="8" r="0.9" fill="currentColor"/><circle cx="3.5" cy="11.5" r="0.9" fill="currentColor"/><path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h5"/>' },
      { type: 'richtext', label: '富文本', icon: '<path d="M3 13l3-9 3 9M4.5 10h3"/><path d="M11.5 6h2M11.5 9h2M11.5 12h1.5"/>' }
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
import TypeChipGrid from './TypeChipGrid.vue'

const groups = TYPE_GROUPS

defineEmits(['pick'])
</script>

<template>
  <aside class="component-library">
    <div class="lib-head">组件库</div>

    <div class="lib-body">
      <TypeChipGrid :groups="groups" @pick="$emit('pick', $event)" />
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

.lib-tip {
  margin: 0;
  padding: var(--sp-md) var(--sp-lg);
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
  border-top: 1px solid var(--c-line-light);
}
</style>
