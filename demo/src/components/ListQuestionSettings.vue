<script setup>
/**
 * 列表（自增表格）列设置弹框
 * - 配置每一列的：列名 / 类型 / 必填 / 选项（仅 radio/checkbox）/ 列宽
 * - 支持新增 / 删除列（最多 20 列）
 */
import { ref, computed, watch } from 'vue'
import { Plus, Delete, Close } from '@element-plus/icons-vue'
import {
  LIST_COL_TYPES,
  LIST_COL_DEFAULT_WIDTH,
  createListColumn,
  createOption
} from './ComponentLibrary.vue'

/** 列宽边界（与 handleSave 一致） */
const COL_WIDTH_MIN = 80
const COL_WIDTH_MAX = 600
/** 拖拽步长：吸附到 10 的整数倍 */
const COL_WIDTH_STEP = 10

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  question: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

/** 弹框内的列副本（避免直接污染父级数据，确认后再回写） */
const draftCols = ref([])
watch(
  () => [props.modelValue, props.question?.listColumns],
  ([v]) => {
    if (!v) return
    // 弹框打开时深拷贝列定义
    draftCols.value = (props.question.listColumns || []).map((c) => ({
      ...c,
      options: (c.options || []).map((o) => ({ ...o }))
    }))
  },
  { immediate: true }
)

/** 列类型是否需要选项配置 */
function needOptions(colType) {
  return colType === 'radio' || colType === 'checkbox'
}

/** 切换列类型时同步 options 字段 */
function onColTypeChange(col) {
  if (needOptions(col.colType) && (!col.options || !col.options.length)) {
    col.options = [createOption(1)]
  } else if (!needOptions(col.colType)) {
    col.options = []
  }
}

/** 新增列 */
function addCol() {
  if (draftCols.value.length >= 20) {
    ElMessage.warning('最多 20 列')
    return
  }
  draftCols.value.push(createListColumn(draftCols.value.length + 1))
}

/** 删除列 */
function removeCol(idx) {
  if (draftCols.value.length <= 1) {
    ElMessage.warning('至少保留 1 列')
    return
  }
  draftCols.value.splice(idx, 1)
}

/** 列内选项操作 */
function addOption(col) {
  if (col.options.length >= 20) {
    ElMessage.warning('每列最多 20 个选项')
    return
  }
  col.options.push(createOption(col.options.length + 1))
}

function removeOption(col, idx) {
  col.options.splice(idx, 1)
}

/** 列名 input 校验：禁止为空，最长 20 字 */
function onColNameBlur(col) {
  const v = (col.name || '').trim()
  if (!v) {
    ElMessage.warning('列名不能为空')
    col.name = '未命名列'
  } else if (v.length > 20) {
    ElMessage.warning('列名最多 20 字')
    col.name = v.slice(0, 20)
  } else {
    col.name = v
  }
}

/** 关闭（取消） */
function handleClose() {
  visible.value = false
}

/** 确定：回写到父级 question.listColumns */
function handleConfirm() {
  // 校验所有列名
  for (const c of draftCols.value) {
    const n = (c.name || '').trim()
    if (!n) {
      ElMessage.warning('存在空列名，请检查')
      return
    }
    if (n.length > 20) {
      ElMessage.warning(`列名「${n}」超过 20 字`)
      return
    }
  }
  props.question.listColumns = draftCols.value.map((c) => ({
    ...c,
    name: c.name.trim(),
    options: (c.options || []).map((o) => ({ ...o }))
  }))
  ElMessage.success('列配置已更新')
  visible.value = false
}

/** 列宽快捷档位 */
const WIDTH_PRESETS = [120, 160, 200, 240, 300]

/* -------------------- 列宽拖拽调节 -------------------- */
/** 拖拽状态：{ idx, startX, startWidth } */
const resizeState = ref(null)

/** 视觉预览条总宽度（用来给 scroll 容器兜底，避免列总宽过窄挤在一起） */
const previewTotalWidth = computed(() =>
  draftCols.value.reduce((s, c) => s + (c.width || LIST_COL_DEFAULT_WIDTH), 0)
)

