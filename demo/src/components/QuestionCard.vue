<script setup>
import { Close, CopyDocument, Delete, Plus, Rank } from '@element-plus/icons-vue'
import { OPTION_TYPES, getTypeLabel, createOption } from './ComponentLibrary.vue'

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, default: 1 },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'remove', 'duplicate'])

const hasOptions = computed(() => OPTION_TYPES.includes(props.question.type))
const isRate = computed(() => props.question.type.endsWith('-rate'))
const typeLabel = computed(() => getTypeLabel(props.question.type))

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
</script>

<template>
  <section
    class="question-card"
    :class="{ 'is-active': active }"
    @click="emit('select', question.id)"
  >
    <!-- 题干行 -->
    <div class="q-head">
      <el-icon class="q-drag" title="拖动排序"><Rank /></el-icon>
      <span class="q-index">{{ index }}.</span>
      <input
        v-model="question.title"
        class="q-title-input"
        placeholder="请输入题目标题"
      />
      <span v-if="question.required" class="q-required">*</span>
      <span class="q-type-tag">{{ typeLabel }}</span>
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
            <input v-model="opt.label" class="option-input" placeholder="请输入选项" />
            <span v-if="isRate" class="option-score">{{ i + 1 }} 分</span>
            <el-icon class="option-del" title="删除选项" @click.stop="removeOption(opt.id)">
              <Close />
            </el-icon>
          </div>
        </div>

        <button type="button" class="add-option" @click.stop="addOption">
          <el-icon><Plus /></el-icon>
          <span>添加选项</span>
        </button>
      </template>

      <!-- 填空 / 采集类 -->
      <template v-else>
        <div class="q-preview">
          <el-input
            v-if="question.type === 'text'"
            disabled
            placeholder="请输入内容"
          />
          <el-input
            v-else-if="question.type === 'textarea'"
            type="textarea"
            :rows="3"
            disabled
            placeholder="请输入内容"
          />
          <el-input
            v-else-if="question.type === 'number'"
            disabled
            placeholder="请输入数字"
          />
          <el-input
            v-else-if="question.type === 'datetime'"
            disabled
            placeholder="请选择日期时间"
          />
          <div v-else-if="question.type === 'image'" class="upload-box">
            <el-icon><Plus /></el-icon>
            <span>上传图片</span>
          </div>
          <div v-else-if="question.type === 'tag'" class="tag-row">
            <el-tag type="info" effect="plain">标签一</el-tag>
            <el-tag type="info" effect="plain">标签二</el-tag>
            <el-tag type="info" effect="plain">标签三</el-tag>
          </div>
          <div v-else-if="question.type === 'list'" class="list-box">
            <div class="list-row">列表项 1</div>
            <div class="list-row">列表项 2</div>
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
      <el-checkbox v-model="question.required" size="small" @click.stop>必填</el-checkbox>

      <button type="button" class="tool-btn" @click.stop="emit('duplicate', question.id)">
        <el-icon><CopyDocument /></el-icon>
        <span>复制</span>
      </button>

      <button type="button" class="tool-btn is-danger" @click.stop="emit('remove', question.id)">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </button>

      <template v-if="hasOptions">
        <span class="tool-divider" />
        <span class="tool-label">设为默认选项</span>
        <el-switch v-model="question.defaultOption" size="small" @click.stop />
        <span class="tool-label">选项关联字段</span>
        <el-switch v-model="question.linkField" size="small" @click.stop />
      </template>
    </div>
  </section>
</template>

<style scoped>
.question-card {
  padding: var(--sp-lg);
  background: var(--c-panel);
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.question-card:hover {
  background: #fafbfc;
}

.question-card.is-active {
  border-color: var(--c-primary);
  background: var(--c-panel);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

/* ---------- 题干 ---------- */
.q-head {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
}

.q-drag {
  color: var(--c-text-placeholder);
  cursor: grab;
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
  outline: none;
}

.q-title-input::placeholder {
  color: var(--c-text-placeholder);
}

.q-title-input:focus {
  border-bottom: 1px solid var(--c-primary);
}

.q-required {
  color: var(--c-danger);
  font-size: var(--fs-16);
  line-height: 1;
}

.q-type-tag {
  flex-shrink: 0;
  padding: 2px var(--sp-sm);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  background: var(--c-fill);
  border-radius: var(--radius-sm);
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

.option-score {
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
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
  max-width: 520px;
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
  gap: var(--sp-md);
  margin: var(--sp-lg) 0 0 28px;
  padding-top: var(--sp-md);
  border-top: 1px dashed var(--c-line-light);
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-text-regular);
  background: transparent;
  border: none;
  cursor: pointer;
}

.tool-btn:hover {
  color: var(--c-primary);
}

.tool-btn.is-danger:hover {
  color: var(--c-danger);
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
