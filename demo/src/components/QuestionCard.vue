<script setup>
import { ArrowDown, Close, CopyDocument, Delete, Link, Rank, Setting, Plus } from '@element-plus/icons-vue'
import {
  OPTION_TYPES,
  getTypeLabel,
  createOption,
  LIST_COL_TYPES
} from './ComponentLibrary.vue'
import OptionLinkDialog from './OptionLinkDialog.vue'
import ListQuestionSettings from './ListQuestionSettings.vue'

/**
 * 7 切换：选项类 4 种题型互相切换的下拉数据
 * icon 与 ComponentLibrary.vue 选择组保持一致（16×16 stroke）
 */
const SWITCHABLE_TYPES = [
  { type: 'radio', label: '单选', icon: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.4" fill="currentColor" stroke="none"/>' },
  { type: 'checkbox', label: '多选', icon: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5 8.2l2 2 4-4.4"/>' },
  { type: 'radio-rate', label: '单选打分', icon: '<circle cx="8" cy="8" r="6"/><path d="M8 4.8l0.95 1.92 2.12 0.31-1.53 1.49 0.36 2.1L8 9.6l-1.9 1.02 0.36-2.1-1.53-1.49 2.12-0.31z" fill="currentColor" stroke="none"/>' },
  { type: 'checkbox-rate', label: '多选打分', icon: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M8 4.8l0.95 1.92 2.12 0.31-1.53 1.49 0.36 2.1L8 9.6l-1.9 1.02 0.36-2.1-1.53-1.49 2.12-0.31z" fill="currentColor" stroke="none"/>' }
]

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, default: 1 },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'remove', 'duplicate', 'switch-type', 'grip-down'])

const hasOptions = computed(() => OPTION_TYPES.includes(props.question.type))
const isRate = computed(() => props.question.type.endsWith('-rate'))
const isRadio = computed(
  () => props.question.type === 'radio' || props.question.type === 'radio-rate'
)
const typeLabel = computed(() => getTypeLabel(props.question.type))

/** 是否在题目右上角显示可点击的题型下拉（仅选项类 4 种支持切换） */
const canSwitchType = computed(() => OPTION_TYPES.includes(props.question.type))
const currentTypeIcon = computed(
  () => SWITCHABLE_TYPES.find((t) => t.type === props.question.type)?.icon || ''
)

function handleSwitchType(newType) {
  if (newType === props.question.type) return
  emit('switch-type', newType)
}

/** 拖动手柄按下：阻止默认行为 + 冒泡，emit 给父级协调重排 */
function handleGripDown(e) {
  e.preventDefault()
  e.stopPropagation()
  emit('grip-down', e, props.question.id)
}

/** 是否在当前题目上启用「设为默认选项」（仅 radio / radio-rate） */
const showDefaultSwitch = computed(
  () => props.question.type === 'radio' || props.question.type === 'radio-rate'
)

function addOption() {
  props.question.options.push(createOption(props.question.options.length + 1))
}

function removeOption(id) {
  if (props.question.options.length <= 1) {
    ElMessage.warning('至少保留一个选项')
    return
  }
  const i = props.question.options.findIndex((o) => o.id === id)
  if (i > -1) props.question.options.splice(i, 1)
}

/** 设为默认选项：单选/单选打分才有意义 */
function setDefault(opt) {
  if (!props.question.defaultOption) return
  props.question.options.forEach((o) => (o.isDefault = o.id === opt.id))
}

/** 选项关联弹窗状态 */
const linkDialogVisible = ref(false)
const linkingOption = ref(null)

function openLinkDialog(opt) {
  linkingOption.value = opt
  linkDialogVisible.value = true
}

function handleLinkConfirm({ linkType, linkData, displayName }) {
  if (!linkingOption.value) return
  const o = linkingOption.value
  o.linkType = linkType
  o.linkData = linkData
  o.displayName = displayName
  // 关联后展示名优先（<=10），否则回退到关联对象的中文名
  if (!o.label || o.label === '') {
    o.label = displayName || linkData?.name || ''
  }
}

function clearLink(opt) {
  opt.linkType = null
  opt.linkData = null
  opt.displayName = ''
  // 清关联后恢复为「选项 N」默认展示
  if (opt.label === '') {
    const idx = props.question.options.findIndex((o) => o.id === opt.id)
    opt.label = `选项${idx + 1}`
  }
}

