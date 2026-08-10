<script setup>
import { Delete, Plus, Setting } from '@element-plus/icons-vue'
import { reactive, ref } from 'vue'
import { TYPE_GROUPS } from './ComponentLibrary.vue'
import CardTabs from './CardTabs.vue'
import QuestionCard from './QuestionCard.vue'
import TypeChipGrid from './TypeChipGrid.vue'

const props = defineProps({
  form: { type: Object, required: true },
  page: { type: Object, default: null },
  activeQuestionId: { type: String, default: '' },
  lastSavedAt: { type: String, default: '' }
})

const emit = defineEmits([
  'change-page',
  'add-page',
  'remove-page',
  'add-card',
  'remove-card',
  'pick-type',
  'select-question',
  'remove-question',
  'duplicate-question',
  'switch-question-type',
  'reorder-question',
  'save',
  'reset',
  'preview'
])

const groups = TYPE_GROUPS

/** 每个卡片维护自己的 popover 显隐状态 */
const popoverVisible = reactive({})

function handlePick(cardId, type) {
  emit('pick-type', { cardId, type })
  popoverVisible[cardId] = false
}

/* -------------------- 题目上下拖动排序（同卡内） -------------------- */
/**
 * 拖动状态：{ cardIdx, fromIdx, overIdx }
 * overIdx 是「插入位置」语义（0 ~ questions.length）
 */
const reorderState = ref(null)

/** 每张卡片内各题目 DOM 的 ref 数组（按 cardIdx 索引） */
const questionRefsByCard = ref([])

function setQuestionRef(cardIdx, qIdx, el) {
  if (!questionRefsByCard.value[cardIdx]) {
    questionRefsByCard.value[cardIdx] = []
  }
  questionRefsByCard.value[cardIdx][qIdx] = el
}

/** 在 grip 上按下：开始拖动 */
function startReorder(e, cardIdx, fromIdx) {
  e.preventDefault()
  reorderState.value = { cardIdx, fromIdx, overIdx: fromIdx }
  document.body.style.cursor = 'grabbing'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onReorderMove)
  window.addEventListener('mouseup', endReorder)
}

/** 拖动中：计算鼠标 Y 落在哪个题目上 */
function onReorderMove(e) {
  if (!reorderState.value) return
  const { cardIdx, fromIdx } = reorderState.value
  const refs = questionRefsByCard.value[cardIdx] || []
  const y = e.clientY
  let target = fromIdx
  for (let i = 0; i < refs.length; i++) {
    const el = refs[i]
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    if (y < midY) {
      target = i
      break
    }
    target = i + 1
  }
  target = Math.max(0, Math.min(refs.length, target))
  if (target !== reorderState.value.overIdx) {
    reorderState.value.overIdx = target
  }
}

/** 拖动结束：执行重排，emit 给 Editor */
function endReorder() {
  let payload = null
  if (reorderState.value) {
    const { cardIdx, fromIdx, overIdx } = reorderState.value
    // overIdx 是「插入位置」；转换为 splice 索引
    const insertAt = overIdx > fromIdx ? overIdx - 1 : overIdx
    if (insertAt !== fromIdx) {
      payload = { cardIdx, fromIdx, insertAt }
    }
  }
  reorderState.value = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onReorderMove)
  window.removeEventListener('mouseup', endReorder)
  if (payload) emit('reorder-question', payload)
}
</script>

