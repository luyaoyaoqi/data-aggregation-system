<script setup>
/**
 * 列表（自增表格）列设置弹框
 * - 配置每一列的：列名 / 类型 / 必填 / 选项（仅 radio/checkbox）/ 列宽
 * - 支持新增 / 删除列（最多 20 列）
 */
import { ref, computed, watch, nextTick } from "vue";
import { Plus, Delete, Close, MoreFilled, Rank } from "@element-plus/icons-vue";
import {
  LIST_COL_TYPES,
  LIST_COL_DEFAULT_WIDTH,
  createListColumn,
  createOption,
} from "./ComponentLibrary.vue";

/** 列宽边界（与 handleSave 一致） */
const COL_WIDTH_MIN = 80;
const COL_WIDTH_MAX = 600;
/** 拖拽步长：吸附到 10 的整数倍 */
const COL_WIDTH_STEP = 10;

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  question: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

/** 弹框内的列副本（避免直接污染父级数据，确认后再回写） */
const draftCols = ref([]);
watch(
  () => [props.modelValue, props.question?.listColumns],
  ([v]) => {
    if (!v) return;
    // 弹框打开时深拷贝列定义
    draftCols.value = (props.question.listColumns || []).map((c) => ({
      ...c,
      options: (c.options || []).map((o) => ({ ...o })),
    }));
  },
  { immediate: true },
);

/** 列类型是否需要选项配置 */
function needOptions(colType) {
  return colType === "radio" || colType === "checkbox";
}

/** 切换列类型时同步 options 字段 */
function onColTypeChange(col) {
  if (needOptions(col.colType) && (!col.options || !col.options.length)) {
    col.options = [createOption(1)];
  } else if (!needOptions(col.colType)) {
    col.options = [];
  }
}

/** 新增列 */
function addCol() {
  if (draftCols.value.length >= 20) {
    ElMessage.warning("最多 20 列");
    return;
  }
  draftCols.value.push(createListColumn(draftCols.value.length + 1));
}

/** 删除列 */
function removeCol(idx) {
  if (draftCols.value.length <= 1) {
    ElMessage.warning("至少保留 1 列");
    return;
  }
  draftCols.value.splice(idx, 1);
}

/** 移动列：dir = -1 左移 / +1 右移（被下拉框「更多」菜单调用） */
function moveCol(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= draftCols.value.length) return;
  const [moved] = draftCols.value.splice(idx, 1);
  draftCols.value.splice(target, 0, moved);
}

/** col-row 「更多」下拉框命令 */
function handleRowMore(cmd, idx) {
  if (cmd === "left") moveCol(idx, -1);
  else if (cmd === "right") moveCol(idx, 1);
  else if (cmd === "delete") removeCol(idx);
}

/** 列内选项操作 */
function addOption(col) {
  if (col.options.length >= 20) {
    ElMessage.warning("每列最多 20 个选项");
    return;
  }
  col.options.push(createOption(col.options.length + 1));
}

function removeOption(col, idx) {
  col.options.splice(idx, 1);
}

/** 列名 input 校验：禁止为空，最长 20 字 */
function onColNameBlur(col) {
  const v = (col.name || "").trim();
  if (!v) {
    ElMessage.warning("列名不能为空");
    col.name = "未命名列";
  } else if (v.length > 20) {
    ElMessage.warning("列名最多 20 字");
    col.name = v.slice(0, 20);
  } else {
    col.name = v;
  }
}

/** 关闭（取消） */
function handleClose() {
  visible.value = false;
}

/** 确定：回写到父级 question.listColumns */
function handleConfirm() {
  // 校验所有列名
  for (const c of draftCols.value) {
    const n = (c.name || "").trim();
    if (!n) {
      ElMessage.warning("存在空列名，请检查");
      return;
    }
    if (n.length > 20) {
      ElMessage.warning(`列名「${n}」超过 20 字`);
      return;
    }
  }
  props.question.listColumns = draftCols.value.map((c) => ({
    ...c,
    name: c.name.trim(),
    options: (c.options || []).map((o) => ({ ...o })),
  }));
  ElMessage.success("列配置已更新");
  visible.value = false;
}

