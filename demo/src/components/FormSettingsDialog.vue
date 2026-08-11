<script setup>
import { Setting } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  settings: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :width="480"
    align-center
    show-close
    class="form-settings-dialog"
  >
    <template #header>
      <div class="fsd-head">
        <!-- <el-icon><Setting /></el-icon> -->
        <span>表单设置</span>
      </div>
    </template>

    <section class="fsd-section">
      <p class="fsd-section-title">1、题目序号设置</p>

      <div class="fsd-row">
        <span class="fsd-row-label">展示序号</span>
        <el-switch v-model="settings.showIndex" />
      </div>

      <div v-if="settings.showIndex" class="fsd-subgroup">
        <div class="fsd-row">
          <span class="fsd-row-label">跨页连续</span>
          <el-switch v-model="settings.crossPage" />
        </div>
        <div class="fsd-row">
          <span class="fsd-row-label">跨卡片连续</span>
          <el-switch v-model="settings.crossCard" />
        </div>
      </div>

      <p class="fsd-tip alert is-info">
        卡片新增、题目新增、删除、排序调整后，序号联动变更
      </p>
    </section>
  </el-dialog>
</template>

<style scoped lang="less">
.form-settings-dialog {
  .fsd-head {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--fs-16);
    font-weight: 600;
    color: var(--c-text);

    .el-icon {
      font-size: var(--fs-18);
      color: var(--c-primary);
    }
  }

  .fsd-section {
    & + .fsd-section {
      margin-top: var(--sp-xl);
      padding-top: var(--sp-xl);
      border-top: 1px solid var(--c-line-light);
    }
  }

  .fsd-section-title {
    margin: var(--sp-sm) 0 var(--sp-sm);
    font-size: var(--fs-14);
    font-weight: 600;
    color: var(--c-text);
  }

  .fsd-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
  }

  .fsd-subgroup {
    margin-left: var(--sp-lg);
    padding-left: var(--sp-md);
    border-left: 2px solid var(--c-line-light);

    .fsd-row {
      height: 32px;
    }
  }

  .fsd-row-label {
    font-size: var(--fs-14);
    color: var(--c-text-regular);
  }

  .fsd-tip {
    margin: var(--sp-md) 0 0;
  }
}

/* 原 .form-settings-dialog :deep(.el-dialog__header/body) 两条 padding 已合并到
   element-overrides.less 的 .el-dialog 全局覆盖中，无需保留 */
</style>
