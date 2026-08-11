<script setup>
import { ArrowDown, Close, CopyDocument, Delete, Link, Rank, Setting, Plus } from '@element-plus/icons-vue'
import {
  OPTION_TYPES,
  getTypeLabel,
  getTypeIcon,
  createOption,
  LIST_COL_TYPES
} from './ComponentLibrary.vue'
import OptionLinkDialog from './OptionLinkDialog.vue'
import ListQuestionSettings from './ListQuestionSettings.vue'
import { Clock } from '@element-plus/icons-vue'

/**
 * 切换：选项类 4 种题型互相切换的下拉数据
 * icon 复用 ComponentLibrary.vue 的 SVG（getTypeIcon 统一取）
 */
const SWITCHABLE_TYPES = ['radio', 'checkbox', 'radio-rate', 'checkbox-rate'].map((type) => ({
  type,
  label: getTypeLabel(type),
  icon: getTypeIcon(type)
}))

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
const typeIcon = computed(() => getTypeIcon(props.question.type))

/** 是否在题目右上角显示可点击的题型下拉（仅选项类 4 种支持切换） */
const canSwitchType = computed(() => OPTION_TYPES.includes(props.question.type))

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

/** 富文本命令封装：按钮 mousedown.prevent 避免输入区失焦 */
function exec(cmd, value) {
  document.execCommand(cmd, false, value)
}

/* -------------------- 列表（自增表格） -------------------- */
const isList = computed(() => props.question.type === 'list')
const listCols = computed(() => props.question.listColumns || [])

/** 列类型中文名（用于预览图第 2 行直接展示） */
const colTypeLabelMap = Object.fromEntries(
  LIST_COL_TYPES.map((t) => [t.value, t.label])
)
/**
 * 列类型中文标签：直接返回基础 label（不再拼选项值）
 * - 单行文本 / 数字 / 日期 → 原 label
 * - 单选 / 多选 → "单选（下拉）" / "多选（下拉）"（下拉箭头图标在模板里另外渲染）
 */
function getColTypeLabel(col) {
  return colTypeLabelMap[col.colType] || ''
}