/** 列宽快捷档位 */
const WIDTH_PRESETS = [120, 160, 200, 240, 300];

/* -------------------- 列宽拖拽调节 -------------------- */
/** 拖拽状态：{ idx, startX, startWidth } */
const resizeState = ref(null);
/** 拖拽条容器 ref（用来测实际宽度） */
const widthBarsRef = ref(null);
/** 每个 bar 的 ref（用于重排时计算鼠标位置） */
const widthBarRefs = ref([]);

/**
 * 计算 idx 这一列在「当前没有固定宽度」的情况下应该占的等分宽度
 * = (容器宽 - 其它固定列总宽) / 自动列数
 */
function computeAutoWidth(idx, containerWidth) {
  const cols = draftCols.value;
  const fixedTotal = cols.reduce(
    (s, c, i) => s + (c.width != null ? c.width : 0),
    0,
  );
  const autoCount = cols.filter((c) => c.width == null).length;
  if (autoCount <= 0) return COL_WIDTH_MIN;
  const remain = containerWidth - fixedTotal;
  return Math.max(COL_WIDTH_MIN, Math.floor(remain / autoCount));
}

/** 鼠标按下：开始拖拽 */
function startResize(e, idx) {
  e.preventDefault();
  e.stopPropagation();
  const col = draftCols.value[idx];
  // 测一下当前预览条的实际宽度，用于自动列的起始等分值
  const containerWidth = widthBarsRef.value?.clientWidth || 0;
  const startWidth =
    col.width != null ? col.width : computeAutoWidth(idx, containerWidth);
  resizeState.value = {
    idx,
    startX: e.clientX,
    startWidth,
  };
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  window.addEventListener("mousemove", onResizeMove);
  window.addEventListener("mouseup", onResizeEnd);
}

/** 拖拽中：实时更新列宽（吸附到 10、夹紧到 80-600） */
function onResizeMove(e) {
  if (!resizeState.value) return;
  const dx = e.clientX - resizeState.value.startX;
  const next = Math.max(
    COL_WIDTH_MIN,
    Math.min(COL_WIDTH_MAX, resizeState.value.startWidth + dx),
  );
  const snapped = Math.round(next / COL_WIDTH_STEP) * COL_WIDTH_STEP;
  const col = draftCols.value[resizeState.value.idx];
  if (col) col.width = snapped;
}

/** 拖拽结束：清理监听 */
function onResizeEnd() {
  resizeState.value = null;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  window.removeEventListener("mousemove", onResizeMove);
  window.removeEventListener("mouseup", onResizeEnd);
}

/** 列宽输入框手动调整：清空则回到「自动撑满」 */
function clampColWidth(col) {
  if (col.width == null || Number.isNaN(col.width)) {
    col.width = null;
    return;
  }
  const v = Math.round(col.width / COL_WIDTH_STEP) * COL_WIDTH_STEP;
  col.width = Math.max(COL_WIDTH_MIN, Math.min(COL_WIDTH_MAX, v));
}

/* -------------------- 列重排拖拽（仅在 bar 左侧手柄上触发） -------------------- */
/** 拖拽重排状态：{ fromIdx, overIdx } */
const reorderState = ref(null);

/** 鼠标按下：开始重排拖拽 */
function startReorder(e, idx) {
  // 只在手柄触发，冒泡已由 e.stopPropagation 拦掉，避免与 width-handle 冲突
  e.preventDefault();
  e.stopPropagation();
  reorderState.value = { fromIdx: idx, overIdx: idx };
  document.body.style.cursor = "grabbing";
  document.body.style.userSelect = "none";
  window.addEventListener("mousemove", onReorderMove);
  window.addEventListener("mouseup", endReorder);
}

