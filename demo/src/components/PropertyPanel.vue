<script setup>
import {
  TYPE_GROUPS,
  OPTION_TYPES,
  getTypeLabel,
  createOption
} from './ComponentLibrary.vue'

const props = defineProps({
  question: { type: Object, default: null }
})

const groups = TYPE_GROUPS
const hasOptions = computed(
  () => !!props.question && OPTION_TYPES.includes(props.question.type)
)
const isMultiSelect = computed(
  () =>
    !!props.question &&
    (props.question.type === 'checkbox' ||
      props.question.type === 'checkbox-rate')
)
/** 仅多选题 + 必填 时展示 最少/最多选择数 */
const showSelectLimit = computed(
  () => isMultiSelect.value && !!props.question?.required
)
/** 选项总数，用于限定输入框 max */
const optionCount = computed(() => props.question?.options?.length ?? 0)
const typeLabel = computed(() =>
  props.question ? getTypeLabel(props.question.type) : ''
)
const groupName = computed(() => {
  if (!props.question) return ''
  const g = TYPE_GROUPS.find((x) =>
    x.items.some((i) => i.type === props.question.type)
  )
  return g ? g.name : ''
})

// 在属性面板切换题型：切到选项类且尚无选项时补齐默认三项
watch(
  () => props.question?.type,
  (type) => {
    if (!type || !props.question) return
    if (OPTION_TYPES.includes(type) && props.question.options.length === 0) {
      props.question.options = [1, 2, 3].map((i) => createOption(i))
    }
  }
)
</script>

<template>
  <aside class="property-panel">
    <div class="panel-head">
      <template v-if="question">
        {{ groupName }} · {{ typeLabel }}
      </template>
      <template v-else>属性设置</template>
    </div>

    <div v-if="!question" class="panel-empty">
      <p>请先在中间区域选中一道题目</p>
    </div>

    <el-scrollbar v-else class="panel-body">
      <el-form label-position="top" class="panel-form">
        <!-- 题干/题型：中间编辑区已有，右侧隐藏，避免重复 -->

        <el-form-item label="题目说明（选填，填写者可见）">
          <el-input
            v-model="question.desc"
            type="textarea"
            :rows="3"
            resize="none"
            maxlength="40"
            show-word-limit
            placeholder="请输入题目说明"
          />
        </el-form-item>

        <el-form-item v-if="hasOptions" label="选项排列">
          <el-radio-group v-model="question.columns" size="small">
            <el-radio-button value="single">单列</el-radio-button>
            <el-radio-button value="double">双列</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div class="panel-section">
        <p class="section-title">属性</p>
        <div class="switch-row">
          <span class="switch-label">必填</span>
          <el-switch v-model="question.required" />
        </div>
        <div class="switch-row">
          <span class="switch-label">允许清空</span>
          <el-switch v-model="question.allowClear" />
        </div>
        <el-form
          v-if="showSelectLimit"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="最少选择数">
            <el-input-number
              v-model="question.minSelect"
              :min="1"
              :max="optionCount"
              placeholder="留空不限"
              class="w-full"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="最多选择数">
            <el-input-number
              v-model="question.maxSelect"
              :min="1"
              :max="optionCount"
              placeholder="留空不限"
              class="w-full"
              controls-position="right"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="panel-section">
        <p class="section-title">查询条件</p>
        <div class="switch-row">
          <span class="switch-label">设为查询条件</span>
          <el-switch v-model="question.asQuery" />
        </div>
        <el-form
          v-if="question.asQuery"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="查询形式">
            <el-select v-model="question.queryType" class="w-full">
              <el-option label="单选查询" value="single" />
              <el-option label="多选查询" value="multiple" />
            </el-select>
          </el-form-item>
        </el-form>
        <p class="section-tip">开启后该题目会出现在应用端数据的筛选栏</p>
      </div>

      <div class="panel-section">
        <p class="section-title">数据列表</p>
        <div class="switch-row">
          <span class="switch-label">在列表中显示</span>
          <el-switch v-model="question.showInList" />
        </div>
        <p class="section-tip">关闭后该题目仅在详情页展示</p>
      </div>
    </el-scrollbar>
  </aside>
</template>

<style scoped>
.property-panel {
  width: var(--w-property);
  flex-shrink: 0;
  height: 100%;
  background: var(--c-panel);
  border-left: 1px solid var(--c-line);
  display: flex;
  flex-direction: column;
}

.panel-head {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--sp-lg);
  font-size: var(--fs-14);
  font-weight: 600;
  color: var(--c-text);
  border-bottom: 1px solid var(--c-line-light);
}

.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
}

.panel-body {
  flex: 1;
  min-height: 0;
}

.panel-form {
  padding: var(--sp-lg) var(--sp-lg) 0;
}

.panel-section {
  padding: var(--sp-lg);
  border-top: 1px solid var(--c-line-light);
}

.section-title {
  margin: 0 0 var(--sp-md);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
}

.switch-label {
  font-size: var(--fs-14);
  color: var(--c-text-regular);
}

.section-tip {
  margin: var(--sp-sm) 0 0;
  font-size: var(--fs-12);
  color: var(--c-text-placeholder);
  line-height: 18px;
}

.section-form {
  margin-top: var(--sp-md);
}

.w-full {
  width: 100%;
}
</style>
