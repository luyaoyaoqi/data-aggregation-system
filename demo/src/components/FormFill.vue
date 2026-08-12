<script setup>
import { ref, computed } from "vue";
import { OPTION_TYPES } from "./ComponentLibrary.vue";
import { Plus } from "@element-plus/icons-vue";

/**
 * 填写端渲染组件 —— 共用于 PreviewDialog（开发者只读预览）和 PreviewStandalone（用户填写端）。
 *
 * 职责：
 *  - 渲染当前页所有题目（题干 + 选项/输入控件 + 说明）
 *  - 维护答题状态（answers + listRows）
 *  - 计算全局题目序号
 *
 * 不负责：
 *  - 容器 chrome（设备外壳 / 品牌 chrome）—— 由父组件决定
 *  - 分页切换按钮 —— 由父组件控制 currentPageIdx
 *  - 提交按钮 —— 由父组件调用 ref.getAnswers() 取答案
 */
const props = defineProps({
  /** 当前页对象 */
  page: { type: Object, default: null },
  /** 所有页（用于跨页序号计算） */
  pages: { type: [Array, Object], default: () => [] },
  /** 全局设置（showIndex / crossPage / crossCard） */
  settings: { type: Object, default: () => ({}) },
  /** 当前页索引（用于展示 "第 N / M 页"） */
  currentPageIdx: { type: Number, default: 0 },
  /** 是否只读（true = 开发者预览，所有输入禁用） */
  readonly: { type: Boolean, default: false },
  /** 是否展示页码 */
  showPageInfo: { type: Boolean, default: true },
  /** 是否展示当前页主题 */
  showTheme: { type: Boolean, default: true },
  /** 是否展示空态提示 */
  showEmptyTip: { type: Boolean, default: true },
});

const hasOptions = (type) => OPTION_TYPES.includes(type);

function exec(cmd, value) {
  document.execCommand(cmd, false, value);
}

/* -------------------- 答题数据 -------------------- */
const answers = ref({});
const listRows = ref({});
const tagInputs = ref({}); // tag 题的输入框临时值（按 q.id）
const imageInputs = ref({}); // image 题的隐藏 file input 引用（按 q.id）

function getAnswer(q) {
  return answers.value[q.id];
}
function setAnswer(q, v) {
  if (props.readonly) return;
  answers.value[q.id] = v;
}

/** 列表题行容器：首次进入时默认 2 行空对象 */
function ensureRows(q) {
  if (!listRows.value[q.id]) {
    listRows.value[q.id] = [{}, {}];
  }
  return listRows.value[q.id];
}

/** 列表列日期类型 → el-date-picker type（按 question.datePrecision 配置） */
function getDatePickerType(q) {
  switch (q.datePrecision) {
    case "y":
      return "year";
    case "ym":
      return "month";
    case "ymd":
      return "date";
    case "ymdhm":
      return "datetime";
    default:
      return "date";
  }
}

/** 列表列日期类型 → el-date-picker value-format */
function getDateFormat(q) {
  switch (q.datePrecision) {
    case "y":
      return "YYYY";
    case "ym":
      return "YYYY-MM";
    case "ymd":
      return "YYYY-MM-DD";
    case "ymdhm":
      return "YYYY-MM-DD HH:mm:ss";
    default:
      return "YYYY-MM-DD";
  }
}

function addListRow(q) {
  if (props.readonly) return;
  ensureRows(q).push({});
}

function removeListRow(q, idx) {
  if (props.readonly) return;
  const rows = ensureRows(q);
  if (rows.length <= 1) return;
  rows.splice(idx, 1);
}

