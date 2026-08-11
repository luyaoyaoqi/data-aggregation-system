<script setup>
/**
 * 列表（自增表格）列设置弹框
 * - 配置每一列的：列名 / 类型 / 必填 / 选项（仅 radio/checkbox）/ 列宽
 * - 支持新增 / 删除列（最多 20 列）
 */
import { ref, computed, watch, nextTick } from "vue";
import { Plus, Delete, Close, Rank } from "@element-plus/icons-vue";
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
/**
 * 每列的"输入文本"暂存 —— key = col.id
 * - 弹框打开时从 col.options 一次性快照
 * - el-input 用 v-model 绑这一项：用户每次按键只更新这里，**不联动** col.options
 * - handleConfirm 时才把字符串拆回 col.options 并写回 question.listColumns
 *
 * 目的：避免每次按键触发 col.options 重建 → getOptionsText 覆盖 el-input 的 :model-value，
 *       导致 `,` `;` ` ` 等字符被立即吞掉。
 */
const optionsTextMap = ref({});

watch(
  () => [props.modelValue, props.question?.listColumns],
  ([v]) => {
    if (!v) return;
    // 弹框打开时深拷贝列定义
    draftCols.value = (props.question.listColumns || []).map((c) => ({
      ...c,
      options: (c.options || []).map((o) => ({ ...o })),
    }));
    // 同步初始化每列的输入文本快照
    const map = {};
    for (const c of draftCols.value) {
      map[c.id] = (c.options || []).map((o) => o.label || "").join(";");
    }
    optionsTextMap.value = map;
  },
  { immediate: true },
);

/** 列类型是否需要选项配置 */
function needOptions(colType) {
  return colType === "radio" || colType === "checkbox";
}

