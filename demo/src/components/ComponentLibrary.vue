<script>
/**
 * 题型元数据 —— 左侧组件库与底部「添加题目」抽屉共用
 * icon: 16x16 viewBox，stroke 风格（1.5px），用 currentColor 自适配颜色
 */
export const TYPE_GROUPS = [
  {
    name: '选择',
    items: [
      { type: 'radio', label: '单选', icon: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.4" fill="currentColor" stroke="none"/>' },
      { type: 'checkbox', label: '多选', icon: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5 8.2l2 2 4-4.4"/>' },
      { type: 'radio-rate', label: '单选打分', icon: '<circle cx="8" cy="8" r="6"/><path d="M8 4.8l0.95 1.92 2.12 0.31-1.53 1.49 0.36 2.1L8 9.6l-1.9 1.02 0.36-2.1-1.53-1.49 2.12-0.31z" fill="currentColor" stroke="none"/>' },
      { type: 'checkbox-rate', label: '多选打分', icon: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M8 4.8l0.95 1.92 2.12 0.31-1.53 1.49 0.36 2.1L8 9.6l-1.9 1.02 0.36-2.1-1.53-1.49 2.12-0.31z" fill="currentColor" stroke="none"/>' }
    ]
  },
  {
    name: '填空',
    items: [
      { type: 'text', label: '单行文本', icon: '<circle cx="3" cy="8" r="0.7" fill="currentColor" stroke="none"/><path d="M3.5 8h9"/>' },
      { type: 'textarea', label: '多行文本', icon: '<circle cx="3" cy="5" r="0.6" fill="currentColor" stroke="none"/><path d="M3.5 5h9M3.5 8h9M3.5 11h6"/>' },
      { type: 'number', label: '数字', icon: '<path d="M6 3v10M10 3v10"/><path d="M3.5 6.5h9M3 9.5h9"/>' },
      { type: 'datetime', label: '日期时间', icon: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2"/><circle cx="8" cy="10" r="0.9" fill="currentColor" stroke="none"/>' }
    ]
  },
  {
    name: '采集',
    items: [
      { type: 'image', label: '图片', icon: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="5.8" cy="6.8" r="0.9" fill="currentColor" stroke="none"/><path d="M2.4 11.4l3-3 2.5 2.5 2-2 3.7 3.5"/>' },
      { type: 'tag', label: '标签文本', icon: '<path d="M5 3.4h6.3a1.2 1.2 0 0 1 0.85 0.35l2.5 2.5a1.2 1.2 0 0 1 0 1.7l-2.5 2.5a1.2 1.2 0 0 1-.85 0.35H5L2 7z"/><circle cx="4.6" cy="7" r="0.9" fill="currentColor" stroke="none"/>' },
      { type: 'list', label: '列表', icon: '<circle cx="3.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="3.5" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="3.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><path d="M6 4.5h7M6 8h7M6 11.5h5"/>' },
      { type: 'richtext', label: '富文本', icon: '<path d="M3.8 12l2.7-7.6 2.7 7.6"/><path d="M4.7 10h3.6"/><path d="M11 6h2.5M11 9h2.5M11 12h1.5"/>' }
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
    queryType: 'single', // 查询形式：single | multiple（仅 asQuery 开启时生效）
    showInList: true, // 在数据列表中显示
    defaultOption: false, // 设为默认选项
    linkField: false, // 选项关联字段
    options: []
  }
  if (OPTION_TYPES.includes(type)) {
    q.options = [
      { id: nextId('o'), label: '选项1', isDefault: false, linkType: null, linkData: null, displayName: '' },
      { id: nextId('o'), label: '选项2', isDefault: false, linkType: null, linkData: null, displayName: '' },
      { id: nextId('o'), label: '选项3', isDefault: false, linkType: null, linkData: null, displayName: '' }
    ]
  }
  return q
}

export function createOption(index) {
  return {
    id: nextId('o'),
    label: `选项${index}`,
    isDefault: false,
    linkType: null,
    linkData: null,
    displayName: ''
  }
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