/* -------------------- 图片题 -------------------- */
function getImages(q) {
  return Array.isArray(answers.value[q.id]) ? answers.value[q.id] : [];
}
function canUploadMore(q) {
  const max = q.maxImageCount || 9;
  return getImages(q).length < max;
}
function pickImage(q) {
  if (props.readonly) return;
  const el = imageInputs.value[q.id];
  if (el) el.click();
}
function onImagePicked(q, e) {
  if (props.readonly) return;
  const files = Array.from(e.target.files || []);
  const cur = [...getImages(q)];
  const max = q.maxImageCount || 9;
  const maxBytes = (q.maxImageSize || 5) * 1024 * 1024;
  for (const f of files) {
    if (cur.length >= max) {
      ElMessage.warning(`最多上传 ${max} 张图片`);
      break;
    }
    if (f.size > maxBytes) {
      ElMessage.warning(`「${f.name}」超过 ${q.maxImageSize || 5}MB，已跳过`);
      continue;
    }
    cur.push({
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
    });
  }
  answers.value[q.id] = cur;
  e.target.value = ""; // 允许重复选同一文件
}
function removeImage(q, idx) {
  if (props.readonly) return;
  const cur = [...getImages(q)];
  const removed = cur.splice(idx, 1)[0];
  if (removed?.url) URL.revokeObjectURL(removed.url);
  answers.value[q.id] = cur;
}

/* -------------------- 标签题 -------------------- */
function getTags(q) {
  return Array.isArray(answers.value[q.id]) ? answers.value[q.id] : [];
}
function addTag(q) {
  if (props.readonly) return;
  const raw = (tagInputs.value[q.id] || "").trim();
  if (!raw) return;
  // 多种分隔符：英文/中文逗号、分号、换行
  const items = raw
    .split(/[,，;；\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!items.length) {
    tagInputs.value[q.id] = "";
    return;
  }
  const cur = [...getTags(q)];
  let added = 0;
  let dupOrMax = 0;
  let overSized = 0;
  for (const v of items) {
    if (v.length > 40) {
      overSized++;
      continue;
    }
    if (q.maxTags != null && cur.length >= q.maxTags) {
      dupOrMax++;
      continue;
    }
    if (!q.allowDuplicate && cur.includes(v)) {
      dupOrMax++;
      continue;
    }
    cur.push(v);
    added++;
  }
  tagInputs.value[q.id] = "";
  answers.value[q.id] = cur;
  // 仅在全部失败时给提示；部分成功不打断
  if (added === 0) {
    if (overSized && !dupOrMax) {
      ElMessage.warning("单标签最多 40 字符");
    } else {
      const reasons = [];
      if (dupOrMax && q.maxTags != null) reasons.push("已达上限");
      if (dupOrMax && !q.allowDuplicate) reasons.push("禁止重复");
      ElMessage.warning(
        reasons.length ? reasons.join(" / ") : "未添加任何标签",
      );
    }
  }
}

/** 中文逗号 / 分号 也触发提交（避免中文输入法下 Enter 失效的情况） */
function handleTagKeydown(q, e) {
  // 中文输入法组合中不触发（避免拼音输入到一半被吞）
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === "," || e.key === "，" || e.key === ";" || e.key === "；") {
    e.preventDefault();
    addTag(q);
  }
}
function removeTag(q, idx) {
  if (props.readonly) return;
  const cur = [...getTags(q)];
  cur.splice(idx, 1);
  answers.value[q.id] = cur;
}

/* -------------------- 题目序号 -------------------- */
/**
 * 全局题目序号（按 form.settings 计算）
 * - showIndex=false → 序号整体不展示（模板里 v-if 控制）
 * - crossPage=true  → 全表单累计
 * - crossPage=false → 每页独立
 * - crossCard=true  → 页内卡片累计
 * - crossCard=false → 每张卡片独立
 *
 * settings 由父组件 PreviewStandalone.vue 透传 form.settings，禁止在 FormFill 内重复定义。
 */
const pagesArr = computed(() =>
  Array.isArray(props.pages) ? props.pages : [],
);

/**
 * 当前页需要渲染的 cards —— 过滤掉 questions 为空的 card。
 * 空 card 只渲染一个空容器（带边框）意义不大，反而显丑；
 * 整页为空时由 ff-empty-tip 提示，无需用空 card 占位。
 */
const visibleCards = computed(
  () => (props.page?.cards || []).filter((c) => c.questions.length > 0),
);

