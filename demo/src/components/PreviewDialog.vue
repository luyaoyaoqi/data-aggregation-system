<script setup>
import { computed, ref, watch } from 'vue'
import { Cellphone, Monitor, Close } from '@element-plus/icons-vue'

/**
 * 效果预览 Dialog —— 在编辑器内以 dialog 形态预览表单
 * - 复用独立预览页 /preview.html（iframe 嵌入），零渲染重复
 * - 顶部切换手机/电脑尺寸（iframe width）
 * - 打开时一次性快照：每次打开重写 localStorage，PreviewStandalone 读后不再删
 * - 参考 FormSettingsDialog 的最简 v-model 模式
 */

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  form: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/* 设备预设：两档（手机/电脑），宽度按 iPhone 14 / 桌面端常用断点 */
const DEVICE = {
  mobile: { label: '手机', width: 390 },
  desktop: { label: '电脑', width: 1024 },
}

const device = ref('desktop')

/* iframe style：宽度随设备变；高度固定 70vh */
const iframeStyle = computed(() => ({
  width: DEVICE[device.value].width + 'px',
  height: '100%',
}))

/* dialog 宽度：iframe 宽度 + 左右 padding 各 32px */
const dialogWidth = computed(() => DEVICE[device.value].width + 64 + 'px')

/* 表单名（toolbar 左侧） */
const formTitle = computed(() => props.form?.title?.trim() || '未命名表单')

/*
 * iframe src：每次 dialog 打开时加时间戳强制 reload，
 * 保证 iframe 内 PreviewStandalone 重新读 localStorage。
 */
const iframeSrc = ref('./preview.html')
watch(visible, (v) => {
  if (v) iframeSrc.value = './preview.html?t=' + Date.now()
})

function handleClose() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :show-close="false"
    align-center
    fullscreen
    class="preview-dialog"
  >
    <template #header>
      <div class="pd-toolbar">
        <span class="pd-title">{{ formTitle }}</span>

        <el-radio-group v-model="device" class="pd-device">
          <el-radio-button value="mobile">
            <el-icon><Cellphone /></el-icon>
            <span>{{ DEVICE.mobile.label }}</span>
          </el-radio-button>
          <el-radio-button value="desktop">
            <el-icon><Monitor /></el-icon>
            <span>{{ DEVICE.desktop.label }}</span>
          </el-radio-button>
        </el-radio-group>

        <button
          type="button"
          class="pd-close"
          title="关闭"
          @click="handleClose"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </template>

    <div class="pd-frame-wrap">
      <iframe
        :src="iframeSrc"
        :style="iframeStyle"
        class="pd-frame"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  </el-dialog>
</template>

<style lang="less">
.preview-dialog {
  /* toolbar：左标题 / 中设备切换 / 右关闭 */
  display: flex;
  flex-direction: column;
  .el-dialog__body{
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .pd-toolbar {
    display: grid;
    /* 三列等分：左 1fr 给 title，中 auto 给 device，右 1fr 给 close
       —— 这样 device 在水平中点严格居中，与 title/close 宽度无关 */
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    padding-right: var(--sp-xs);
  }

  .pd-title {
    justify-self: start;
    min-width: 0;
    font-family: var(--ff-display);
    font-size: var(--fs-16);
    font-weight: 600;
    color: var(--c-text-strong);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pd-device {
    justify-self: center;
    flex-shrink: 0;

    /* 让按钮内的图标 + 文字 同行且不挤压 */
    :deep(.el-radio-button__inner) {
      display: inline-flex;
      align-items: center;
      gap: var(--sp-xs);
    }

    :deep(.el-icon) {
      font-size: var(--fs-14);
    }
  }

  .pd-close {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--c-text-secondary);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition:
      color var(--dur) var(--ease),
      background var(--dur) var(--ease);

    &:hover {
      color: var(--c-text-strong);
      background: var(--c-fill);
    }

    :deep(.el-icon) {
      font-size: var(--fs-16);
    }
  }

  /* iframe 容器：占满 dialog body，舞台底色 */
  .pd-frame-wrap {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: stretch;
    width: 100%;
    padding: 0;
    background: #fff;
    border-radius: var(--radius);
  }

  .pd-frame {
    display: block;
    border: 1px solid var(--c-line);
    border-radius: var(--radius);
    background: var(--c-panel);
    box-shadow: var(--shadow-card);
    transition: width var(--dur-slow) var(--ease);
  }
}
</style>