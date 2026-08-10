<script setup>
import { ref, computed } from 'vue'
import { Cellphone, Monitor, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { OPTION_TYPES } from './ComponentLibrary.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  form: { type: Object, required: true },
  page: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

/** 预览端：mobile 手机 / desktop 电脑 */
const device = ref('mobile')

const allPages = computed(() => props.form.pages || [])

/**
 * 题目序号（按 form.settings 全局计算）
 * 与 Editor.questionIndexMap 逻辑保持一致：
 * - showIndex=false → null（不展示）
 * - crossPage=false → 每页从 1 开始
 * - crossCard=false → 每张卡片从 1 开始
 */
const questionIndexMap = computed(() => {
  const map = new Map()
  const s = props.form?.settings
  if (!s || !s.showIndex) return map
  let crossPageCounter = 0
  for (let pIdx = 0; pIdx < allPages.value.length; pIdx++) {
    const page = allPages.value[pIdx]
    let cardCounter = 0
    for (let cIdx = 0; cIdx < page.cards.length; cIdx++) {
      const card = page.cards[cIdx]
      if (!s.crossCard && cIdx > 0) cardCounter = 0
      for (const q of card.questions) {
        const idx = s.crossPage ? crossPageCounter : cardCounter
        map.set(q.id, idx + 1)
        crossPageCounter++
        cardCounter++
      }
    }
    if (!s.crossPage) crossPageCounter = 0
  }
  return map
})

/** 预览展示的当前页（>3 页时永远把当前页放在中间） */
const currentPageIdx = ref(0)

const currentPage = computed(() => allPages.value[currentPageIdx.value] || null)

const formTitle = computed(() => props.form.title || '未命名表单（草稿）')

const hasOptions = (type) => OPTION_TYPES.includes(type)

/** 富文本命令封装：按钮 mousedown.prevent 避免输入区失焦 */
function exec(cmd, value) {
  document.execCommand(cmd, false, value)
}

/**
 * >3 页时，可视区为 [currentIdx-1, currentIdx, currentIdx+1]（边界裁剪）
 * ≤3 页全部展示
 */
const visiblePageIdxs = computed(() => {
  const total = allPages.value.length
  if (total <= 3) return allPages.value.map((_, i) => i)
  const center = currentPageIdx.value
  let start = Math.max(0, center - 1)
  let end = Math.min(total - 1, center + 1)
  // 始终保持 3 个：边界裁剪后从另一侧补齐
  while (end - start < 2) {
    if (start > 0) start--
    else if (end < total - 1) end++
    else break
  }
  const arr = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

function changePage(idx) {
  if (idx < 0 || idx >= allPages.value.length) return
  currentPageIdx.value = idx
}

const isFirstPage = computed(() => currentPageIdx.value <= 0)
const isLastPage = computed(
  () => currentPageIdx.value >= allPages.value.length - 1
)

function goPrev() {
  if (!isFirstPage.value) changePage(currentPageIdx.value - 1)
}

function goNext() {
  if (!isLastPage.value) changePage(currentPageIdx.value + 1)
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :width="1000"
    align-center
    class="preview-dialog"
    append-to-body
    @open="currentPageIdx = (allPages.findIndex((p) => p.id === page?.id)) || 0"
  >
    <template #header>
      <div class="preview-header">
        <el-radio-group v-model="device" size="default">
          <el-radio-button value="mobile">
            <el-icon><Cellphone /></el-icon>
            <span>手机</span>
          </el-radio-button>
          <el-radio-button value="desktop">
            <el-icon><Monitor /></el-icon>
            <span>电脑</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <div class="preview-stage">
      <div class="device-frame" :class="device === 'mobile' ? 'is-mobile' : 'is-desktop'">
        <div class="device-scroll">
          <h3 class="preview-title">{{ formTitle }}</h3>

          <!-- 页码：顶部展示当前进度 -->
          <p v-if="allPages.length > 1" class="preview-pageinfo">
            {{ currentPageIdx + 1 }} / {{ allPages.length }}
          </p>

          <!-- 当前页主题 -->
          <p v-if="currentPage && currentPage.theme" class="preview-theme">
            {{ currentPage.theme }}
          </p>

          <p
            v-if="!currentPage || currentPage.cards.length === 0 || currentPage.cards.every((c) => c.questions.length === 0)"
            class="preview-empty"
          >
            当前页还没有题目
          </p>

          <!-- 卡片分组 -->
          <section
            v-for="card in (currentPage ? currentPage.cards : [])"
            :key="card.id"
            class="preview-card"
          >
            <p v-if="card.title" class="preview-card-title">{{ card.title }}</p>

            <div v-for="q in card.questions" :key="q.id" class="preview-question">
              <p class="pq-title">
                <span v-if="questionIndexMap.get(q.id)">{{ questionIndexMap.get(q.id) }}. </span>{{ q.title || '未命名题目' }}
                <span v-if="q.required" class="pq-required">*</span>
              </p>
              <p v-if="q.desc" class="pq-desc">{{ q.desc }}</p>

              <!-- 选项类 -->
              <div
                v-if="hasOptions(q.type)"
                class="pq-options"
                :class="{ 'is-double': q.columns === 'double' }"
              >
                <label
                  v-for="opt in q.options"
                  :key="opt.id"
                  class="pq-option"
                  :class="{ 'is-default': opt.isDefault && (q.type === 'radio' || q.type === 'radio-rate') }"
                >
                  <span
                    class="pq-mark"
                    :class="q.type.startsWith('checkbox') ? 'is-square' : ''"
                  />
                  <span class="pq-label">{{ opt.linkType ? (opt.displayName || opt.linkData?.name) : opt.label }}</span>
                  <span
                    v-if="q.type.endsWith('-rate') && opt.score != null"
                    class="pq-score"
                  >
                    ({{ opt.score }}分)
                  </span>
                </label>
              </div>

              <!-- 填空 / 采集类 -->
              <template v-else>
                <!-- 填空类：默认值（> 占位提示） / 占位提示 / 限长提示 -->
                <div
                  v-if="q.type === 'text'"
                  class="pq-field"
                  :class="{ 'has-value': q.defaultValue }"
                >{{ q.defaultValue || q.placeholder || '请输入' }}</div>
                <div
                  v-else-if="q.type === 'textarea'"
                  class="pq-field is-area"
                  :class="{ 'has-value': q.defaultValue }"
                >{{ q.defaultValue || q.placeholder || '请输入' }}</div>
                <div
                  v-else-if="q.type === 'number'"
                  class="pq-field pq-number"
                  :class="{ 'has-value': q.defaultValue }"
                >
                  <span>{{ q.defaultValue || q.placeholder || '请输入数字' }}</span>
                  <span v-if="q.unit" class="pq-suffix">{{ q.unit }}</span>
                </div>
                <div
                  v-else-if="q.type === 'datetime'"
                  class="pq-field"
                  :class="{ 'has-value': q.defaultValue }"
                >{{ q.defaultValue || q.placeholder || '请选择日期时间' }}</div>
                <div v-else-if="q.type === 'image'" class="pq-upload">+ 上传图片</div>
                <div v-else-if="q.type === 'tag'" class="pq-tags">
                  <span v-if="q.tags && q.tags.length" v-for="t in q.tags" :key="t" class="pq-tag">{{ t }}</span>
                  <span v-else class="pq-tag is-placeholder">暂未添加标签</span>
                </div>
                <div v-else-if="q.type === 'list'" class="pq-list-wrap">
                  <div class="pq-list-scroll">
                    <table class="pq-list-table">
                      <thead>
                        <tr>
                          <th
                            v-for="col in (q.listColumns || [])"
                            :key="col.id"
                            :class="{ 'is-fixed': col.width != null }"
                            :style="col.width != null ? { width: col.width + 'px' } : null"
                          >
                            <span>{{ col.name }}</span>
                            <span v-if="col.required" class="pq-required">*</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            v-for="col in (q.listColumns || [])"
                            :key="col.id"
                            :class="{ 'is-fixed': col.width != null }"
                            :style="col.width != null ? { width: col.width + 'px' } : null"
                          >
                            <input
                              v-if="col.colType === 'text'"
                              class="pq-cell-input"
                              :placeholder="col.name"
                              readonly
                            />
                            <input
                              v-else-if="col.colType === 'number'"
                              class="pq-cell-input"
                              type="number"
                              placeholder="0"
                              readonly
                            />
                            <input
                              v-else-if="col.colType === 'date'"
                              class="pq-cell-input"
                              placeholder="年 - 月 - 日"
                              readonly
                            />
                            <div
                              v-else-if="col.colType === 'radio' || col.colType === 'checkbox'"
                              class="pq-cell-select"
                            >
                              <span class="pq-cell-placeholder">请选择</span>
                              <span class="pq-cell-arrow">▾</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button type="button" class="pq-list-add-row">+ 添加一行</button>
                </div>
                <div v-else-if="q.type === 'richtext'" class="pq-rte">
                  <div class="pq-rte-toolbar">
                    <button type="button" class="pq-rte-btn" @mousedown.prevent @click="exec('bold')">B</button>
                    <button type="button" class="pq-rte-btn is-italic" @mousedown.prevent @click="exec('italic')">/</button>
                    <button type="button" class="pq-rte-btn is-blue" @mousedown.prevent @click="exec('foreColor', '#2563EB')">蓝</button>
                    <button type="button" class="pq-rte-btn is-red" @mousedown.prevent @click="exec('foreColor', '#dc2626')">红</button>
                    <button type="button" class="pq-rte-btn is-list" @mousedown.prevent @click="exec('insertUnorderedList')"><span class="pq-rte-dot" />列表</button>
                  </div>
                  <div
                    class="pq-rte-area"
                    contenteditable="true"
                    data-ph="请输入内容（支持加粗、颜色等）"
                  />
                </div>
                <div v-else class="pq-field">请输入内容</div>
              </template>
            </div>
          </section>

          <div class="preview-footer">
            <!-- 分页切换：底部 Prev / Next，按需渲染 -->
            <div v-if="allPages.length > 1" class="preview-pager">
              <button
                v-if="!isFirstPage"
                type="button"
                class="preview-pager-btn"
                @click="goPrev"
              >
                <el-icon><ArrowLeft /></el-icon>
                <span>上一页</span>
              </button>
              <span v-else />

              <button
                v-if="!isLastPage"
                type="button"
                class="preview-pager-btn"
                @click="goNext"
              >
                <span>下一页</span>
                <el-icon><ArrowRight /></el-icon>
              </button>
              <button
                v-else-if="currentPage && currentPage.cards.some((c) => c.questions.length > 0)"
                type="button"
                class="pq-submit"
              >
                提交
              </button>
            </div>
            <button
              v-else-if="currentPage && currentPage.cards.some((c) => c.questions.length > 0)"
              type="button"
              class="pq-submit"
            >
              提交
            </button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style>
.preview-dialog {
  display: flex;
  flex-direction: column;
  height: 90%;
}

.preview-dialog .el-dialog__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: center;
  width: 100%;
}

.preview-header .el-radio-button__inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.preview-header .el-radio-button__inner .el-icon {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

.preview-stage {
  display: flex;
  justify-content: center;
  height: 100%;
  padding: var(--sp-lg);
  border-radius: var(--radius-lg);
  background: #eef1f6;
}

.device-frame {
  display: flex;
  flex-direction: column;
  background: var(--c-panel);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  overflow: hidden;
  transition: width 0.2s ease;
}

.device-frame.is-mobile {
  width: 375px;
  flex-shrink: 0;
}

.device-frame.is-desktop {
  width: 100%;
}

.device-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--sp-lg);
  display: flex;
  flex-direction: column;
}

/* ---------- 底部操作（提交 + 分页） ---------- */
.preview-footer {
  padding: var(--sp-lg);
  margin:var(--sp-lg) calc(-1 * var(--sp-lg)) calc(-1 * var(--sp-lg));
  border-top: 1px solid var(--c-line);
  position: sticky;
  bottom: calc(-1 * var(--sp-lg));
  background: #fff;
}

.preview-pageinfo {
  margin: 0 0 var(--sp-md);
  text-align: center;
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
}

.preview-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-md);
}