const questionIndexMap = computed(() => {
  const map = new Map();
  const s = props.settings || {};
  if (!s.showIndex) return map;
  let crossPageCounter = 0;
  for (let pIdx = 0; pIdx < pagesArr.value.length; pIdx++) {
    const page = pagesArr.value[pIdx];
    let cardCounter = 0;
    for (let cIdx = 0; cIdx < page.cards.length; cIdx++) {
      const card = page.cards[cIdx];
      if (!s.crossCard && cIdx > 0) cardCounter = 0;
      for (const q of card.questions) {
        const idx = s.crossPage ? crossPageCounter : cardCounter;
        map.set(q.id, idx + 1);
        crossPageCounter++;
        cardCounter++;
      }
    }
    if (!s.crossPage) crossPageCounter = 0;
  }
  return map;
});

/* -------------------- 父组件读答案 -------------------- */
defineExpose({
  getAnswers: () => ({
    answers: { ...answers.value },
    listRows: JSON.parse(JSON.stringify(listRows.value)),
  }),
});
</script>

<template>
  <div class="form-fill">
    <div class="ff-page-header">
      <p v-if="showTheme && page?.theme" class="ff-theme">
        {{ page.theme }}
      </p>
      <p v-if="showPageInfo && pagesArr.length > 1" class="ff-pageinfo">
        第 {{ currentPageIdx + 1 }} / {{ pagesArr.length }} 页
      </p>
    </div>

    <p
      v-if="
        showEmptyTip &&
        (!page ||
          page.cards.length === 0 ||
          page.cards.every((c) => c.questions.length === 0))
      "
      class="ff-empty-tip"
    >
      当前页还没有题目
    </p>

    <section
      v-for="card in visibleCards"
      :key="card.id"
      class="ff-card-group"
    >
      <p v-if="card.title" class="ff-card-title">{{ card.title }}</p>

      <div v-for="q in card.questions" :key="q.id" class="ff-q">
        <p class="ff-q-title">
          <span v-if="questionIndexMap.get(q.id)" class="ff-q-index"
            >{{ questionIndexMap.get(q.id) }}.</span
          >
          <span>{{ q.title || "未命名题目" }}</span>
          <span v-if="q.required" class="ff-q-required">*</span>
        </p>
        <p v-if="q.desc" class="ff-q-desc">{{ q.desc }}</p>

        <!-- 选项类：单选 / 多选 / 评分 -->
        <div
          v-if="hasOptions(q.type)"
          class="ff-options"
          :class="{ 'is-double': q.columns === 'double' }"
        >
          <el-radio-group
            v-if="q.type === 'radio' || q.type === 'radio-rate'"
            :model-value="getAnswer(q) || ''"
            @update:model-value="(v) => setAnswer(q, v)"
            :disabled="readonly"
            class="ff-hidden-group"
          >
            <el-radio
              v-for="opt in q.options"
              :key="opt.id"
              :value="opt.id"
              class="ff-option-input"
            >
              <span class="ff-option">
                <span
                  class="option-mark"
                  :class="q.type.startsWith('checkbox') ? 'is-square' : ''"
                />
                <span class="ff-option-label">{{
                  opt.linkType
                    ? opt.displayName || opt.linkData?.name
                    : opt.label
                }}</span>
                <span
                  v-if="q.type.endsWith('-rate') && opt.score != null"
                  class="ff-option-score"
                >
                  ({{ opt.score }} 分)
                </span>
              </span>
            </el-radio>
          </el-radio-group>

          <el-checkbox-group
            v-else
            :model-value="getAnswer(q) || []"
            @update:model-value="(v) => setAnswer(q, v)"
            :disabled="readonly"
            class="ff-hidden-group"
          >
            <el-checkbox
              v-for="opt in q.options"
              :key="opt.id"
              :value="opt.id"
              class="ff-option-input"
            >
              <span class="ff-option">
                <span class="option-mark is-square" />
                <span class="ff-option-label">{{
                  opt.linkType
                    ? opt.displayName || opt.linkData?.name
                    : opt.label
                }}</span>
                <span
                  v-if="q.type.endsWith('-rate') && opt.score != null"
                  class="ff-option-score"
                >
                  ({{ opt.score }} 分)
                </span>
              </span>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 填空 / 采集类 -->
        <template v-else>
          <el-input
            v-if="q.type === 'text'"
            :model-value="getAnswer(q) || ''"
            @update:model-value="(v) => setAnswer(q, v)"
            :placeholder="q.placeholder || '请输入'"
            :maxlength="q.maxLength || undefined"
            :disabled="readonly"
            class="ff-input"
          />

          <el-input
            v-else-if="q.type === 'textarea'"
            :model-value="getAnswer(q) || ''"
            @update:model-value="(v) => setAnswer(q, v)"
            type="textarea"
            :autosize="{ minRows: q.rows || 2, maxRows: 8 }"
            :placeholder="q.placeholder || '请输入'"
            :maxlength="q.maxLength || undefined"
            :disabled="readonly"
            class="ff-input"
          />

          <div v-else-if="q.type === 'number'" class="ff-input-wrap">
            <el-input-number
              :model-value="getAnswer(q) ?? null"
              @update:model-value="(v) => setAnswer(q, v)"
              :min="q.minValue ?? undefined"
              :max="q.maxValue ?? undefined"
              :precision="q.precision ?? 0"
              :placeholder="q.placeholder || '请输入数字'"
              controls-position="right"
              :disabled="readonly"
              class="ff-number-input"
            />
            <span v-if="q.unit" class="ff-suffix">{{ q.unit }}</span>
          </div>

          <el-date-picker
            v-else-if="q.type === 'datetime'"
            type="datetime"
            :model-value="getAnswer(q) || ''"
            @update:model-value="(v) => setAnswer(q, v)"
            :placeholder="q.placeholder || '请选择日期时间'"
            :disabled="readonly"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="ff-input ff-date-input"
            style="width: 100%"
          >
          </el-date-picker>

          <div v-else-if="q.type === 'image'" class="ff-image-list">
            <div
              v-for="(img, idx) in getImages(q)"
              :key="img.key"
              class="ff-image-thumb"
            >
              <img :src="img.url" :alt="img.name" />
              <button
                v-if="!readonly"
                type="button"
                class="ff-image-remove"
                title="移除"
                @click="removeImage(q, idx)"
              >
                ×
              </button>
            </div>
            <div v-if="canUploadMore(q)" class="ff-image-uploader">
              <div class="upload-box" role="button" @click="pickImage(q)">
                <el-icon><Plus /></el-icon>
                <span>上传图片</span>
              </div>
              <span class="ff-image-counter">
                {{ getImages(q).length }}/{{ q.maxImageCount || 9 }}
              </span>
            </div>
            <input
              :ref="
                (el) => {
                  if (el) imageInputs[q.id] = el;
                }
              "
              type="file"
              accept="image/*"
              multiple
              class="ff-file-hidden"
              @change="(e) => onImagePicked(q, e)"
            />
          </div>

          <div v-else-if="q.type === 'tag'" class="tag-input-wrap">
            <el-tag
              v-for="(t, i) in getTags(q)"
              :key="t + '_' + i"
              closable
              :disable-transitions="true"
              class="tag-chip"
              @close="removeTag(q, i)"
              >{{ t }}</el-tag
            >
            <input
              v-if="!readonly"
              v-model="tagInputs[q.id]"
              class="tag-input"
              :placeholder="
                getTags(q).length ? '' : q.placeholder || '输入后回车添加'
              "
              :maxlength="40"
              @keydown.enter.prevent="addTag(q)"
              @keydown="(e) => handleTagKeydown(q, e)"
              @blur="addTag(q)"
            />
            <span
              v-if="q.maxTags != null"
              class="tag-counter"
              :class="{ 'is-full': getTags(q).length >= q.maxTags }"
              >{{ getTags(q).length }} / {{ q.maxTags }}</span
            >
          </div>

          <div v-else-if="q.type === 'list'" class="ff-list-wrap">
            <div class="ff-list-scroll">
              <table class="table-preview">
                <thead>
                  <tr>
                    <th
                      v-for="col in q.listColumns || []"
                      :key="col.id"
                      :class="{ 'is-fixed': col.width != null }"
                      :style="
                        col.width != null ? { width: col.width + 'px' } : null
                      "
                    >
                      <span>{{ col.name }}</span>
                      <span v-if="col.required" class="table-preview__required"
                        >*</span
                      >
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rIdx) in ensureRows(q)" :key="rIdx">
                    <td
                      v-for="col in q.listColumns || []"
                      :key="col.id"
                      :class="{ 'is-fixed': col.width != null }"
                      :style="
                        col.width != null ? { width: col.width + 'px' } : null
                      "
                    >
                      <el-input
                        v-if="col.colType === 'text'"
                        :model-value="row[col.id] || ''"
                        @update:model-value="(v) => (row[col.id] = v)"
                        :placeholder="'输入'"
                        :disabled="readonly"
                        size="large"
                        class="ff-cell-el-input"
                      />
                      <el-input-number
                        v-else-if="col.colType === 'number'"
                        :model-value="row[col.id] ?? null"
                        @update:model-value="(v) => (row[col.id] = v)"
                        :min="q.minValue ?? undefined"
                        :max="q.maxValue ?? undefined"
                        :precision="q.precision ?? 0"
                        :placeholder="'数字'"
                        controls-position="right"
                        :disabled="readonly"
                        size="large"
                        class="ff-cell-el-input ff-cell-el-input-number"
                      />
                      <el-date-picker
                        v-else-if="col.colType === 'date'"
                        :model-value="row[col.id] || ''"
                        @update:model-value="(v) => (row[col.id] = v)"
                        :placeholder="'日期'"
                        :type="getDatePickerType(q)"
                        :value-format="getDateFormat(q)"
                        :disabled="readonly"
                        size="large"
                        class="ff-cell-el-input"
                      />
                      <el-select
                        v-else-if="col.colType === 'radio'"
                        :model-value="row[col.id] || ''"
                        @update:model-value="(v) => (row[col.id] = v)"
                        :disabled="readonly"
                        :placeholder="'单选'"
                        size="large"
                        class="ff-cell-el-select"
                      >
                        <el-option
                          v-for="opt in col.options || []"
                          :key="opt.id"
                          :label="opt.label"
                          :value="opt.id"
                        />
                      </el-select>
                      <el-select
                        v-else-if="col.colType === 'checkbox'"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        :model-value="
                          Array.isArray(row[col.id]) ? row[col.id] : []
                        "
                        @update:model-value="(v) => (row[col.id] = v)"
                        :disabled="readonly"
                        :placeholder="'多选'"
                        size="large"
                        class="ff-cell-el-select"
                      >
                        <el-option
                          v-for="opt in col.options || []"
                          :key="opt.id"
                          :label="opt.label"
                          :value="opt.id"
                        />
                      </el-select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              v-if="!readonly"
              type="button"
              class="btn-dashed-full ff-list-add-row"
              @click="addListRow(q)"
            >
              + 添加一行
            </button>
          </div>

          <div v-else-if="q.type === 'richtext'" class="rte">
            <div class="rte__toolbar">
              <button
                type="button"
                class="rte__btn"
                @mousedown.prevent
                @click="exec('bold')"
              >
                B
              </button>
              <button
                type="button"
                class="rte__btn is-italic"
                @mousedown.prevent
                @click="exec('italic')"
              >
                /
              </button>
              <button
                type="button"
                class="rte__btn is-blue"
                @mousedown.prevent
                @click="exec('foreColor', '#2563EB')"
              >
                蓝
              </button>
              <button
                type="button"
                class="rte__btn is-red"
                @mousedown.prevent
                @click="exec('foreColor', '#dc2626')"
              >
                红
              </button>
              <button
                type="button"
                class="rte__btn is-list"
                @mousedown.prevent
                @click="exec('insertUnorderedList')"
              >
                <span class="rte__dot" />列表
              </button>
            </div>
            <div
              class="rte__area"
              :contenteditable="!readonly"
              data-ph="请输入内容（支持加粗、颜色等）"
              @input="(e) => setAnswer(q, e.target.innerHTML)"
              v-html="getAnswer(q) || ''"
            />
          </div>

          <el-input
            v-else
            :model-value="getAnswer(q) || ''"
            @update:model-value="(v) => setAnswer(q, v)"
            placeholder="请输入内容"
            :disabled="readonly"
            class="ff-input"
          />
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
/* ============ 顶层 ============ */
.form-fill {
  display: flex;
  flex-direction: column;
}

