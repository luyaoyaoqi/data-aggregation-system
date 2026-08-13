<script setup>
/**
 * 选项关联字段弹窗
 * - 单选症状（symptom）或疾病（disease），二者只能选其一
 * - 显示名（展示给填写人）可选，[0,10] 字
 * - 校验：症状/疾病必须选一个；同时选 → "症状或疾病，仅可以选择1个"
 * - 校验：都不选 → "未选择症状或疾病，无法关联"
 *
 * 写入字段：
 *   linkType: 'symptom' | 'disease' | null
 *   linkData: { name, pinyin } | null
 *   displayName: string
 */
import { Warning } from '@element-plus/icons-vue'
import { symptoms, diseases, filterByKeyword } from '../data/medicalTerms.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  option: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// 三类选择状态：搜索词 + 选中项
const symptomQuery = ref('')
const diseaseQuery = ref('')

const selectedSymptom = ref(null) // { name, pinyin }
const selectedDisease = ref(null)

const displayName = ref('')
const errorTip = ref('')

const filteredSymptoms = computed(() =>
  filterByKeyword(symptomQuery.value, symptoms)
)
const filteredDiseases = computed(() =>
  filterByKeyword(diseaseQuery.value, diseases)
)

/** 打开弹窗时，根据 option 已有数据回填 */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    errorTip.value = ''
    const o = props.option
    displayName.value = o.displayName || ''
    selectedSymptom.value = null
    selectedDisease.value = null
    symptomQuery.value = ''
    diseaseQuery.value = ''
    if (o.linkType === 'symptom' && o.linkData) {
      selectedSymptom.value = o.linkData
    } else if (o.linkType === 'disease' && o.linkData) {
      selectedDisease.value = o.linkData
    }
  }
)

function pickSymptom(it) {
  selectedSymptom.value = it
  // 单选：选症状则清疾病
  selectedDisease.value = null
  errorTip.value = ''
}

function pickDisease(it) {
  selectedDisease.value = it
  selectedSymptom.value = null
  errorTip.value = ''
}

function clearSymptom() {
  selectedSymptom.value = null
  errorTip.value = ''
}

function clearDisease() {
  selectedDisease.value = null
  errorTip.value = ''
}

function handleConfirm() {
  // 同时选了：组件层互斥防御，正常不会发生，但提示一下
  if (selectedSymptom.value && selectedDisease.value) {
    errorTip.value = '症状或疾病，仅可以选择1个'
    return
  }
  if (!selectedSymptom.value && !selectedDisease.value) {
    errorTip.value = '未选择症状或疾病，无法关联'
    return
  }
  if (displayName.value.length > 10) {
    errorTip.value = '显示名长度不可超过 10 字'
    return
  }
  const result = {
    linkType: selectedSymptom.value ? 'symptom' : 'disease',
    linkData: selectedSymptom.value || selectedDisease.value,
    displayName: displayName.value || ''
  }
  emit('confirm', result)
  visible.value = false
}

function handleCancel() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="关联"
    width="520px"
    align-center
    class="option-link-dialog"
    @close="errorTip = ''"
  >
    <p class="link-tip alert is-warning">
      <el-icon class="link-tip-icon"><Warning /></el-icon>
      说明：症状或疾病，可任选1个关联，作为题目的选项
    </p>

    <el-form label-position="left" label-width="92px" class="link-form">
      <el-form-item label="搜索症状：">
        <el-select
          v-model="selectedSymptom"
          filterable
          clearable
          remote
          :remote-method="(q) => (symptomQuery = q)"
          placeholder="请输入症状名、拼音"
          class="link-select"
          :popper-class="'link-popper'"
          @clear="clearSymptom"
          @change="(v) => v && pickSymptom(v)"
        >
          <el-option
            v-for="it in filteredSymptoms"
            :key="it.name"
            :label="it.name"
            :value="it.name"
          />
        </el-select>
        <p v-if="errorTip" class="link-error">{{ errorTip }}</p>
      </el-form-item>

      <el-form-item label="搜索疾病：">
        <el-select
          v-model="selectedDisease"
          filterable
          clearable
          remote
          :remote-method="(q) => (diseaseQuery = q)"
          placeholder="请输入疾病名、拼音"
          class="link-select"
          :popper-class="'link-popper'"
          @clear="clearDisease"
          @change="(v) => v && pickDisease(v)"
        >
          <el-option
            v-for="it in filteredDiseases"
            :key="it.name"
            :label="it.name"
            :value="it.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="显示名：">
        <el-input
          v-model="displayName"
          placeholder="请输入展示给填写人的名称"
          maxlength="10"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" @click="handleConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.option-link-dialog {
  .link-tip {
    display: flex;
    align-items: center;
    gap: var(--sp-xs);
    margin: 0 0 var(--sp-lg);
  }

  .link-tip-icon {
    color: var(--c-warning);
  }

  .link-form {
    padding: 0 var(--sp-xs);
  }

  .link-select {
    width: 100%;
  }

  .link-error {
    margin: var(--sp-xs) 0 0;
    font-size: var(--fs-12);
    color: var(--c-danger);
  }
}
</style>