.preview-pager-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-xs) var(--sp-md);
  font-family: inherit;
  font-size: var(--fs-13);
  color: var(--c-text-regular);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.preview-pager-btn:hover:not(:disabled) {
  color: var(--c-primary);
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
}

.preview-pager-btn:disabled {
  color: var(--c-text-placeholder);
  background: var(--c-fill);
  cursor: not-allowed;
}

.preview-pager-info {
  font-family: var(--ff-mono);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
}

.preview-title {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-20);
  font-weight: 600;
  color: var(--c-text);
  text-align: center;
}

/* ---------- 页签 ---------- */
.page-tabs {
  display: flex;
  justify-content: center;
  gap: var(--sp-sm);
  margin-bottom: var(--sp-md);
}

.page-tab {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  background: var(--c-fill);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-tab:hover {
  color: var(--c-primary);
}

.page-tab.is-active {
  color: #fff;
  background: var(--c-primary);
  font-weight: 600;
}

.preview-theme {
  margin: 0 0 var(--sp-xl);
  font-size: var(--fs-14);
  color: var(--c-text-secondary);
  text-align: center;
}

.preview-empty {
  padding: var(--sp-2xl) 0;
  text-align: center;
  font-size: var(--fs-14);
  color: var(--c-text-placeholder);
}

/* ---------- 卡片分组 ---------- */
.preview-card {
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-fill);
  border-radius: var(--radius);
  flex: 1;
}