<template>
  <main class="editor-area">
    <!-- 可滚动画布 -->
    <el-scrollbar class="canvas-scroll">
      <div class="canvas">
        <!-- 表单标题（填写者不可见） -->
        <input
          v-model="form.title"
          class="form-title-input"
          placeholder="请输入表单标题（填写者不可见）"
          maxlength="20"
        />

        <!-- 分页 Tab -->
        <CardTabs
          :pages="form.pages"
          :active-id="page ? page.id : ''"
          @change="emit('change-page', $event)"
          @add="emit('add-page')"
          @remove="emit('remove-page', $event)"
        />

        <div class="canvas-divider" />

        <template v-if="page">
          <!-- 当前页主题（填写者可见） -->
          <input
            v-model="page.theme"
            class="page-theme-input"
            placeholder="请输入当前页主题（填写者可见）"
          />

          <!-- 卡片列表 -->
          <section
            v-for="(card, cardIdx) in page.cards"
            :key="card.id"
            class="form-card"
          >
            <header class="card-head">
              <input
                v-model="card.title"
                class="card-title-input"
                placeholder="卡片标题（选填，填写者可见）"
              />
              <button
                type="button"
                class="card-del"
                @click="emit('remove-card', card.id)"
              >
                <el-icon><Delete /></el-icon>
                <span>删除卡片</span>
              </button>
            </header>

            <div class="card-body">
              <p v-if="card.questions.length === 0" class="card-empty">
                本卡片暂无题目，点下方题型或从左侧点击插入
              </p>

              <template v-for="(q, i) in card.questions" :key="q.id">
                <!-- 占位条：拖到「在当前 q 之前」插入。
                     排除「原地」(overIdx === fromIdx) 和「紧邻原位之后」(overIdx === fromIdx + 1)，避免在被拖动项紧邻位置出现指示线。 -->
                <div
                  v-if="reorderState && reorderState.cardIdx === cardIdx && reorderState.overIdx === i && i !== reorderState.fromIdx && i !== reorderState.fromIdx + 1 "
                  class="q-placeholder"
                />
                <!-- 包裹层：承载拖动时的漂浮样式 -->
                <div
                  :ref="(el) => setQuestionRef(cardIdx, i, el)"
                  class="q-drag-wrap"
                  :class="{
                    'is-dragging':
                      reorderState &&
                      reorderState.cardIdx === cardIdx &&
                      reorderState.fromIdx === i
                  }"
                >
                  <QuestionCard
                    :question="q"
                    :index="i + 1"
                    :active="q.id === activeQuestionId"
                    @select="emit('select-question', $event)"
                    @remove="emit('remove-question', { cardId: card.id, questionId: $event })"
                    @duplicate="emit('duplicate-question', { cardId: card.id, questionId: $event })"
                    @switch-type="(newType) => emit('switch-question-type', { cardId: card.id, questionId: q.id, newType })"
                    @grip-down="(e, qId) => startReorder(e, cardIdx, i)"
                  />
                </div>
              </template>
              <!-- 占位条：拖到尾行后（overIdx === N，最后一道题之后）。
                   同样排除「原地」(overIdx === fromIdx) 和「紧邻原位之后」的情况。 -->
              <div
                v-if="reorderState && reorderState.cardIdx === cardIdx && reorderState.overIdx === card.questions.length && reorderState.overIdx !== reorderState.fromIdx && reorderState.overIdx !== reorderState.fromIdx + 1"
                class="q-placeholder"
              />

              <el-popover
                :model-value="popoverVisible[card.id] || false"
                @update:model-value="popoverVisible[card.id] = $event"
                :width="480"
                placement="bottom"
                trigger="click"
                :show-arrow="false"
                popper-class="add-question-popover"
              >
                <template #reference>
                  <button type="button" class="dashed-btn">
                    <el-icon><Plus /></el-icon>
                    <span>添加题目</span>
                  </button>
                </template>
                <p class="popover-tip">选择一个题型，插入到当前卡片末尾</p>
                <TypeChipGrid
                  :groups="groups"
                  @pick="(type) => handlePick(card.id, type)"
                />
              </el-popover>
            </div>
          </section>

          <button type="button" class="dashed-btn is-page" @click="emit('add-card')">
            <el-icon><Plus /></el-icon>
            <span>添加卡片</span>
          </button>
        </template>
      </div>
    </el-scrollbar>

    <!-- 底部操作条 -->
    <footer class="editor-footer">
      <div class="footer-left">
        <el-button @click="emit('exit')">退出编辑</el-button>
        <el-button @click="emit('reset')">重置</el-button>
      </div>

      <div class="footer-right">
        <span class="save-time">最近保存：{{ lastSavedAt }}</span>
        <el-button :icon="Setting" title="表单高级设置" />
        <el-button @click="emit('preview')">预览</el-button>
        <el-button type="primary" @click="emit('save')">保存</el-button>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.editor-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-page);
}

.canvas-scroll {
  flex: 1;
  min-height: 0;
}

.canvas {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--sp-xl) var(--sp-xl) 48px;
}

/* ---------- 标题 ---------- */
.form-title-input {
  display: block;
  width: 100%;
  height: 44px;
  margin-bottom: var(--sp-lg);
  font-family: inherit;
  font-size: var(--fs-20);
  font-weight: 600;
  color: var(--c-text);
  /* text-align: center; */
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  outline: none;
  transition: border-color 0.15s ease;
}

.form-title-input:hover:not(:focus) {
  border-bottom-color: var(--c-line);
}

