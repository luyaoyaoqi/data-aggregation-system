<script setup>
import { Delete, Plus, Setting } from '@element-plus/icons-vue'
import { reactive } from 'vue'
import { TYPE_GROUPS } from './ComponentLibrary.vue'
import CardTabs from './CardTabs.vue'
import QuestionCard from './QuestionCard.vue'
import TypeChipGrid from './TypeChipGrid.vue'

defineProps({
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
            v-for="card in page.cards"
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

              <QuestionCard
                v-for="(q, i) in card.questions"
                :key="q.id"
                :question="q"
                :index="i + 1"
                :active="q.id === activeQuestionId"
                @select="emit('select-question', $event)"
                @remove="emit('remove-question', { cardId: card.id, questionId: $event })"
                @duplicate="emit('duplicate-question', { cardId: card.id, questionId: $event })"
                @switch-type="(newType) => emit('switch-question-type', { cardId: card.id, questionId: q.id, newType })"
              />

              <el-popover
                :model-value="popoverVisible[card.id] || false"
                @update:model-value="popoverVisible[card.id] = $event"
                :width="640"
                placement="bottom-start"
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
        <el-button text @click="emit('reset')">重置</el-button>
      </div>

      <div class="footer-right">
        <span class="save-time">最近保存：{{ lastSavedAt }}</span>
        <el-button :icon="Setting" circle title="表单高级设置" />
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
  max-width: 900px;
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
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
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
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
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
  outline: none;
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
  padding: var(--sp-md);
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
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
  margin-right: var(--sp-md);
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
