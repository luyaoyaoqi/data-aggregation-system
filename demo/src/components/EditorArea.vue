<script setup>
import { Delete, Plus, Setting, Rank } from '@element-plus/icons-vue'
import { reactive, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { TYPE_GROUPS } from './ComponentLibrary.vue'
import CardTabs from './CardTabs.vue'
import QuestionCard from './QuestionCard.vue'
import TypeChipGrid from './TypeChipGrid.vue'

const props = defineProps({
  form: { type: Object, required: true },
  page: { type: Object, default: null },
  activeQuestionId: { type: String, default: '' },
  lastSavedAt: { type: String, default: '' },
  indexMap: { type: Map, default: () => new Map() }
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
  'reorder-card',
  'save',
  'reset',
  'effect-preview',
  'settings'
])

const groups = TYPE_GROUPS

/** 每个卡片维护自己的 popover 显隐状态 */
const popoverVisible = reactive({})

function handlePick(cardId, type) {
  emit('pick-type', { cardId, type })
  popoverVisible[cardId] = false
}

/* -------------------- 落位 flash -------------------- */
/** 移动后被移动的卡片/题目短暂高亮 */
const lastMovedCardId = ref('')

/**
 * 触发落位 flash：
 * 先清空 class，等一帧再设上，才能在同一张卡被反复移动时重启动画。
 */
function flashMovedCard(cardId) {
  if (!cardId) return
  lastMovedCardId.value = ''
  setTimeout(() => {
    lastMovedCardId.value = cardId
    setTimeout(() => {
      if (lastMovedCardId.value === cardId) lastMovedCardId.value = ''
    }, 600)
  }, 16)
}

/* -------------------- 卡片上下移动（按钮触发） -------------------- */
/** 通过 cardId 反查 cardIdx（用于 emit 给父级） */
function cardLocalIdx(cardId) {
  if (!props.page) return -1
  return props.page.cards.findIndex((c) => c.id === cardId)
}

/** 卡片上移/下移：splice 后 emit，事件契约对齐 Editor.vue 的 handleReorderCard */
function moveCard(direction, cardIdx) {
  const cards = props.page?.cards
  if (!cards) return
  const target = direction === 'up' ? cardIdx - 1 : cardIdx + 1
  if (target < 0 || target >= cards.length) return
  const [moved] = cards.splice(cardIdx, 1)
  cards.splice(target, 0, moved)
  flashMovedCard(moved.id)
  emit('reorder-card', { fromIdx: cardIdx, insertAt: target })
}

/* -------------------- 题目拖动排序（同卡内，VueDraggable） -------------------- */
/**
 * v-model 已经 splice 了 card.questions 并 emit update:modelValue，
 * 这里 @update 只做：通知父级 + 触发落位 flash（不再做 splice）。
 * 父级 Editor.vue 拿到 reorder-question 后弹 toast，splice 不必重复做。
 */
function handleQuestionReorder(e, cardId) {
  if (!e || e.oldIndex === undefined || e.newIndex === undefined) return
  if (e.oldIndex === e.newIndex) return
  const cardIdx = cardLocalIdx(cardId)
  if (cardIdx < 0) return
  const card = props.page.cards[cardIdx]
  flashMovedCard(card?.id)
  emit('reorder-question', {
    cardIdx,
    fromIdx: e.oldIndex,
    insertAt: e.newIndex,
  })
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

          <!-- 卡片列表（顺序由三点菜单上移/下移调整；题目间间距由 QuestionCard 自身 margin 提供） -->
          <div class="card-list">
            <section
              v-for="(card, cardIdx) in page.cards"
              :key="card.id"
              class="form-card"
              :class="{ 'is-just-moved': lastMovedCardId === card.id }"
            >
              <header class="card-head">
                <input
                  v-model="card.title"
                  class="card-title-input"
                  placeholder="卡片标题（选填，填写者可见）"
                />
                <!-- 三点菜单：卡片上移 / 下移 -->
                <el-dropdown
                  trigger="click"
                  class="card-more"
                  @command="(cmd) => moveCard(cmd, cardIdx)"
                >
                  <button
                    type="button"
                    class="more-btn"
                    title="卡片操作"
                    @mousedown.stop
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="3" r="1.4" />
                      <circle cx="8" cy="8" r="1.4" />
                      <circle cx="8" cy="13" r="1.4" />
                    </svg>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="up" :disabled="cardIdx === 0">
                        上移
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="down"
                        :disabled="cardIdx === page.cards.length - 1"
                      >
                        下移
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <button
                  type="button"
                  class="btn-icon-ghost card-del"
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

                <!-- 题目列表：VueDraggable 接管同卡内 reorder。
                     用 v-model 让组件 splice modelValue 并 emit update:modelValue，
                     父级 card.questions 直接被 Vue 接管重排（避免 :list 被 vue-draggable-plus 忽略导致 DOM 与数据脱节）。 -->
                <VueDraggable
                  v-model="card.questions"
                  class="q-list"
                  :animation="180"
                  @update="(e) => handleQuestionReorder(e, card.id)"
                >
                  <div
                    v-for="q in card.questions"
                    :key="q.id"
                    class="q-drag-wrap"
                  >
                    <QuestionCard
                      :question="q"
                      :index="indexMap.get(q.id) ?? null"
                      :active="q.id === activeQuestionId"
                      @select="emit('select-question', $event)"
                      @remove="emit('remove-question', { cardId: card.id, questionId: $event })"
                      @duplicate="emit('duplicate-question', { cardId: card.id, questionId: $event })"
                      @switch-type="(newType) => emit('switch-question-type', { cardId: card.id, questionId: q.id, newType })"
                    />
                  </div>
                </VueDraggable>

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
          </div>

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
        <!-- <el-button @click="emit('exit')">退出编辑</el-button> -->
        <el-button @click="emit('reset')">重置</el-button>
      </div>

      <div class="footer-right">
        <span class="save-time">{{ lastSavedAt ? `最近保存：${lastSavedAt}` : '尚未保存' }}</span>
        <el-button :icon="Setting" title="表单高级设置" @click="emit('settings')" />
        <el-button @click="emit('effect-preview')">效果预览</el-button>
        <el-button type="primary" @click="emit('save')">保存</el-button>
      </div>
    </footer>
  </main>
</template>

<style scoped lang="less">
.editor-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-page);

  .canvas-scroll {
    flex: 1;
    min-height: 0;
  }

  .canvas {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--sp-lg) var(--sp-xl);
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
    transition: border-color var(--dur) var(--ease);

    &:hover:not(:focus) {
      border-bottom-color: var(--c-line);
    }

    &:focus {
      border-bottom-color: var(--c-primary);
    }

    &::placeholder {
      color: var(--c-text-placeholder);
      font-weight: 400;
    }
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
    transition: border-color var(--dur) var(--ease);

    &:hover:not(:focus) {
      border-bottom-color: var(--c-line);
    }

    &:focus {
      border-bottom-color: var(--c-primary);
    }

    &::placeholder {
      color: var(--c-text-placeholder);
    }
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
    transition: border-color var(--dur) var(--ease);

    &:hover:not(:focus) {
      border-bottom-color: var(--c-line);
    }

    &:focus {
      border-bottom-color: var(--c-primary);
    }

    &::placeholder {
      color: var(--c-text-placeholder);
    }
  }

  .card-body {
    /* 不再用 flex + gap：因为占位条要插入到题目之间，flex gap 会强制让出空隙导致布局抖动；
       改用 block + 子元素自管 margin，让占位条 height:0 时不影响其他元素位置。 */
    padding: var(--sp-md);

    /* 「添加题目」按钮（卡片内）需与最后一个 wrapper 保持 sm 间距（原本由 flex gap 提供） */
    .dashed-btn {
      margin-top: var(--sp-sm);
    }
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
    transition: all var(--dur) var(--ease);

    &:hover {
      border-color: var(--c-primary);
      background: var(--c-primary-bg);
    }

    &.is-page {
      height: 44px;
      background: var(--c-panel);
    }
  }

  /* ---------- 题目拖动排序（VueDraggable） ---------- */
  /* 题目 wrapper：提供题目间间距，并作为 VueDraggable item */
  .q-drag-wrap {
    margin-bottom: var(--sp-sm);

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  /* chosen（被选中的题目）：主色虚线 outline + 浅蓝底 + 漂浮阴影 */
  .sortable-chosen {
    outline: 1px dashed var(--c-primary);
    outline-offset: -1px;
    background: var(--c-primary-bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow-drag);
    cursor: grabbing;
  }

  /* ghost（拖动时的占位）：透明，让被拖项的 chosen 样式保持可见 */
  .sortable-ghost {
    opacity: 0;
  }

  /* ---------- 卡片列表容器 ---------- */
  .card-list {
    display: block;
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

    .footer-right {
      display: flex;
      align-items: center;
    }

    .save-time {
      font-size: var(--fs-12);
      color: var(--c-text-secondary);
      margin-right: var(--sp-lg);
    }
  }
}

/* 「删除卡片」按钮：走全局 .btn-icon-ghost */
.card-del {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  flex-shrink: 0;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-12);
}
</style>

<!--
  el-popover portal 到 body，scoped 样式进不去 → 已在 element-overrides.less 全局处理
  原非 scoped <style> 块（.add-question-popover .el-popover__content 等）已迁移并删除
-->