/* ============ 顶部：标题 + 页码（左右布局） ============ */
.ff-page-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-md);
  margin: 0 var(--sp-2xs) var(--sp-lg);
}

.ff-pageinfo {
  margin: 0;
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.ff-theme {
  margin: 0;
  font-size: var(--fs-18);
  color: var(--c-text);
  line-height: 1.5;
  font-weight: 700;
}

.ff-empty-tip {
  margin: var(--sp-2xl) 0;
  text-align: center;
  font-size: var(--fs-14);
  color: var(--c-text-placeholder);
}

/* ============ 卡片分组（独立 panel） ============ */
/* 卡片容器：浅背景 + 边框 + 圆角 + 内边距，卡片之间留出视觉呼吸 */
.ff-card-group {
  padding: var(--sp-lg);
  margin-bottom: var(--sp-lg);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  transition:
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);

  &:last-child {
    margin-bottom: 0;
  }
}

/* 卡片标题：panel header，与下方题目用虚线分隔 */
.ff-card-title {
  margin: 0 0 var(--sp-md);
  padding-bottom: var(--sp-sm);
  font-size: var(--fs-16);
  font-weight: 600;
  color: var(--c-text-strong);
  border-bottom: 1px solid var(--c-line);
}

/* ============ 题目 ============ */
.ff-q {
  &:not(:last-child) {
    margin-bottom: var(--sp-lg);
    padding-bottom: var(--sp-lg);
    border-bottom: 1px dashed var(--c-line);
  }
}

