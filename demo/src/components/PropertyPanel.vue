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
/** 单选 / 单选打分：单选才有"清空已选项"的概念 */
const isRadioLike = computed(
  () =>
    !!props.question &&
    (props.question.type === 'radio' || props.question.type === 'radio-rate')
)
/** 单行文本 */
const isText = computed(() => !!props.question && props.question.type === 'text')
/** 多行文本 */
const isTextarea = computed(
  () => !!props.question && props.question.type === 'textarea'
)
/** 数字 */
const isNumber = computed(
  () => !!props.question && props.question.type === 'number'
)
/** 日期时间 */
const isDatetime = computed(
  () => !!props.question && props.question.type === 'datetime'
)
/** 图片 */
const isImage = computed(
  () => !!props.question && props.question.type === 'image'
)
/** 标签文本 */
const isTag = computed(
  () => !!props.question && props.question.type === 'tag'
)
/** 多选 / 多选打分 常驻展示「最少/最多选择数」配置项；仅当 required 时校验拦截 */
const showSelectLimit = computed(() => isMultiSelect.value)
/** 属性 section 是否展示：至少有一个属性子项可见 */
const hasPropertySection = computed(
  () =>
    isRadioLike.value ||
    showSelectLimit.value ||
    isText.value ||
    isTextarea.value ||
    isNumber.value ||
    isDatetime.value ||
    isImage.value ||
    isTag.value
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
      const withScore = type.endsWith('-rate')
      props.question.options = [1, 2, 3].map((i) => createOption(i, { withScore }))
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

      <div v-if="hasPropertySection" class="panel-section">
        <p class="section-title">属性</p>
        <!-- 必填：中间工具栏已有，右侧不再展示 -->
        <div v-if="isRadioLike" class="row switch-row">
          <span class="row-label switch-label">允许清空</span>
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
        <!-- 单行文本：占位提示 / 默认值 / 最大长度 / 格式校验 -->
        <el-form
          v-if="isText"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="占位提示">
            <el-input
              v-model="question.placeholder"
              :maxlength="40"
              show-word-limit
              placeholder="请输入"
            />
          </el-form-item>
          <el-form-item label="默认值">
            <el-input
              v-model="question.defaultValue"
              :maxlength="question.maxLength || 40"
              placeholder="请输入默认值"
            />
          </el-form-item>
          <el-form-item label="最大长度">
            <el-input-number
              v-model="question.maxLength"
              :min="0"
              :max="40"
              :step="1"
              controls-position="right"
              class="w-full"
              placeholder="留空不限"
              :value-on-clear="null"
            />
          </el-form-item>
          <el-form-item label="格式校验">
            <el-select v-model="question.format" disabled class="w-full">
              <el-option label="无" value="none" />
            </el-select>
          </el-form-item>
        </el-form>

        <!-- 多行文本：占位提示 / 默认值 / 最大长度 / 默认行数 -->
        <el-form
          v-if="isTextarea"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="占位提示">
            <el-input
              v-model="question.placeholder"
              :maxlength="40"
              show-word-limit
              placeholder="请输入"
            />
          </el-form-item>
          <el-form-item label="默认值">
            <el-input
              v-model="question.defaultValue"
              type="textarea"
              :rows="2"
              resize="none"
              :maxlength="question.maxLength || 200"
              placeholder="请输入默认值"
            />
          </el-form-item>
          <el-form-item label="最大长度">
            <el-input-number
              v-model="question.maxLength"
              :min="0"
              :max="2000"
              :step="1"
              controls-position="right"
              class="w-full"
              placeholder="留空不限"
              :value-on-clear="null"
            />
          </el-form-item>
          <el-form-item label="默认行数">
            <el-input-number
              v-model="question.rows"
              :min="1"
              :max="20"
              :step="1"
              controls-position="right"
              class="w-full"
            />
          </el-form-item>
        </el-form>

        <!-- 数字：占位提示 / 默认值 / 最小值 / 最大值 / 小数位数 / 单位 -->
        <el-form
          v-if="isNumber"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="占位提示">
            <el-input
              v-model="question.placeholder"
              :maxlength="40"
              show-word-limit
              placeholder="请输入数字"
            />
          </el-form-item>
          <el-form-item label="默认值">
            <el-input
              v-model="question.defaultValue"
              placeholder="请输入默认值"
            />
          </el-form-item>
          <div class="form-row">
            <el-form-item label="最小值">
              <el-input-number
                v-model="question.minValue"
                :step="1"
                controls-position="right"
                class="w-full"
                placeholder="留空不限"
              />
            </el-form-item>
            <el-form-item label="最大值">
              <el-input-number
                v-model="question.maxValue"
                :step="1"
                controls-position="right"
                class="w-full"
                placeholder="留空不限"
              />
            </el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="小数位数">
              <el-input-number
                v-model="question.precision"
                :min="0"
                :max="2"
                :step="1"
                controls-position="right"
                class="w-full"
              />
              <span class="tip section-tip">0 表示整数</span>
            </el-form-item>
            <el-form-item label="单位">
              <el-input
                v-model="question.unit"
                :maxlength="8"
                placeholder="如 kg、元"
              />
            </el-form-item>
          </div>
        </el-form>

        <!-- 日期时间：占位提示 / 日期精度 / 默认当天 -->
        <el-form
          v-if="isDatetime"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="占位提示">
            <el-input
              v-model="question.placeholder"
              :maxlength="40"
              show-word-limit
              placeholder="请选择日期时间"
            />
          </el-form-item>
          <el-form-item label="日期精度">
            <el-select v-model="question.datePrecision" class="w-full">
              <el-option label="年" value="y" />
              <el-option label="年-月" value="ym" />
              <el-option label="年-月-日" value="ymd" />
              <el-option label="年-月-日 时:分" value="ymdhm" />
            </el-select>
          </el-form-item>
          <div class="row switch-row">
            <span class="row-label switch-label">默认当天</span>
            <el-switch v-model="question.defaultToday" />
          </div>
        </el-form>

        <!-- 图片：数量上限 / 单张大小上限 -->
        <el-form
          v-if="isImage"
          label-position="top"
          class="section-form"
        >
          <el-form-item label="数量上限">
            <el-input-number
              v-model="question.maxImageCount"
              :min="1"
              :max="99"
              :step="1"
              controls-position="right"
              class="w-full"
            />
            <span class="tip section-tip">范围 1 - 99 张</span>
          </el-form-item>
          <el-form-item label="单张大小上限（MB）">
            <el-input-number
              v-model="question.maxImageSize"
              :min="1"
              :max="20"
              :step="1"
              controls-position="right"
              class="w-full"
            />
            <span class="tip section-tip">范围 1 - 20 MB</span>
          </el-form-item>
        </el-form>

        <!-- 标签文本：最多标签数 / 允许重复 -->
        <template v-if="isTag">
          <el-form label-position="top" class="section-form">
            <el-form-item label="最多标签数">
              <el-input-number
                v-model="question.maxTags"
                :min="1"
                :max="999"
                :step="1"
                controls-position="right"
                class="w-full"
                placeholder="留空不限"
              />
              <span class="tip section-tip">留空表示不限</span>
            </el-form-item>
          </el-form>
          <div class="row switch-row">
            <span class="row-label switch-label">允许重复</span>
            <el-switch v-model="question.allowDuplicate" />
          </div>
        </template>
      </div>

      <template v-if="!isImage">
        <div class="panel-section">
          <p class="section-title">查询条件</p>
          <div class="row switch-row">
            <span class="row-label switch-label">设为查询条件</span>
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
          <p class="tip section-tip">开启后该题目会出现在应用端数据的筛选栏</p>
        </div>

        <div class="panel-section">
          <p class="section-title">数据列表</p>
          <div class="row switch-row">
            <span class="row-label switch-label">在列表中显示</span>
            <el-switch v-model="question.showInList" />
          </div>
          <p class="tip section-tip">关闭后该题目仅在详情页展示</p>
        </div>
      </template>
    </el-scrollbar>
  </aside>
</template>

<style scoped lang="less">
.property-panel {
  width: var(--w-property);
  flex-shrink: 0;
  height: 100%;
  background: var(--c-panel);
  border-left: 1px solid var(--c-line);
  display: flex;
  flex-direction: column;

  /* 原 element-overrides.css 的 .property-panel .el-form-item__label 颜色已迁回此处 */
  :deep(.el-form-item__label) {
    color: var(--c-text-regular);
  }

  .panel-head {
    height: var(--h-panel-head);
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

    .section-form {
      margin-top: var(--sp-md);
    }
  }

  /* .section-title 直接复用 global .section-title */

  /* 走全局 .row + .row-label,这里仅补"开关行"专属的 space-between + 32px 高度 */
  .switch-row {
    justify-content: space-between;
    height: 32px;
  }

  .switch-label {
    font-size: var(--fs-14);
    color: var(--c-text-regular);
  }

  /* 走全局 .tip,这里仅补"section 末尾提示"的额外上间距 */
  .section-tip {
    margin: var(--sp-sm) 0 0;
    color: var(--c-text-placeholder);
  }

  /* 两列等宽表单行(最小/最大值、小数/单位等) */
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-md);

    :deep(.el-form-item) {
      margin-bottom: var(--sp-lg);
    }
  }
}
</style>