.preview-card-title {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-14);
  font-weight: 600;
  color: var(--c-text);
}

.preview-question {
  padding: var(--sp-md) 0;
  border-bottom: 1px solid var(--c-line-light);
}

.preview-card .preview-question:last-child {
  border-bottom: none;
}

.pq-title {
  margin: 0 0 var(--sp-sm);
  font-size: var(--fs-14);
  font-weight: 500;
  color: var(--c-text);
}

.pq-required {
  color: var(--c-danger);
}

.pq-desc {
  margin: 0 0 var(--sp-sm);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.pq-options {
  display: grid;
  gap: var(--sp-sm) var(--sp-3xl);
}

.pq-options.is-double {
  grid-template-columns: repeat(2, 1fr);
}

.pq-option {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  font-size: var(--fs-14);
  color: var(--c-text-regular);
}

.pq-label {
  flex: 1;
  min-width: 0;
}

.pq-score {
  margin-left: auto;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
}

.pq-option.is-default .pq-mark {
  border-color: var(--c-primary);
}

.pq-option.is-default .pq-mark::after {
  content: '';
  display: block;
  width: 8px;
  height: 8px;
  margin: 2px auto;
  background: var(--c-primary);
  border-radius: 50%;
}

.pq-option.is-default span:last-child {
  color: var(--c-primary);
}

.pq-mark {
  position: relative;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid var(--c-text-placeholder);
  border-radius: 50%;
}

.pq-mark.is-square {
  border-radius: 3px;
}

.pq-field {
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--fs-14);
  color: var(--c-text-placeholder);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
}