.ff-q-title {
  display: flex;
  align-items: baseline;
  gap: var(--sp-xs);
  margin: 0 0 var(--sp-sm);
  font-family: var(--ff-display);
  font-size: var(--fs-14);
  font-weight: 600;
  color: var(--c-text-strong);
  line-height: 1.5;
}

.ff-q-index {
  flex-shrink: 0;
  font-family: var(--ff-mono);
  font-size: var(--fs-14);
  font-weight: 500;
  color: var(--c-primary);
  font-variant-numeric: tabular-nums;
}

.ff-q-required {
  flex-shrink: 0;
  color: var(--c-danger);
}

.ff-q-desc {
  margin: 0 0 var(--sp-sm) var(--sp-lg);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  line-height: 1.5;
}

/* ============ 选项 ============ */
.ff-options {
  display: grid;
  gap: var(--sp-sm) var(--sp-xl);

  &.is-double {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .ff-options.is-double {
    grid-template-columns: 1fr;
  }
}

.ff-hidden-group {
  display: contents;
}

.ff-option-input {
  margin-right: 0;

  /* EP 默认 label 容器 —— 让它作为 flex 容器容纳自定义 .ff-option,
     不能 display:none,否则 slot 内容也会被隐藏(选项不可见的 bug 根因) */
  :deep(.el-radio__label),
  :deep(.el-checkbox__label) {
    display: flex;
    align-items: center;
    width: 100%;
    padding-left: 0;
    font-size: inherit;
  }

  /* EP 原生单选/多选圆点 —— 隐藏,用我们自定义的 .option-mark */
  :deep(.el-radio__input),
  :deep(.el-checkbox__input) {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  :deep(.el-radio__inner),
  :deep(.el-checkbox__inner) {
    display: none;
  }

  :deep(.el-radio),
  :deep(.el-checkbox) {
    display: block;
    width: 100%;
    height: auto;
    margin-right: 0;
    white-space: normal;
  }
}

.ff-option {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  width: 100%; // 撑满 grid 单元 + el-radio__label,避免 hover 背景只覆盖中间
  font-size: var(--fs-14);
  color: var(--c-text-regular);
  cursor: pointer;
  padding: var(--sp-xs) var(--sp-sm);
  border-radius: var(--radius);
  transition: background var(--dur) var(--ease);

  &:hover {
    background: var(--c-primary-bg);
  }
}

.ff-option-label {
  flex: 1;
  min-width: 0;
}

.ff-option-score {
  flex-shrink: 0;
  margin-left: auto;
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* 选中态 */
.ff-option-input.is-checked .ff-option {
  color: var(--c-primary);

  .option-mark {
    border-color: var(--c-primary);

    &::after {
      content: "";
      display: block;
      width: 8px;
      height: 8px;
      margin: 2px auto;
      background: var(--c-primary);
      border-radius: 50%;
    }

    &.is-square::after {
      border-radius: 2px;
    }
  }
}

/* ============ 输入 ============ */
/* 填空/采集类输入框 —— 占满行宽
   注意 .upload-box 排除,保留 global 的 96x96 小图标 */
.ff-input,
.ff-input-wrap,
.ff-list-wrap {
  width: 100%;
}

.ff-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);

  .ff-number-input {
    flex: 1;
  }

  .ff-suffix {
    flex-shrink: 0;
    font-size: var(--fs-14);
    color: var(--c-text-secondary);
  }
}

/* ============ 图片 ============ */
.ff-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-sm);
}

