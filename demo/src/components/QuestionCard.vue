<script setup>
import { Close, CopyDocument, Delete, Link, Plus, Rank } from '@element-plus/icons-vue'
import { OPTION_TYPES, getTypeLabel, createOption } from './ComponentLibrary.vue'
import OptionLinkDialog from './OptionLinkDialog.vue'

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, default: 1 },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'remove', 'duplicate'])

const hasOptions = computed(() => OPTION_TYPES.includes(props.question.type))
const isRate = computed(() => props.question.type.endsWith('-rate'))
const isRadio = computed(
  () => props.question.type === 'radio' || props.question.type === 'radio-rate'
)
const typeLabel = computed(() => getTypeLabel(props.question.type))

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

/* -------------------- 删除题目二次确认 -------------------- */
async function handleRemove() {
  try {
    await ElMessageBox.confirm('确认删除该题目？', '提示', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  emit('remove', props.question.id)
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
                <el-icon class="link-clear" title="删除关联" @click.stop="clearLink(opt)">
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

            <span v-if="isRate" class="option-score">{{ i + 1 }} 分</span>

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
              @click.stop="setDefault(opt)"
            >
              设为默认
            </button>

            <!-- 关联按钮（仅 linkField 开启） -->
            <button
              v-if="question.linkField && !opt.linkType"
              type="button"
              class="opt-link-btn"
              @click.stop="openLinkDialog(opt)"
            >
              <el-icon><Link /></el-icon>
              <span>关联</span>
            </button>

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

      <button type="button" class="tool-btn is-danger" @click.stop="handleRemove">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </button>

      <template v-if="hasOptions">
        <span class="tool-divider" />
        <!-- 「设为默认选项」仅 radio / radio-rate 展示 -->
        <template v-if="showDefaultSwitch">
          <span class="tool-label">设为默认选项</span>
          <el-switch v-model="question.defaultOption" size="small" @click.stop />
        </template>
        <span class="tool-label">选项关联字段</span>
        <el-switch v-model="question.linkField" size="small" @click.stop />
      </template>
    </div>

    <!-- 选项关联字段弹窗 -->
    <OptionLinkDialog
      v-if="linkingOption"
      v-model="linkDialogVisible"
      :option="linkingOption"
      @confirm="handleLinkConfirm"
    />
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
  background: var(--c-fill);
}

.question-card.is-active {
  border-color: var(--c-primary);
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