/** 拖拽中：根据鼠标 X 位置计算目标插入点 */
function onReorderMove(e) {
  if (!reorderState.value) return;
  const x = e.clientX;
  let target = reorderState.value.fromIdx;
  for (let i = 0; i < widthBarRefs.value.length; i++) {
    const el = widthBarRefs.value[i];
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    if (x < midX) {
      target = i;
      break;
    }
    target = i + 1;
  }
  target = Math.max(0, Math.min(draftCols.value.length, target));
  if (target !== reorderState.value.overIdx) {
    reorderState.value.overIdx = target;
  }
}

/** 拖拽结束：执行重排 */
function endReorder() {
  if (reorderState.value) {
    const { fromIdx, overIdx } = reorderState.value;
    // overIdx 是「插入位置」语义；转换为 splice 索引
    const insertAt = overIdx > fromIdx ? overIdx - 1 : overIdx;
    if (insertAt !== fromIdx) {
      const [moved] = draftCols.value.splice(fromIdx, 1);
      draftCols.value.splice(insertAt, 0, moved);
    }
  }
  reorderState.value = null;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  window.removeEventListener("mousemove", onReorderMove);
  window.removeEventListener("mouseup", endReorder);
}

/** 自动列样式（撑满剩余空间） */
function autoFlexStyle() {
  return { flex: "1 1 0", minWidth: COL_WIDTH_MIN + "px" };
}

/** 固定列样式（按宽度渲染） */
function fixedWidthStyle(width) {
  return { flex: `0 0 ${width}px`, width: width + "px" };
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="列设置"
    width="1000px"
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
        <span class="width-preview-tip">
          默认自动撑满；拖动列的右边缘可设为固定宽度（{{ COL_WIDTH_MIN }}-{{
            COL_WIDTH_MAX
          }}px）
        </span>
      </div>
      <div class="width-bars-scroll">
        <div ref="widthBarsRef" class="width-bars">
          <template v-for="(col, i) in draftCols" :key="col.id || i">
            <!-- 占位条：拖到「在当前 col 之前」插入。
                 排除「原地」(overIdx === fromIdx) 和「紧邻原位之后」(overIdx === fromIdx + 1)。 -->
            <div
              v-if="
                reorderState &&
                reorderState.overIdx === i &&
                i !== reorderState.fromIdx &&
                i !== reorderState.fromIdx + 1
              "
              class="width-bar-placeholder"
            />
            <div
              :ref="(el) => (widthBarRefs[i] = el)"
              class="width-bar"
              :class="{
                'is-auto': col.width == null,
                'is-fixed': col.width != null,
                // 仅标记「被拖的列」；目标插入位置已用 .width-bar-placeholder 占位条单独显示，不再叠加半透明
                'is-dragging': reorderState && reorderState.fromIdx === i,
              }"
              :style="
                col.width != null ? fixedWidthStyle(col.width) : autoFlexStyle()
              "
            >
              <el-icon
                class="width-bar-grip"
                title="拖动排序"
                @mousedown="(e) => startReorder(e, i)"
                ><Rank
              /></el-icon>
              <span class="width-bar-name" :title="col.name">{{
                col.name || `第${i + 1}列`
              }}</span>
              <span class="width-bar-px">
                {{ col.width != null ? `${col.width}px` : "自动" }}
              </span>
              <span
                class="width-bar-handle"
                :class="{ 'is-dragging': resizeState?.idx === i }"
                @mousedown="(e) => startResize(e, i)"
              />
            </div>
          </template>
          <!-- 占位条：拖到尾列后（overIdx === N）。同样排除「原地」与「紧邻原位之后」。 -->
          <div
            v-if="
              reorderState &&
              reorderState.overIdx === draftCols.length &&
              reorderState.overIdx !== reorderState.fromIdx &&
              reorderState.overIdx !== reorderState.fromIdx + 1
            "
            class="width-bar-placeholder"
          />
        </div>
      </div>
    </div>

    <div class="col-list">
      <div v-for="(col, i) in draftCols" :key="col.id || i" class="col-item">
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
            <el-checkbox v-model="col.required" class="col-required-checkbox"
              >必填</el-checkbox
            >
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
          <el-dropdown
            trigger="click"
            class="col-more"
            @command="(cmd) => handleRowMore(cmd, i)"
          >
            <el-icon class="col-more-icon" title="更多"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- 排序请用 bar 左侧的拖移图标；此处仅保留删除，避免与拖移功能重复 -->
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 选项：仅 radio / checkbox 列展示 -->
        <div v-if="needOptions(col.colType)" class="col-options">
          <p class="options-tip">
            配置该列的下拉选项（最多 20 项，每项最多 20 字）
          </p>
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
  padding: 2px 4px;
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  background: var(--c-panel);
}