.pq-field.has-value {
  color: var(--c-text);
}

.pq-field.is-area {
  min-height: 64px;
}

/* ---------- 富文本（richtext）---------- */
.pq-rte {
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  background: var(--c-panel);
  transition: border-color 0.15s ease;
}

.pq-rte:focus-within {
  border-color: var(--c-primary);
}

.pq-rte-toolbar {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-xs) var(--sp-sm);
  border-bottom: 1px solid var(--c-line-light);
}

.pq-rte-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 var(--sp-xs);
  font-family: inherit;
  font-size: var(--fs-12);
  font-weight: 600;
  color: var(--c-text-regular);
  background: transparent;
  border: 1px solid var(--c-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pq-rte-btn:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
}

.pq-rte-btn.is-italic {
  font-style: italic;
  font-weight: 400;
}

.pq-rte-btn.is-blue {
  color: #2563EB;
}

.pq-rte-btn.is-blue:hover {
  color: #ffffff;
  background: #2563EB;
  border-color: #2563EB;
}

.pq-rte-btn.is-red {
  color: #dc2626;
}

.pq-rte-btn.is-red:hover {
  color: #ffffff;
  background: #dc2626;
  border-color: #dc2626;
}

.pq-rte-btn.is-list {
  font-weight: 400;
}