.form-title-input:focus {
  border-bottom-color: var(--c-primary);
}

.form-title-input::placeholder {
  color: var(--c-text-placeholder);
  font-weight: 400;
}

.canvas-divider {
  height: 1px;
  margin: var(--sp-lg) 0;
  background: var(--c-line);
}

.page-theme-input {
  display: block;
  width: 100%;
  height: 32px;
  margin-bottom: var(--sp-lg);
  font-family: inherit;
  font-size: var(--fs-16);
  color: var(--c-text);
  /* text-align: center; */
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  outline: none;
  transition: border-color 0.15s ease;
}

.page-theme-input:hover:not(:focus) {
  border-bottom-color: var(--c-line);
}

.page-theme-input:focus {
  border-bottom-color: var(--c-primary);
}

.page-theme-input::placeholder {
  color: var(--c-text-placeholder);
}

/* ---------- 卡片 ---------- */
.form-card {
  margin-bottom: var(--sp-lg);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  border-bottom: 1px solid var(--c-line-light);
}

.card-title-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-text);
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  outline: none;
  transition: border-color 0.15s ease;
}

.card-title-input:hover:not(:focus) {
  border-bottom-color: var(--c-line);
}

.card-title-input:focus {
  border-bottom-color: var(--c-primary);
}

.card-title-input::placeholder {
  color: var(--c-text-placeholder);
}

.card-del {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  flex-shrink: 0;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.card-del:hover {
  color: var(--c-danger);
}

.card-body {
  /* 不再用 flex + gap：因为占位条要插入到题目之间，flex gap 会强制让出空隙导致布局抖动；
     改用 block + 子元素自管 margin，让占位条 height:0 时不影响其他元素位置。 */
  padding: var(--sp-md);
}

.card-empty {
  margin: 0;
  padding: var(--sp-xl) 0;
  text-align: center;
  font-size: var(--fs-14);
  color: var(--c-text-placeholder);
}

/* ---------- 虚线按钮 ---------- */
.dashed-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-xs);
  width: 100%;
  height: 40px;
  font-family: inherit;
  font-size: var(--fs-14);
  color: var(--c-primary);
  background: transparent;
  border: 1px dashed var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.dashed-btn:hover {
  border-color: var(--c-primary);
  background: var(--c-primary-light);
}

.dashed-btn.is-page {
  height: 44px;
  background: var(--c-panel);
}

/* 「添加题目」按钮（卡片内）需与最后一个 wrapper 保持 sm 间距（原本由 flex gap 提供） */
.card-body .dashed-btn {
  margin-top: var(--sp-sm);
}

/* ---------- 题目拖动排序（wrapper + 占位条）---------- */
/* wrapper 间距由自身 margin 提供（不再依赖 .card-body 的 flex gap） */
.q-drag-wrap {
  margin-bottom: var(--sp-sm);
}

.q-drag-wrap:last-of-type {
  margin-bottom: 0;
}

/* 被拖的题：主色高亮 + 虚线外框 + 漂浮阴影 */
.q-drag-wrap.is-dragging {
  opacity: 0.55;
  outline: 1px dashed var(--c-primary);
  outline-offset: 2px;
  border-radius: var(--radius);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
  cursor: grabbing;
}

/* 占位条：height: 0 + border-top 视觉蓝线 → 不占布局空间，题目不会因占位条出现/消失而上下跳 */
.q-placeholder {
  height: 0;
  margin: 0;
  border-top: 3px solid var(--c-primary);
  border-radius: 2px;
  box-shadow: 0 0 1px rgba(37, 99, 235, 0.45);
  pointer-events: none;
  margin-bottom: var(--sp-sm);
  /* 紧跟其后的 .q-drag-wrap margin-bottom 提供与下一题的间距 */
}

/* ---------- 底部条 ---------- */
.editor-footer {
  height: var(--h-footer);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-xl);
  background: var(--c-panel);
  border-top: 1px solid var(--c-line);
}

.footer-right {
  display: flex;
  align-items: center;
}

.save-time {
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
  margin-right: var(--sp-lg);
}
</style>

<style>
/* el-popover portal 到 body，scoped 样式进不去，写到全局 */
.add-question-popover .el-popover__content {
  padding: var(--sp-lg);
}

.add-question-popover .popover-tip {
  margin: 0 0 var(--sp-lg);
  font-size: var(--fs-12);
  color: var(--c-text-secondary);
}
</style>