/** 鼠标按下：开始拖拽 */
function startResize(e, idx) {
  e.preventDefault()
  e.stopPropagation()
  const col = draftCols.value[idx]
  resizeState.value = {
    idx,
    startX: e.clientX,
    startWidth: col.width || LIST_COL_DEFAULT_WIDTH
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

/** 拖拽中：实时更新列宽（吸附到 10、夹紧到 80-600） */
function onResizeMove(e) {
  if (!resizeState.value) return
  const dx = e.clientX - resizeState.value.startX
  const next = Math.max(
    COL_WIDTH_MIN,
    Math.min(COL_WIDTH_MAX, resizeState.value.startWidth + dx)
  )
  const snapped = Math.round(next / COL_WIDTH_STEP) * COL_WIDTH_STEP
  const col = draftCols.value[resizeState.value.idx]
  if (col) col.width = snapped
}

/** 拖拽结束：清理监听 */
function onResizeEnd() {
  resizeState.value = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}

/** 列宽输入框手动调整时也走夹紧逻辑 */
function clampColWidth(col) {
  if (col.width == null || Number.isNaN(col.width)) {
    col.width = LIST_COL_DEFAULT_WIDTH
    return
  }
  const v = Math.round(col.width / COL_WIDTH_STEP) * COL_WIDTH_STEP
  col.width = Math.max(COL_WIDTH_MIN, Math.min(COL_WIDTH_MAX, v))
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="列设置"
    width="960px"
    align-center
    class="list-settings-dialog"
    @close="handleClose"
  >
    <p class="dialog-tip">
      备注：下拉单选和下拉多选，最多可添加 20 项，选项标题最多 20 字。
    </p>

    <!-- 列宽调节：拖动列的右边缘 -->
    <div class="width-preview">
      <div class="width-preview-head">
        <span class="width-preview-title">列宽调节</span>
        <span class="width-preview-tip">拖动列的右边缘调节宽度（{{ COL_WIDTH_MIN }}-{{ COL_WIDTH_MAX }}px）</span>
      </div>
      <div class="width-bars-scroll">
        <div
          class="width-bars"
          :style="{ width: Math.max(previewTotalWidth, 320) + 'px' }"
        >
          <div
            v-for="(col, i) in draftCols"
            :key="col.id || i"
            class="width-bar"
            :style="{ width: col.width + 'px' }"
          >
            <span class="width-bar-name" :title="col.name">{{ col.name || `第${i + 1}列` }}</span>
            <span class="width-bar-px">{{ col.width }}px</span>
            <span
              class="width-bar-handle"
              :class="{ 'is-dragging': resizeState?.idx === i }"
              @mousedown="(e) => startResize(e, i)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="col-list">
      <div
        v-for="(col, i) in draftCols"
        :key="col.id || i"
        class="col-item"
      >
        <div class="col-row">
          <span class="col-index">{{ i + 1 }}</span>
          <el-input
            v-model="col.name"
            :maxlength="20"
            show-word-limit
            placeholder="请输入列名"
            class="col-name-input"
            @blur="onColNameBlur(col)"
          />
          <el-select
            v-model="col.colType"
            class="col-type-select"
            @change="onColTypeChange(col)"
          >
            <el-option
              v-for="t in LIST_COL_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
          <div class="col-required">
            <span class="col-required-label">必填</span>
            <el-switch v-model="col.required" size="small" />
          </div>
          <el-input-number
            v-model="col.width"
            :min="80"
            :max="600"
            :step="10"
            controls-position="right"
            class="col-width-input"
            placeholder="宽度"
            @change="clampColWidth(col)"
          />
          <button
            type="button"
            class="col-del"
            title="删除该列"
            @click="removeCol(i)"
          >
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <!-- 选项：仅 radio / checkbox 列展示 -->
        <div v-if="needOptions(col.colType)" class="col-options">
          <p class="options-tip">配置该列的下拉选项（最多 20 项，每项最多 20 字）</p>
          <div
            v-for="(opt, oi) in col.options"
            :key="opt.id || oi"
            class="opt-row"
          >
            <span class="opt-index">{{ oi + 1 }}.</span>
            <el-input
              v-model="opt.label"
              :maxlength="20"
              show-word-limit
              placeholder="请输入选项文字"
              class="opt-name-input"
            />
            <button
              v-if="col.options.length > 1"
              type="button"
              class="opt-del"
              title="删除选项"
              @click="removeOption(col, oi)"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>
          <button
            v-if="col.options.length < 20"
            type="button"
            class="opt-add"
            @click="addOption(col)"
          >
            <el-icon><Plus /></el-icon>
            <span>添加选项</span>
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="draftCols.length < 20"
      type="button"
      class="col-add"
      @click="addCol"
    >
      <el-icon><Plus /></el-icon>
      <span>添加列</span>
    </button>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-tip {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  line-height: 18px;
}

/* ---------- 列宽调节可视化预览 ---------- */
.width-preview {
  margin-bottom: var(--sp-lg);
}

.width-preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-sm);
  margin-bottom: var(--sp-sm);
}

.width-preview-title {
  font-size: var(--fs-13);
  font-weight: 500;
  color: var(--c-text);
}

.width-preview-tip {
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
}

.width-bars-scroll {
  overflow-x: auto;
  padding: 2px;
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  background: var(--c-panel);
}

.width-bars {
  display: flex;
  align-items: stretch;
  min-height: 36px;
}

.width-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  flex-shrink: 0;
  padding: 0 var(--sp-sm);
  font-size: var(--fs-12);
  color: var(--c-text-regular);
  background: var(--c-fill);
  border-right: 1px solid var(--c-line);
  /* 关闭 overflow:hidden，让右侧的拖拽手柄（right: -3px）能溢出可见 */
  white-space: nowrap;
  transition: background 0.15s ease;
}