/** 切换列类型时同步 options 与输入文本 */
function onColTypeChange(col) {
  if (needOptions(col.colType)) {
    if (!col.options || !col.options.length) {
      col.options = [createOption(1)];
    }
    // 把当前 options 同步到输入文本（覆盖可能残留的旧输入）
    optionsTextMap.value[col.id] = col.options
      .map((o) => o.label || "")
      .join(";");
  } else {
    col.options = [];
    optionsTextMap.value[col.id] = "";
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

/* -------------------- 列选项：单输入框 + 分号分隔 -------------------- */
/**
 * 分隔符：半角/全角分号 + 半角/全角逗号
 * - 兼容中文输入法在某些输入方案下把 ; 自动转成 ， 的情形
 * - 与 QuestionCard.commitTag 的多分隔符方案对齐
 */
const OPTION_SEP_RE = /[,，;；]+/;
/** 选项硬上限：最多 20 项，每项最多 20 字 */
const OPTION_MAX_COUNT = 20;
const OPTION_MAX_LEN = 20;

/**
 * 把 optionsTextMap 拆分为 col.options（仅在 handleConfirm 时执行一次）
 * - 保留原有 id / isDefault / linkType / linkData / displayName / score 字段
 * - 末尾或连续多个分隔符自动忽略（正则 + filter(Boolean) 双保险）
 * - 不做长度 / 项数截断，完全交给用户
 */
function commitOptionsText(col) {
  const text = optionsTextMap.value[col.id] ?? "";
  const items = text
    .split(OPTION_SEP_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  col.options = items.map((label, i) => {
    const prev = col.options?.[i];
    return {
      id: prev?.id ?? `o_${Date.now().toString(36)}_${i}`,
      label,
      isDefault: prev?.isDefault ?? false,
      linkType: prev?.linkType ?? null,
      linkData: prev?.linkData ?? null,
      displayName: prev?.displayName ?? "",
      score: prev?.score ?? null,
    };
  });
}

/** 实时计算当前输入文本可拆出的项数（用于计数器显示，不修改任何数据） */
function getOptionsCount(col) {
  const text = optionsTextMap.value[col.id];
  if (!text) return 0;
  return text.split(OPTION_SEP_RE).filter((s) => s.trim().length > 0).length;
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
  // 把每列的输入文本同步到 col.options（仅在确认时一次性拆分）
  for (const c of draftCols.value) {
    commitOptionsText(c);
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

/* -------------------- 列重排：左移 / 右移 -------------------- */
/** 列左移一格（与前一列交换），第一列禁用 */
function moveColLeft(idx) {
  if (idx <= 0) return;
  const [moved] = draftCols.value.splice(idx, 1);
  draftCols.value.splice(idx - 1, 0, moved);
}

/** 列右移一格（与后一列交换），最后一列禁用 */
function moveColRight(idx) {
  if (idx >= draftCols.value.length - 1) return;
  const [moved] = draftCols.value.splice(idx, 1);
  draftCols.value.splice(idx + 1, 0, moved);
}

/** 三点菜单命令分发 */
function handleColCommand(cmd, idx) {
  if (cmd === "left") moveColLeft(idx);
  else if (cmd === "right") moveColRight(idx);
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
    title="列表设置"
    width="1000px"
    align-center
    class="list-settings-dialog"
    @close="handleClose"
  >
    <!-- <p class="dialog-tip">
      备注：下拉单选和下拉多选，最多可添加 20 项，选项标题最多 20 字。
    </p> -->

    <!-- 列宽调节：拖动列的右边缘 -->
    <div class="width-preview">
      <div class="width-preview-head">
        <span class="width-preview-title">列表项目</span>
        <span class="width-preview-tip">
          默认自动撑满；拖动列的右边缘可设为固定宽度（{{ COL_WIDTH_MIN }}-{{
            COL_WIDTH_MAX
          }}px）
        </span>
      </div>
      <div class="width-bars-scroll">
        <div ref="widthBarsRef" class="width-bars">
          <template v-for="(col, i) in draftCols" :key="col.id || i">
            <div
              class="width-bar"
              :class="{
                'is-auto': col.width == null,
                'is-fixed': col.width != null,
                'is-dragging': resizeState?.idx === i,
              }"
              :style="
                col.width != null ? fixedWidthStyle(col.width) : autoFlexStyle()
              "
            >
              <el-dropdown
                trigger="click"
                class="col-more"
                @command="(cmd) => handleColCommand(cmd, i)"
              >
                <button
                  type="button"
                  class="col-more-btn"
                  title="列操作"
                  @mousedown.stop
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="3" r="1.4" />
                    <circle cx="8" cy="8" r="1.4" />
                    <circle cx="8" cy="13" r="1.4" />
                  </svg>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="left" :disabled="i === 0">
                      左移
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="right"
                      :disabled="i === draftCols.length - 1"
                    >
                      右移
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <span class="width-bar-name" :title="col.name">{{
                col.name || `第${i + 1}列`
              }}</span>
              <span class="width-bar-px">
                宽度-{{ col.width != null ? `${col.width}px` : "自动" }}
              </span>
              <span
                class="width-bar-handle"
                :class="{ 'is-dragging': resizeState?.idx === i }"
                @mousedown="(e) => startResize(e, i)"
              />
            </div>
          </template>
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
          <el-checkbox v-model="col.required" size="small">必填</el-checkbox>
          <!-- <el-input-number
            v-model="col.width"
            :min="80"
            :max="600"
            :step="10"
            controls-position="right"
            class="col-width-input"
            placeholder="宽度"
            @change="clampColWidth(col)"
          /> -->
          <button
            type="button"
            class="tool-btn is-danger"
            @click="removeCol(i)"
          >
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </button>
        </div>

        <!-- 选项：仅 radio / checkbox 列展示 -->
        <div v-if="needOptions(col.colType)" class="col-options">
          <el-input
            v-model="optionsTextMap[col.id]"
            placeholder="请输入选项，用半角或全角分号、逗号分隔（如：选项1;选项2,选项3）"
            class="opt-text-input"
          />
          <p class="options-tip">
            <span class="opt-counter">
              {{ getOptionsCount(col) }}/{{ OPTION_MAX_COUNT }}
            </span>
            <span> 配置该列的下拉选项（用半角或全角分号、逗号分隔） </span>
          </p>
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

<style scoped lang="less">
.dialog-tip {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  line-height: var(--lh-tip);
}

/* ---------- 列宽调节可视化预览 ---------- */
.width-preview {
  margin-bottom: var(--sp-lg);

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
    padding: 0 var(--sp-xs);
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
      background var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease);

    /* 列宽拖动中的 bar：仅高亮，不影响布局 */
    &.is-dragging {
      background: var(--c-primary-bg);
      border-right-color: var(--c-primary);
    }

    /* 自动列：撑满剩余空间，视觉上偏柔和 */
    &.is-auto {
      background: transparent;
      color: var(--c-text-secondary);
      border-right-style: dashed;

      .width-bar-px {
        color: var(--c-text-placeholder);
        font-style: italic;
      }
    }

    // &:hover {
    //   background: var(--c-primary-bg);
    // }

    &:last-child {
      border-right: none;
    }

    /* 三点菜单按钮：替代旧 drag-grip，hover 时比 bar 自身背景略深 */
    .col-more-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      color: var(--c-text-placeholder);
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition:
        background var(--dur) var(--ease),
        color var(--dur) var(--ease);

      &:hover,
      &:focus-visible {
        background: var(--c-fill);
        color: var(--c-text-regular);
        outline: none;
      }
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
      font-size: var(--fs-11);
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
      transition: background var(--dur) var(--ease);

      &:hover,
      &.is-dragging {
        background: var(--c-primary);
        opacity: 0.5;
      }
    }
  }
}

/* ---------- 列清单 ---------- */
.col-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-height: 460px;
  overflow-y: auto;
  padding-right: var(--sp-xs);

  .col-item {
    padding: var(--sp-md);
    background: var(--c-fill);
    border-radius: var(--radius);
  }

  .col-row {
    display: flex;
    align-items: center;
    gap: var(--sp-lg);
  }

  /* 列序号 / 选项序号：相同字号 + 数字字体 + tabular-nums，合并规则 */
  .col-index,
  .opt-index {
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

  .col-width-input {
    width: 120px;
    flex-shrink: 0;
  }

  /* 列选项（单输入框 + 分号分隔） */
  .col-options {
    margin-top: var(--sp-md);
    padding-top: var(--sp-md);
    border-top: 1px dashed var(--c-line);
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .options-tip {
    flex-shrink: 0;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-12);
    color: var(--c-text-placeholder);
    display: flex;
    justify-content: space-between;
    .opt-counter {
      margin-left: var(--sp-xs);
    }
  }

  .opt-text-input {
    flex: 1;
    min-width: 0;
  }
}

/* 「添加列」:整行虚线描边按钮，与预览图「添加 1 行」一致 */
.col-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-xs);
  width: 100%;
  margin-top: var(--sp-md);
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--fs-13);
  font-family: inherit;
  color: var(--c-primary);
  background: transparent;
  border: 1px dashed var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);

  &:hover {
    color: var(--c-primary);
    border-color: var(--c-primary);
  }
}
</style>
