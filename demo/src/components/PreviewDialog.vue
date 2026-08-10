<script setup>
import { ref, computed } from 'vue'
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

/** 预览展示的当前页（>3 页时永远把当前页放在中间） */
const currentPageIdx = ref(0)

const currentPage = computed(() => allPages.value[currentPageIdx.value] || null)

const formTitle = computed(() => props.form.title || '未命名表单（草稿）')

const hasOptions = (type) => OPTION_TYPES.includes(type)

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
</script>

<template>
  <el-dialog
    v-model="visible"
    title="查看数据"
    width="780px"
    align-center
    class="preview-dialog"
    @open="currentPageIdx = (allPages.findIndex((p) => p.id === page?.id)) || 0"
  >
    <div class="preview-toolbar">
      <el-radio-group v-model="device" size="default">
        <el-radio-button value="mobile">手机</el-radio-button>
        <el-radio-button value="desktop">电脑</el-radio-button>
      </el-radio-group>
    </div>

    <div class="preview-stage">
      <div class="device-frame" :class="device === 'mobile' ? 'is-mobile' : 'is-desktop'">
        <div class="device-scroll">
          <h3 class="preview-title">{{ formTitle }}</h3>

          <!-- 页签（>3 页只展示 3 页，当前页永远在中间） -->
          <div v-if="allPages.length > 0" class="page-tabs">
            <button
              v-for="idx in visiblePageIdxs"
              :key="allPages[idx].id"
              type="button"
              class="page-tab"
              :class="{ 'is-active': idx === currentPageIdx }"
              @click="changePage(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>

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

            <div v-for="(q, i) in card.questions" :key="q.id" class="preview-question">
              <p class="pq-title">
                {{ i + 1 }}. {{ q.title || '未命名题目' }}
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
                            :style="{ minWidth: col.width + 'px' }"
                          >
                            <span>{{ col.name }}</span>
                            <span v-if="col.required" class="pq-required">*</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td v-for="col in (q.listColumns || [])" :key="col.id">
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
                <div v-else-if="q.type === 'richtext'" class="pq-field is-area">
                  请输入内容（支持加粗、颜色等）
                </div>
                <div v-else class="pq-field">请输入内容</div>
              </template>
            </div>
          </section>

          <button
            v-if="currentPage && currentPage.cards.some((c) => c.questions.length > 0)"
            type="button"
            class="pq-submit"
          >
            提交
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">返回编辑</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.preview-toolbar {
  display: flex;
  justify-content: center;
  margin-bottom: var(--sp-lg);
}

.preview-stage {
  display: flex;
  justify-content: center;
  padding: var(--sp-xl) 0;
  background: #eef1f6;
  border-radius: var(--radius);
}

.device-frame {
  background: var(--c-panel);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  overflow: hidden;
  transition: width 0.2s ease;
}

.device-frame.is-mobile {
  width: 375px;
}

.device-frame.is-desktop {
  width: 640px;
}

.device-scroll {
  max-height: 460px;
  overflow-y: auto;
  padding: var(--sp-xl);
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
  margin-bottom: var(--sp-lg);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-fill);
  border-radius: var(--radius);
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
  gap: var(--sp-sm);
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
  height: 40px;
  margin-top: var(--sp-xl);
  font-family: inherit;
  font-size: var(--fs-14);
  color: #fff;
  background: var(--c-primary);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
}
</style>