/** 该列是否是下拉类（用于模板里追加下拉箭头图标） */
function isDropdownCol(col) {
  return col.colType === 'radio' || col.colType === 'checkbox'
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
      <el-icon class="drag-grip" title="拖动排序" @mousedown="handleGripDown"><Rank /></el-icon>
      <span v-if="index != null" class="q-index">{{ index }}.</span>
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
            v-html="typeIcon"
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
      <!-- 其它题型：只读标签（带图标） -->
      <span v-else class="q-type-tag is-static">
        <svg
          class="q-type-icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="typeIcon"
        />
        <span>{{ typeLabel }}</span>
      </span>
    </div>

    <!-- <p v-if="question.desc" class="q-desc">{{ question.desc }}</p> -->

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
                <el-icon class="btn-icon-ghost link-clear" title="删除关联" @click="clearLink(opt)">
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
              class="btn-outline-dashed-primary opt-set-default"
              @click="setDefault(opt)"
            >
              设为默认
            </button>

            <!-- 关联按钮（仅 linkField 开启） -->
            <button
              v-if="question.linkField && !opt.linkType"
              type="button"
              class="btn-outline-dashed-primary opt-link-btn"
              @click="openLinkDialog(opt)"
            >
              <el-icon><Link /></el-icon>
              <span>关联</span>
            </button>

            <el-icon class="btn-icon-ghost option-del" title="删除选项" @click="removeOption(opt.id)">
              <Close />
            </el-icon>
          </div>
        </div>

        <button type="button" class="btn-text-primary add-option" style="margin-top: var(--sp-md);" @click="addOption">
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
          >
            <template #prefix>
              <el-icon><Clock /></el-icon>
            </template>
          </el-input>
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
            <!-- 提示行：提示文字 + 列设置按钮同行 -->
            <div class="list-head">
              <p class="list-hint">
                应用端填报时可增删行；单选/多选列以下拉选择。
                <span v-if="listCols.length >= 20" class="list-warn">已达 20 列上限</span>
              </p>
              <!-- 显式入口：避免用户不知道点预览图能进列设置 -->
              <button type="button" class="btn-text-primary list-settings-btn" @click="openListSettings">
                <el-icon><Plus /></el-icon>
                <span>列设置</span>
              </button>
            </div>

            <!-- 列表预览图：撑满父容器，2 行（表头 + 1 行内容），点击进入列设置 -->
            <div class="table-preview list-table-preview" @click="openListSettings">
              <div class="table-preview__head">
                <div
                  v-for="col in listCols"
                  :key="col.id"
                  class="table-preview__cell table-preview__cell--head"
                  :class="{ 'is-fixed': col.width != null }"
                  :style="col.width != null ? { width: col.width + 'px' } : null"
                >
                  <span class="table-preview__cell-text">{{ col.name || '未命名列' }}</span>
                  <span v-if="col.required" class="table-preview__required">*</span>
                </div>
              </div>
              <div class="table-preview__body">
                <div
                  v-for="col in listCols"
                  :key="col.id"
                  class="table-preview__cell table-preview__cell--body"
                  :class="{ 'is-fixed': col.width != null }"
                  :style="col.width != null ? { width: col.width + 'px' } : null"
                >
                  <!-- 第 2 行：单行文本 / 数字 / 日期直接显示类型；单选 / 多选显示「类型（下拉）」+ 下拉箭头 -->
                  <div class="table-preview__cell-text">
                    <span>{{ getColTypeLabel(col) }}</span>
                    <el-icon v-if="isDropdownCol(col)" class="cell-caret">
                      <ArrowDown />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>

            <!-- 「添加 1 行」：应用端填报时才生效；编辑器内仅作预览展示，不绑交互 -->
            <button type="button" class="list-add-row" tabindex="-1" aria-disabled="true">
              <el-icon><Plus /></el-icon>
              <span>添加 1 行</span>
            </button>
          </div>
          <div v-else-if="question.type === 'richtext'" class="rte">
            <div class="rte__toolbar">
              <button type="button" class="rte__btn" @mousedown.prevent @click="exec('bold')">B</button>
              <button type="button" class="rte__btn is-italic" @mousedown.prevent @click="exec('italic')">/</button>
              <button type="button" class="rte__btn is-blue" @mousedown.prevent @click="exec('foreColor', '#2563EB')">蓝</button>
              <button type="button" class="rte__btn is-red" @mousedown.prevent @click="exec('foreColor', '#dc2626')">红</button>
              <button type="button" class="rte__btn is-list" @mousedown.prevent @click="exec('insertUnorderedList')"><span class="rte__dot" />列表</button>
            </div>
            <div
              class="rte__area"
              contenteditable="true"
              data-ph="请输入内容（支持加粗、颜色等）"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 底部工具条 -->
    <div class="toolbar q-tools">
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

<style scoped lang="less">
.question-card {
  padding: var(--sp-lg);
  background: var(--c-panel);
  border: 1px dashed var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--dur) var(--ease);

  &:hover {
    background: var(--c-fill-hover);
  }

  &.is-active {
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

  /* .drag-grip 由 global 提供(20×20 + 主色 hover);此处补足 el-icon 显式尺寸 */
  .drag-grip {
    /* Element Plus 的 el-icon 不会自动撑开，需要显式尺寸 */
    width: 20px;
    height: 20px;
    font-size: var(--fs-16);
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
    transition: border-color var(--dur) var(--ease);

    &::placeholder {
      color: var(--c-text-placeholder);
    }

    &:hover:not(:focus) {
      border-bottom-color: var(--c-line);
    }

    &:focus {
      border-bottom-color: var(--c-primary);
    }
  }

  .q-required {
    color: var(--c-danger);
    font-size: var(--fs-16);
    line-height: 1;
  }

  .q-type-tag {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-xs);
    padding: var(--sp-xs) var(--sp-sm);
    font-size: var(--fs-14);
    color: var(--c-text-secondary);
    background: var(--c-fill);
    border-radius: var(--radius-sm);

    &.is-switchable {
      cursor: pointer;
      transition: background var(--dur) var(--ease);

      &:hover {
        color: var(--c-primary);
        background: var(--c-primary-bg);
      }
    }
  }

  .q-type-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .q-type-arrow {
    font-size: var(--fs-12);
    margin-left: var(--sp-2xs);
  }

  /* 单元格内下拉箭头：与 .q-type-arrow 同字号同间距，作为下拉列的视觉提示 */
  .cell-caret {
    font-size: var(--fs-12);
    margin-left: var(--sp-2xs);
    color: var(--c-text-placeholder);
  }

  /* 原 .el-dropdown-menu .q-type-icon(scoped 进不去,永不匹配)
     已迁到 element-overrides.less 全局 — 见 bug #6 */

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

    &.is-double {
      grid-template-columns: repeat(2, 1fr);
      column-gap: var(--sp-3xl);
    }
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  /* .option-mark 由 global 提供;仅覆盖单选/多选切换的圆/方 */
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

    &:hover {
      border-color: var(--c-line);
    }

    &:focus {
      border-color: var(--c-primary);
      background: var(--c-panel);
    }
  }

  .option-score-input {
    flex-shrink: 0;
    width: 96px;

    /* 与 .option-input 视觉一致：透明底 + 悬浮显边框 + focus 主色 */
    :deep(.el-input__wrapper) {
      padding: 1px 8px;
      background: transparent;
      box-shadow: 0 0 0 1px transparent inset;
      border-radius: var(--radius-sm);
      transition: all var(--dur) var(--ease);
    }

    &:hover :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--c-line) inset;
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px var(--c-primary) inset;
      background: var(--c-panel);
    }

    :deep(.el-input__inner) {
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
  }

  .option-score-suffix {
    font-size: var(--fs-14);
    color: var(--c-text-secondary);
    margin-left: var(--sp-xs);
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
    background: var(--c-panel);
    border-radius: var(--radius-sm);
  }

  .link-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* link-clear 走全局 .btn-icon-ghost(覆盖中性色 → danger);此处仅恢复中性色,避免和 primary-bg 冲突 */
  .link-clear {
    color: var(--c-text-secondary);

    &:hover {
      color: var(--c-danger);
      background: transparent;
    }
  }

  /* 默认项标签 */
  .opt-default-tag {
    flex-shrink: 0;
    font-size: var(--fs-12);
    color: var(--c-primary);
    font-weight: 500;
  }

  /* .opt-set-default / .opt-link-btn 走全局 .btn-outline-dashed-primary;此处仅强制 flex-shrink:0 */

  /* option-del 走全局 .btn-icon-ghost */
  .option-del {
    color: var(--c-text-placeholder);
  }

  /* add-option 按钮走全局 .btn-text-primary,layout 通过 inline style 提供 margin-top */

  /* ---------- 其它题型预览 ---------- */
  .q-preview {
    /* 填空类默认拉满 q-body 宽度；采集类有各自固定宽度 */
    width: 100%;
  }

  /* .upload-box 走全局,无需额外样式 */

  /* 标签文本：标签 + 输入框,与单行文本一致的输入框样式 */
  .tag-input-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-xs);
    min-height: 32px;
    padding: 4px 11px;
    border: 1px solid var(--c-line-light);
    border-radius: var(--radius);
    background: var(--c-bg);
    transition: border-color var(--dur) var(--ease);
    box-sizing: border-box;

    &:hover {
      border-color: var(--c-text-placeholder);
    }

    &:focus-within {
      border-color: var(--c-primary);
    }
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

    &::placeholder {
      color: var(--c-text-placeholder);
    }
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

    &.is-full {
      color: var(--c-danger);
    }
  }

  /* ---------- 列表题 ---------- */
  .list-editor {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  /* 提示行：提示文字 + 列设置按钮同行（提示左、按钮右） */
  .list-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-sm);
  }

  .list-hint {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-12);
    color: var(--c-text-placeholder);
    line-height: var(--lh-tip);
  }

  .list-warn {
    margin-left: var(--sp-sm);
    color: var(--c-danger);
  }

  /* list-settings-btn 走全局 .btn-text-primary;此处仅补 flex-shrink:0 + gap */
  .list-settings-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-xs);
    flex-shrink: 0;
  }

  /* 「添加 1 行」预览：中性虚线整行按钮，编辑器内仅展示，不可交互 */
  .list-add-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-xs);
    width: 100%;
    margin-top: var(--sp-xs);
    padding: var(--sp-sm) var(--sp-md);
    font-size: var(--fs-13);
    color: var(--c-text-placeholder);
    background: transparent;
    border: 1px dashed var(--c-line);
    border-radius: var(--radius);
    cursor: default;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }

  /* 预览图：继承 global .table-preview,这里只补"可点击 → 主色 border"hover */
  .list-table-preview {
    cursor: pointer;
    transition: border-color var(--dur) var(--ease);

    &:hover {
      border-color: var(--c-primary);
    }
  }
}

/* ---------- 工具条容器 ---------- */
/* 走全局 .toolbar;此处无新增样式,标记 .q-tools 别名以便追踪 */
</style>