.ff-image-thumb {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--c-line);
  background: var(--c-fill);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.ff-image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dur) var(--ease);

  &:hover {
    background: var(--c-danger);
  }
}

.ff-image-counter {
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* 图片上传 wrapper：upload-box 和计数器一行展示（box 在左，计数器在右） */
.ff-image-uploader {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.ff-file-hidden {
  display: none;
}

/* ============ 列表（自增表格）========== */
.ff-list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);

  .ff-list-scroll {
    overflow-x: auto;
    border: 1px solid var(--c-line);
    border-radius: var(--radius);
  }

  .table-preview {
    display: table;
    width: 100%;
    /* 等宽分布：固定布局 + 第一行 th 设宽度；
       未设宽度的列平均分配剩余空间，宽度对齐 */
    table-layout: fixed;
    border-collapse: collapse;
    background: var(--c-panel);

    th,
    td {
      min-width: 0;
      font-size: var(--fs-14);
      border-right: 1px solid var(--c-line-light);
      border-bottom: 1px solid var(--c-line-light);
      white-space: nowrap;

      &:last-child {
        border-right: none;
      }
    }

    th {
      background: var(--c-fill);
      padding: var(--sp-sm) var(--sp-md);
      border-right: 1px solid var(--c-line);
      font-weight: 500;
      color: var(--c-text-strong);
    }

    td {
      padding: 0;
      color: var(--c-text-regular);
    }

    &__required {
      flex-shrink: 0;
      color: var(--c-danger);
    }
  }
}
:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) {
  display: none;
}