/* -------------------- 删除题目 -------------------- */
/* 二次确认由外层 Editor.handleRemoveQuestion 统一处理，这里只负责抛事件 */
function handleRemove() {
  emit('remove', props.question.id)
}

/* -------------------- 标签文本：输入回车添加 -------------------- */
const tagInput = ref('')
/** 单标签最大字符数（与 PropertyPanel maxlength=40 保持一致） */
const TAG_MAX_LEN = 40

/**
 * 提交输入框中的标签内容
 * - 支持一次输入多个：用 , ， ; ； 换行 分隔
 * - 自动 trim / 去空 / 跳过超 40 字符
 * - maxTags 上限内逐个添加；allowDuplicate=false 时跳过重复
 */
function commitTag() {
  const raw = tagInput.value.trim()
  if (!raw) return
  // 多种分隔符：英文/中文逗号、分号、换行
  const items = raw
    .split(/[,，;；\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!items.length) {
    tagInput.value = ''
    return
  }
  let added = 0
  let dupOrMax = 0
  let overSized = 0
  for (const v of items) {
    if (v.length > TAG_MAX_LEN) {
      overSized++
      continue
    }
    if (
      props.question.maxTags != null &&
      props.question.tags.length >= props.question.maxTags
    ) {
      dupOrMax++
      continue
    }
    if (!props.question.allowDuplicate && props.question.tags.includes(v)) {
      dupOrMax++
      continue
    }
    props.question.tags.push(v)
    added++
  }
  tagInput.value = ''
  // 仅在全部失败时给提示；部分成功不打断
  if (added === 0) {
    if (overSized && !dupOrMax) {
      ElMessage.warning(`单标签最多 ${TAG_MAX_LEN} 字符`)
    } else {
      const reasons = []
      if (dupOrMax && props.question.maxTags != null) reasons.push('已达上限')
      if (dupOrMax && !props.question.allowDuplicate) reasons.push('禁止重复')
      ElMessage.warning(reasons.length ? reasons.join(' / ') : '未添加任何标签')
    }
  }
}

/** 中文逗号 / 分号 也触发提交（避免中文输入法下 Enter 失效的情况） */
function handleTagKeydown(e) {
  // 中文输入法组合中不触发（避免拼音输入到一半被吞）
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === ',' || e.key === '，' || e.key === ';' || e.key === '；') {
    e.preventDefault()
    commitTag()
  }
}

function removeTag(i) {
  props.question.tags.splice(i, 1)
}

/* -------------------- 列表（自增表格） -------------------- */
const isList = computed(() => props.question.type === 'list')
const listCols = computed(() => props.question.listColumns || [])

/** 列类型中文名（用于预览图第 2 行直接展示） */
const colTypeLabelMap = Object.fromEntries(
  LIST_COL_TYPES.map((t) => [t.value, t.label])
)
/**
 * 单行文本 / 数字 / 日期 → 直接返回 label
 * 单选 / 多选 → "单选（下拉：选项1、选项2）"（把选项值拼到括号里）
 */
function getColTypeLabel(col) {
  const label = colTypeLabelMap[col.colType] || ''
  if (
    (col.colType === 'radio' || col.colType === 'checkbox') &&
    Array.isArray(col.options) &&
    col.options.length
  ) {
    const optsText = col.options.map((o) => o.label || '').filter(Boolean).join('、')
    return label.replace('（下拉）', `（下拉：${optsText}）`)
  }
  return label
}

/** 列表列设置弹框 */
const listSettingsVisible = ref(false)

function openListSettings() {
  listSettingsVisible.value = true
}
</script>