.width-bar:hover {
  background: var(--c-primary-bg);
}

.width-bar:last-child {
  border-right: none;
}

.width-bar-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.width-bar-px {
  flex-shrink: 0;
  font-family: var(--ff-mono);
  font-size: 11px;
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
}

.width-bar-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
  transition: background 0.15s ease;
}

.width-bar-handle:hover,
.width-bar-handle.is-dragging {
  background: var(--c-primary);
  opacity: 0.5;
}

.col-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-height: 460px;
  overflow-y: auto;
  padding-right: var(--sp-xs);
}

.col-item {
  padding: var(--sp-md);
  background: var(--c-fill);
  border-radius: var(--radius);
}

.col-row {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.col-index {
  flex-shrink: 0;
  width: 22px;
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.col-name-input {
  flex: 1;
  min-width: 120px;
}

.col-type-select {
  width: 140px;
  flex-shrink: 0;
}

.col-required {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  flex-shrink: 0;
  padding: 0 var(--sp-xs);
}

.col-required-label {
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.col-width-input {
  width: 120px;
  flex-shrink: 0;
}

.col-del {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  color: var(--c-text-placeholder);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.col-del:hover {
  color: var(--c-danger);
  background: #fef2f2;
}

/* 列选项 */
.col-options {
  margin-top: var(--sp-md);
  padding-top: var(--sp-md);
  border-top: 1px dashed var(--c-line);
}

.options-tip {
  margin: 0 0 var(--sp-sm);
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
}

.opt-row {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  margin-bottom: var(--sp-sm);
}

.opt-index {
  flex-shrink: 0;
  width: 22px;
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.opt-name-input {
  flex: 1;
  min-width: 0;
}

.opt-del {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  color: var(--c-text-placeholder);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.opt-del:hover {
  color: var(--c-danger);
  background: #fef2f2;
}

.opt-add,
.col-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.opt-add:hover,
.col-add:hover {
  color: var(--c-primary-hover);
}

.col-add {
  margin-top: var(--sp-md);
  font-size: var(--fs-13);
}
</style>