.width-bars {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 36px;
}

.width-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0 var(--sp-sm);
  font-size: var(--fs-14);
  color: var(--c-text-regular);
  background: var(--c-fill);
  border-right: 1px solid var(--c-line);
  white-space: nowrap;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

/* 重排占位条：垂直方向的指示线。
 用 box-shadow 渲染（不占布局空间，与题目拖动占位条一致）：
 - 居中 3px 实色垂直线（offset-x:-1.5px, spread:1.5px → 阴影盒宽 3px，居中跨元素中线）
 - 居中 3px 模糊蓝色光晕（blur:6px, spread:1.5px） */
.width-bar-placeholder {
  flex-shrink: 0;
  width: 0;
  align-self: stretch;
  pointer-events: none;
  box-shadow:
    -1.5px 0 0 1.5px var(--c-primary),
    -1.5px 0 6px 1.5px rgba(37, 99, 235, 0.45);
  z-index: 10;
}

/* 被拖动的 bar：主色高亮 + 虚线边框 + 漂浮阴影，区别于普通列 */
.width-bar.is-dragging {
  background: var(--c-primary-bg);
  color: var(--c-primary);
  border-right-color: var(--c-primary);
  /* 用 outline 而非 border，避免占据布局空间破坏 flex 等分 */
  outline: 1px dashed var(--c-primary);
  outline-offset: -1px;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.28);
  z-index: 10;
  border-radius: var(--radius-sm);
  pointer-events: none;
}

.width-bar.is-dragging .width-bar-grip {
  color: var(--c-primary);
}

.width-bar.is-dragging .width-bar-px {
  color: var(--c-primary);
  font-style: normal;
}

/* 自动列：撑满剩余空间，视觉上偏柔和 */
.width-bar.is-auto {
  background: transparent;
  color: var(--c-text-secondary);
  border-right-style: dashed;
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

.width-bar.is-auto .width-bar-px {
  color: var(--c-text-placeholder);
  font-style: italic;
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

/* 左侧拖拽手柄：整列重排（与表单题目卡 .q-drag 保持一致：box + hover 蓝底） */
.width-bar-grip {
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
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.width-bar-grip:hover {
  color: var(--c-primary);
  background: var(--c-primary-bg);
}

/* 拖动中：保持 move，cursor 由 body 全局锁定为 grabbing，避免反复切换 */

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
  gap: var(--sp-md);
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
  width: 240px;
  flex-shrink: 0;
}

.col-required {
  flex-shrink: 0;
  padding: 0 var(--sp-xs);
}

/* 与外边统一：checkbox 样式压小一点，匹配其它字段行高 */
.col-required-checkbox {
  height: 32px;
}

.col-required-checkbox :deep(.el-checkbox__label) {
  font-size: var(--fs-13);
  color: var(--c-text-regular);
}

.col-width-input {
  width: 120px;
  flex-shrink: 0;
}

/* 「更多」下拉框按钮（替代原删除按钮） */
.col-more {
  flex-shrink: 0;
}

.col-more-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  color: var(--c-text-secondary);
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.col-more-icon:hover {
  color: var(--c-primary);
  background: var(--c-primary-bg);
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