<template>
  <section
    class="question-card"
    :class="{ 'is-active': active }"
    @click="emit('select', question.id)"
  >
    <!-- 题干行 -->
    <div class="q-head">
      <el-icon class="q-drag" title="拖动排序" @mousedown="handleGripDown"><Rank /></el-icon>
      <span class="q-index">{{ index }}.</span>
      <input
        v-model="question.title"
        class="q-title-input"
        placeholder="请输入题目标题"
      />
      <span v-if="question.required" class="q-required">*</span>
      <!-- 选项类 4 种：题型可点击下拉切换 -->
      <el-dropdown
        v-if="canSwitchType"
        trigger="click"
        class="q-type-switch"
        @command="handleSwitchType"
      >
        <span class="q-type-tag is-switchable">
          <svg
            class="q-type-icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            v-html="currentTypeIcon"
          />
          <span>{{ typeLabel }}</span>
          <el-icon class="q-type-arrow"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="t in SWITCHABLE_TYPES"
              :key="t.type"
              :command="t.type"
              :disabled="t.type === question.type"
            >
              <svg
                class="q-type-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                v-html="t.icon"
              />
              <span>{{ t.label }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 其它题型：只读标签 -->
      <span v-else class="q-type-tag">{{ typeLabel }}</span>
    </div>

    <p v-if="question.desc" class="q-desc">{{ question.desc }}</p>

    <!-- 题型内容区 -->
    <div class="q-body">
      <!-- 选项类 -->
      <template v-if="hasOptions">
        <div
          class="option-list"
          :class="{ 'is-double': question.columns === 'double' }"
        >
          <div v-for="(opt, i) in question.options" :key="opt.id" class="option-item">
            <span class="option-mark" :class="question.type.startsWith('checkbox') ? 'is-square' : ''" />

            <!-- 已关联：替换为「←关联 + 显示名」展示 -->
            <el-tooltip
              v-if="opt.linkType"
              placement="top"
              :show-after="120"
              :content="opt.linkData?.name || ''"
            >
              <span class="option-linked">
                <span class="link-badge">←关联</span>
                <span class="link-name">{{ opt.displayName || opt.linkData?.name }}</span>
                <el-icon class="link-clear" title="删除关联" @click="clearLink(opt)">
                  <Close />
                </el-icon>
              </span>
            </el-tooltip>

            <!-- 未关联：保持文字输入框 -->
            <input
              v-else
              v-model="opt.label"
              class="option-input"
              placeholder="请输入选项"
            />

            <el-input-number
              v-if="isRate"
              v-model="opt.score"
              :min="-9999"
              :max="9999"
              :precision="2"
              controls-position="right"
              placeholder="评分"
              :controls="false"
              class="option-score-input"
            >
              <template #suffix>
                <span v-if="opt.score != null" class="option-score-suffix">分</span>
              </template>
            </el-input-number>

            <!-- 默认项标签（radio/radio-rate 启用 defaultOption 后展示） -->
            <span
              v-if="showDefaultSwitch && question.defaultOption && opt.isDefault"
              class="opt-default-tag"
            >
              ● 默认
            </span>

            <!-- 设为默认按钮（仅 defaultOption 开启） -->
            <button
              v-if="showDefaultSwitch && question.defaultOption && !opt.isDefault"
              type="button"
              class="opt-set-default"
              @click="setDefault(opt)"
            >
              设为默认
            </button>

            <!-- 关联按钮（仅 linkField 开启） -->
            <button
              v-if="question.linkField && !opt.linkType"
              type="button"
              class="opt-link-btn"
              @click="openLinkDialog(opt)"
            >
              <el-icon><Link /></el-icon>
              <span>关联</span>
            </button>

            <el-icon class="option-del" title="删除选项" @click="removeOption(opt.id)">
              <Close />
            </el-icon>
          </div>
        </div>

        <button type="button" class="add-option" @click="addOption">
          <el-icon><Plus /></el-icon>
          <span>添加选项</span>
        </button>
      </template>

      <!-- 填空 / 采集类 -->
      <template v-else>
        <div class="q-preview">
          <el-input
            v-if="question.type === 'text'"
            v-model="question.placeholder"
            :maxlength="question.maxLength || undefined"
            show-word-limit
            placeholder="请输入"
          />
          <el-input
            v-else-if="question.type === 'textarea'"
            v-model="question.placeholder"
            type="textarea"
            :rows="question.rows"
            :maxlength="question.maxLength || undefined"
            show-word-limit
            placeholder="请输入"
          />
          <el-input
            v-else-if="question.type === 'number'"
            v-model="question.placeholder"
            :maxlength="question.maxLength || undefined"
            placeholder="请输入数字"
          >
            <template #suffix>
              <span v-if="question.unit" class="option-score-suffix">{{ question.unit }}</span>
            </template>
          </el-input>
          <el-input
            v-else-if="question.type === 'datetime'"
            v-model="question.placeholder"
            :maxlength="question.maxLength || undefined"
            placeholder="年 - 月 - 日"
          />
          <div v-else-if="question.type === 'image'" class="upload-box">
            <el-icon><Plus /></el-icon>
            <span>上传图片</span>
          </div>
          <div v-else-if="question.type === 'tag'" class="tag-input-wrap">
            <el-tag
              v-for="(t, i) in question.tags"
              :key="t"
              closable
              class="tag-chip"
              @close="removeTag(i)"
            >{{ t }}</el-tag>
            <input
              v-model="tagInput"
              class="tag-input"
              :placeholder="question.tags.length ? '' : question.placeholder || '输入后回车添加'"
              :maxlength="40"
              @keydown.enter.prevent="commitTag"
              @keydown="handleTagKeydown"
              @blur="commitTag"
            />
            <span
              v-if="question.maxTags != null"
              class="tag-counter"
              :class="{ 'is-full': question.tags.length >= question.maxTags }"
            >{{ question.tags.length }} / {{ question.maxTags }}</span>
          </div>
          <div v-else-if="question.type === 'list'" class="list-editor">
            <p class="list-hint">
              应用端填报时可增删行；单选/多选列以下拉选择。
              <span v-if="listCols.length >= 20" class="list-warn">已达 20 列上限</span>
            </p>

            <!-- 列表预览图：撑满父容器，2 行（表头 + 1 行内容），点击进入列设置 -->
            <div class="list-table-preview" @click="openListSettings">
              <div class="ltp-head">
                <div
                  v-for="col in listCols"
                  :key="col.id"
                  class="ltp-th"
                  :class="{ 'is-fixed': col.width != null }"
                  :style="col.width != null ? { width: col.width + 'px' } : null"
                >
                  <span class="ltp-name">{{ col.name || '未命名列' }}</span>
                  <span v-if="col.required" class="ltp-required">*</span>
                </div>
              </div>
              <div class="ltp-body">
                <div
                  v-for="col in listCols"
                  :key="col.id"
                  class="ltp-td"
                  :class="{ 'is-fixed': col.width != null }"
                  :style="col.width != null ? { width: col.width + 'px' } : null"
                >
                  <!-- 第 2 行：单行文本 / 数字 / 日期直接显示类型；单选 / 多选显示「类型（下拉：选项1、选项2）」 -->
                  <div class="ltp-cell-text">{{ getColTypeLabel(col) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="question.type === 'richtext'" class="rich-box">
            <div class="rich-toolbar">B / U · 段落 · 链接 · 图片</div>
            <div class="rich-area">请输入富文本内容</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部工具条 -->
    <div class="q-tools">
      <el-checkbox v-model="question.required" size="small">必填</el-checkbox>

      <button type="button" class="tool-btn" @click="emit('duplicate', question.id)">
        <el-icon><CopyDocument /></el-icon>
        <span>复制</span>
      </button>

      <button type="button" class="tool-btn is-danger" @click="handleRemove">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </button>

      <template v-if="hasOptions">
        <span class="tool-divider" />
        <!-- 「设为默认选项」仅 radio / radio-rate 展示 -->
        <template v-if="showDefaultSwitch">
          <span class="tool-label">设为默认选项</span>
          <el-switch v-model="question.defaultOption" size="small" />
        </template>
        <span class="tool-label">选项关联字段</span>
        <el-switch v-model="question.linkField" size="small" />
      </template>
    </div>

    <!-- 选项关联字段弹窗 -->
    <OptionLinkDialog
      v-if="linkingOption"
      v-model="linkDialogVisible"
      :option="linkingOption"
      @confirm="handleLinkConfirm"
    />

    <!-- 列表列设置弹框 -->
    <ListQuestionSettings v-model="listSettingsVisible" :question="question" />
  </section>
</template>

<style scoped>
.question-card {
  padding: var(--sp-lg);
  background: var(--c-panel);
  border: 1px dashed var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.question-card:hover {
  background: var(--c-fill);
}

.question-card.is-active {
  border-color: var(--c-primary);
  border-style: solid;
  background: var(--c-panel);
  box-shadow: 0 0 0 3px var(--c-primary-bg);
}

/* ---------- 题干 ---------- */
.q-head {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.q-drag {
  /* Element Plus 的 el-icon 不会自动撑开，需要显式尺寸 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 16px;
  flex-shrink: 0;
  color: var(--c-text-placeholder);
  cursor: move;
  border-radius: 4px;
  transition: color 0.15s ease, background 0.15s ease;
}

.q-drag:hover {
  color: var(--c-primary);
  background: var(--c-primary-bg);
}

.q-index {
  font-size: var(--fs-14);
  color: var(--c-text);
}

.q-title-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-text);
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  outline: none;
  transition: border-color 0.15s ease;
}

.q-title-input::placeholder {
  color: var(--c-text-placeholder);
}

.q-title-input:hover:not(:focus) {
  border-bottom-color: var(--c-line);
}

.q-title-input:focus {
  border-bottom-color: var(--c-primary);
}

.q-required {
  color: var(--c-danger);
  font-size: var(--fs-16);
  line-height: 1;
}

.q-type-tag {
  flex-shrink: 0;
  padding: var(--sp-xs) var(--sp-sm);
  font-size: var(--fs-14);
  color: var(--c-text-secondary);
  background: var(--c-fill);
  border-radius: var(--radius-sm);
}

.q-type-tag.is-switchable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.q-type-tag.is-switchable:hover {
  color: var(--c-primary);
  background: var(--c-primary-bg);
}

.q-type-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.q-type-arrow {
  font-size: 10px;
  margin-left: 2px;
}

/* el-dropdown 菜单项里也用同样的图标 */
.el-dropdown-menu .q-type-icon {
  vertical-align: -2px;
  margin-right: 6px;
}

.q-desc {
  margin: var(--sp-xs) 0 0 28px;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

/* ---------- 选项 ---------- */
.q-body {
  margin: var(--sp-md) 0 0 28px;
}

.option-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-sm);
}

.option-list.is-double {
  grid-template-columns: repeat(2, 1fr);
  column-gap: var(--sp-xl);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.option-mark {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid var(--c-text-placeholder);
  border-radius: 50%;
}

.option-mark.is-square {
  border-radius: 3px;
}

.option-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 var(--sp-sm);
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-text-regular);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  outline: none;
}

.option-input:hover {
  border-color: var(--c-line);
}

.option-input:focus {
  border-color: var(--c-primary);
  background: #fff;
}

.option-score-input {
  flex-shrink: 0;
  width: 96px;
}

/* 与 .option-input 视觉一致：透明底 + 悬浮显边框 + focus 主色 */
.option-score-input :deep(.el-input__wrapper) {
  padding: 1px 8px;
  background: transparent;
  box-shadow: 0 0 0 1px transparent inset;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.option-score-input:hover :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--c-line) inset;
}

.option-score-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--c-primary) inset;
  background: #fff;
}

.option-score-input :deep(.el-input__inner) {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.option-score-suffix {
  font-size: var(--fs-14);
  color: var(--c-text-secondary);
  margin-left: 4px;
}

/* 已关联：展示名 + 关联标签 + 删除关联 */
.option-linked {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  min-width: 0;
  height: 30px;
  padding: 0 var(--sp-sm);
  font-size: var(--fs-14);
  color: var(--c-text-regular);
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-border);
  border-radius: var(--radius-sm);
  cursor: default;
}

.link-badge {
  flex-shrink: 0;
  padding: 0 var(--sp-xs);
  font-size: var(--fs-12);
  color: var(--c-primary);
  background: #fff;
  border-radius: var(--radius-sm);
}

.link-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-clear {
  flex-shrink: 0;
  color: var(--c-text-secondary);
  cursor: pointer;
}

.link-clear:hover {
  color: var(--c-danger);
}

/* 默认项标签 */
.opt-default-tag {
  flex-shrink: 0;
  font-size: var(--fs-12);
  color: var(--c-primary);
  font-weight: 500;
}

/* 设为默认按钮 */
.opt-set-default {
  flex-shrink: 0;
  padding: 2px var(--sp-sm);
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-primary);
  background: transparent;
  border: 1px dashed var(--c-primary-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.opt-set-default:hover {
  background: var(--c-primary-bg);
}

/* 关联按钮 */
.opt-link-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2xs);
  padding: 2px var(--sp-sm);
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-primary);
  background: transparent;
  border: 1px dashed var(--c-primary-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.opt-link-btn:hover {
  background: var(--c-primary-bg);
}

.option-del {
  color: var(--c-text-placeholder);
  cursor: pointer;
}

.option-del:hover {
  color: var(--c-danger);
}

.add-option {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  margin-top: var(--sp-md);
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-primary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.add-option:hover {
  color: var(--c-primary-hover);
}

/* ---------- 其它题型预览 ---------- */
.q-preview {
  /* 填空类默认拉满 q-body 宽度；采集类有各自固定宽度 */
  width: 100%;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-xs);
  width: 96px;
  height: 96px;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  background: var(--c-fill);
  border: 1px dashed var(--c-line);
  border-radius: var(--radius);
}

.tag-row {
  display: flex;
  gap: var(--sp-sm);
}

/* 标签文本：标签 + 输入框一行 */
.tag-input-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-sm);
  min-height: 30px;
  padding: 4px 0;
  border-bottom: 1px solid var(--c-line-light);
  transition: border-color 0.15s ease;
}