.pq-rte-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  margin-right: 4px;
  background: currentColor;
  border-radius: 50%;
}

.pq-rte-area {
  padding: var(--sp-sm) var(--sp-md);
  min-height: 64px;
  font-size: var(--fs-14);
  color: var(--c-text);
  outline: none;
}

.pq-rte-area:empty::before {
  content: attr(data-ph);
  color: var(--c-text-placeholder);
}

.pq-number {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-sm);
}

.pq-suffix {
  flex-shrink: 0;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.pq-upload {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  background: var(--c-panel);
  border: 1px dashed var(--c-line);
  border-radius: var(--radius);
}

.pq-tags {
  display: flex;
  gap: var(--sp-sm);
}

.pq-tag {
  padding: 2px var(--sp-sm);
  font-size: var(--fs-12);
  color: var(--c-text-regular);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius-sm);
}

.pq-tag.is-placeholder {
  color: var(--c-text-placeholder);
  border-style: dashed;
}

/* 列表（自增表格） */
.pq-list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.pq-list-scroll {
  overflow-x: auto;
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
}

.pq-list-table {
  width: 100%;
  min-width: max-content;
  border-collapse: collapse;
  background: var(--c-panel);
}

.pq-list-table th,
.pq-list-table td {
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--fs-13);
  border-right: 1px solid var(--c-line-light);
  border-bottom: 1px solid var(--c-line-light);
  vertical-align: middle;
}

.pq-list-table th:last-child,
.pq-list-table td:last-child {
  border-right: none;
}

/* 设置了 width 的列：固定宽度，不被内容撑开 */
.pq-list-table th.is-fixed,
.pq-list-table td.is-fixed {
  width: 0;
  /* width 由内联 style 给具体值；这里仅声明存在性，让浏览器尊重它 */
}

.pq-list-table tr:last-child td {
  border-bottom: none;
}

.pq-list-table th {
  font-weight: 500;
  color: var(--c-text);
  background: var(--c-fill);
  text-align: left;
  white-space: nowrap;
}

.pq-list-table th .pq-required {
  margin-left: 4px;
  color: var(--c-danger);
}

.pq-list-table td {
  color: var(--c-text-regular);
}

.pq-cell-input {
  width: 100%;
  min-width: 80px;
  height: 26px;
  font-family: inherit;
  font-size: var(--fs-13);
  color: var(--c-text-regular);
  background: transparent;
  border: none;
  outline: none;
}

.pq-cell-input::placeholder {
  color: var(--c-text-placeholder);
}

.pq-cell-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  font-size: var(--fs-13);
  color: var(--c-text-placeholder);
  cursor: not-allowed;
}

.pq-cell-arrow {
  margin-left: var(--sp-sm);
  font-size: 10px;
}

.pq-list-add-row {
  align-self: flex-start;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.pq-list-add-row:hover {
  color: var(--c-primary-hover);
}

.pq-submit {
  width: 100%;
  height: 32px;
  font-family: inherit;
  font-size: var(--fs-14);
  color: #fff;
  background: var(--c-primary);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
}
</style>