/* 列表单元格内的 EP 输入控件（el-input / el-input-number / el-date-picker / el-select）：
   全部去掉 EP 默认的边框/背景，让组件在表格单元格内视觉上接近原生 input；
   高度用 EP 默认（不强制 min-height），字号统一 13px */
:deep(.ff-cell-el-input),
:deep(.ff-cell-el-select) {
  /* 强制 100% 宽：覆盖 .el-date-editor.el-input { width: 220px } 等 EP 默认宽度 */
  width: 100% !important;
  max-width: 100%;

  /* 把 EP 在 root 上设的宽度变量清掉，避免内部组件继承撑大 */
  --el-date-editor-width: 100%;
  --el-input-width: 100%;

  /* 外层（自己 = .el-input / .el-date-editor / .el-select / .el-input-number）清掉边框 + 阴影 */
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;

  /* 内部 wrapper / 子按钮 / date-editor 也清掉
     （不同 EP 组件边框位置不同，分别覆盖） */
  .el-input__wrapper,
  .el-select__wrapper,
  .el-input-number,
  .el-input-number__increase,
  .el-input-number__decrease {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    padding-right: 15px !important;
  }

  /* 字号统一 13px（与表格其他单元格一致） */
  .el-input__inner,
  .el-input__placeholder,
  .el-select__placeholder {
    // font-size: var(--fs-13);
    // color: var(--c-text-placeholder);
  }

  /* 多选标签压缩时样式略小 */
  .el-select__tags-text {
    font-size: var(--fs-13);
  }

  /* 选中项字号一致 */
  .el-select__selected-item {
    font-size: var(--fs-13);
  }
}
</style>