.tag-input-wrap:focus-within {
  border-bottom-color: var(--c-primary);
  border-bottom-style: solid;
}

.tag-chip {
  margin-right: 0;
}

.tag-input {
  flex: 1;
  min-width: 120px;
  height: 28px;
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-text-regular);
  background: transparent;
  border: none;
  outline: none;
}

.tag-input::placeholder {
  color: var(--c-text-placeholder);
}

.tag-counter {
  flex-shrink: 0;
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
  padding-left: var(--sp-sm);
  border-left: 1px solid var(--c-line-light);
  margin-left: auto;
}

.tag-counter.is-full {
  color: var(--c-danger);
}

.list-editor {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.list-cols {
  display: none;
}

.list-hint {
  margin: 0;
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
  line-height: 18px;
}

.list-warn {
  margin-left: var(--sp-sm);
  color: var(--c-danger);
}

/* ---------- 列表预览图（替代原 chip + 列设置按钮）---------- */
.list-table-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  background: var(--c-panel);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.list-table-preview:hover {
  border-color: var(--c-primary);
}

.ltp-head,
.ltp-body {
  display: flex;
  align-items: stretch;
  min-width: 0;
}

.ltp-head {
  background: var(--c-fill);
  border-bottom: 1px solid var(--c-line);
}

.ltp-th,
.ltp-td {
  min-width: 0;
  flex: 1 1 0;
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--fs-13);
  border-right: 1px solid var(--c-line-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ltp-th:last-child,
.ltp-td:last-child {
  border-right: none;
}

.ltp-th.is-fixed,
.ltp-td.is-fixed {
  flex: 0 0 auto;
}

.ltp-th {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: var(--c-text);
}

.ltp-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.ltp-required {
  flex-shrink: 0;
  color: var(--c-danger);
}

.ltp-td {
  color: var(--c-text-regular);
}

/* 第 2 行直接显示类型名称（单行文本 / 数字 / 日期 / 单选（下拉：选项1、选项2）/ 多选（下拉：...）） */
.ltp-cell-text {
  font-size: var(--fs-13);
  color: var(--c-text-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 列设置按钮已删除，预览图替代 */

.list-box {
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  overflow: hidden;
}

.list-row {
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--fs-14);
  color: var(--c-text-regular);
}

.list-row + .list-row {
  border-top: 1px solid var(--c-line-light);
}

.rich-box {
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  overflow: hidden;
}

.rich-toolbar {
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  background: var(--c-fill);
  border-bottom: 1px solid var(--c-line);
}

.rich-area {
  padding: var(--sp-md);
  min-height: 72px;
  font-size: var(--fs-14);
  color: var(--c-text-placeholder);
}

/* ---------- 工具条 ---------- */
.q-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-lg);
  margin: var(--sp-lg) 0 0 28px;
  padding-top: var(--sp-md);
  border-top: 1px dashed var(--c-line-light);
}

.tool-divider {
  width: 1px;
  height: 12px;
  background: var(--c-line);
}

.tool-label {
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}
</style>