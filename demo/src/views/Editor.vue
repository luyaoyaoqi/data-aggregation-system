<script setup>
import TopNav from '../components/TopNav.vue'
import ComponentLibrary, {
  createPage,
  createCard,
  createQuestion
} from '../components/ComponentLibrary.vue'
import EditorArea from '../components/EditorArea.vue'
import PropertyPanel from '../components/PropertyPanel.vue'
import PreviewDialog from '../components/PreviewDialog.vue'

/* ------------------------------ 表单数据 ------------------------------ */
function createInitialForm() {
  const form = { title: '', pages: [createPage(1), createPage(2)] }
  // 首页预置一道单选题，进入即有内容可看
  form.pages[0].cards[0].questions.push(createQuestion('radio'))
  return reactive(form)
}

const form = ref(createInitialForm())
const activePageId = ref(form.value.pages[0].id)
const activeQuestionId = ref(form.value.pages[0].cards[0].questions[0].id)
const lastSavedAt = ref('2026-07-22 18:15')

const previewVisible = ref(false)

const activePage = computed(
  () => form.value.pages.find((p) => p.id === activePageId.value) || null
)

const activeQuestion = computed(() => {
  for (const page of form.value.pages) {
    for (const card of page.cards) {
      const q = card.questions.find((x) => x.id === activeQuestionId.value)
      if (q) return q
    }
  }
  return null
})

/* ------------------------------ 分页操作 ------------------------------ */
function handleChangePage(id) {
  activePageId.value = id
}

function handleAddPage() {
  const page = createPage(form.value.pages.length + 1)
  form.value.pages.push(page)
  activePageId.value = page.id
  ElMessage.success(`已新增「${page.name}」`)
}

async function handleRemovePage(id) {
  if (form.value.pages.length <= 1) {
    ElMessage.warning('至少保留一页')
    return
  }
  const page = form.value.pages.find((p) => p.id === id)
  try {
    await ElMessageBox.confirm(
      `删除「${page.name}」后，该页下的卡片与题目会一并移除，是否继续？`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  const index = form.value.pages.findIndex((p) => p.id === id)
  form.value.pages.splice(index, 1)
  if (activePageId.value === id) {
    activePageId.value = form.value.pages[Math.max(0, index - 1)].id
  }
  ElMessage.success('已删除该页')
}

/* ------------------------------ 卡片操作 ------------------------------ */
function handleAddCard() {
  if (!activePage.value) return
  activePage.value.cards.push(createCard())
}

async function handleRemoveCard(cardId) {
  if (!activePage.value) return
  if (activePage.value.cards.length <= 1) {
    ElMessage.warning('当前页至少保留一张卡片')
    return
  }
  try {
    await ElMessageBox.confirm('删除卡片会同时移除卡片内的题目，是否继续？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const i = activePage.value.cards.findIndex((c) => c.id === cardId)
  if (i > -1) activePage.value.cards.splice(i, 1)
  ElMessage.success('已删除卡片')
}

/* ------------------------------ 题目操作 ------------------------------ */
/** 左侧组件库点击：插入到当前页最后一张卡片 */
function handlePickFromLibrary(type) {
  if (!activePage.value) return
  const card = activePage.value.cards[activePage.value.cards.length - 1]
  insertQuestion(card, type)
}

/** 中间「+ 添加题目」popover 选中题型：插入到指定卡片 */
function handlePickType({ cardId, type }) {
  if (!activePage.value) return
  const card =
    activePage.value.cards.find((c) => c.id === cardId) ||
    activePage.value.cards[activePage.value.cards.length - 1]
  insertQuestion(card, type)
}

function insertQuestion(card, type) {
  if (!card) return
  const q = createQuestion(type)
  card.questions.push(q)
  activeQuestionId.value = q.id
}

function handleSelectQuestion(id) {
  activeQuestionId.value = id
}

async function handleRemoveQuestion({ cardId, questionId }) {
  const card = activePage.value?.cards.find((c) => c.id === cardId)
  if (!card) return
  const q = card.questions.find((x) => x.id === questionId)
  if (!q) return
  try {
    await ElMessageBox.confirm('确认删除该题目？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const i = card.questions.findIndex((x) => x.id === questionId)
  if (i > -1) card.questions.splice(i, 1)
  if (activeQuestionId.value === questionId) activeQuestionId.value = ''
  ElMessage.success('已删除题目')
}

function handleDuplicateQuestion({ cardId, questionId }) {
  const card = activePage.value?.cards.find((c) => c.id === cardId)
  if (!card) return
  const i = card.questions.findIndex((q) => q.id === questionId)
  if (i < 0) return
  const source = card.questions[i]
  const copy = createQuestion(source.type)
  copy.title = source.title
  copy.desc = source.desc
  copy.required = source.required
  copy.columns = source.columns
  copy.options = source.options.map((o, idx) => ({
    id: `${copy.id}_o${idx}`,
    label: o.label,
    isDefault: !!o.isDefault,
    linkType: o.linkType || null,
    linkData: o.linkData || null,
    displayName: o.displayName || '',
    score: o.score ?? null
  }))
  card.questions.splice(i + 1, 0, copy)
  activeQuestionId.value = copy.id
  ElMessage.success('已复制题目')
}

/**
 * 7 切换：选项类 4 种题型之间互相切换
 * - options/columns/defaultOption/linkField/desc/required/title 全部保留
 * - 单选 ↔ 多选（radio↔checkbox / radio-rate↔checkbox-rate）时清掉 isDefault
 */
function handleSwitchQuestionType({ cardId, questionId, newType }) {
  const card = activePage.value?.cards.find((c) => c.id === cardId)
  if (!card) return
  const q = card.questions.find((x) => x.id === questionId)
  if (!q || q.type === newType) return
  const oldIsRadio =
    q.type === 'radio' || q.type === 'radio-rate'
  const newIsRadio =
    newType === 'radio' || newType === 'radio-rate'
  q.type = newType
  // 单选↔多选时，多选无「默认」概念，清掉
  if (oldIsRadio !== newIsRadio && q.options?.length) {
    q.options.forEach((o) => (o.isDefault = false))
  }
  ElMessage.success('已切换题型')
}

/* ------------------------------ 全局操作 ------------------------------ */
function handleSave() {
  const title = (form.value.title || '').trim()
  if (!title) {
    ElMessage.error('标题未填写，请检查')
    return
  }
  if (title.length > 20) {
    ElMessage.error('标题超过长度限制，请检查')
    return
  }
  // 多选题 必填时：最少/最多选择数 不能超过当前选项总数
  const bad = []
  for (const page of form.value.pages) {
    for (const card of page.cards) {
      for (const q of card.questions) {
        if (!q.required) continue
        const len = q.options?.length ?? 0
        const { minSelect, maxSelect } = q
        if (
          (minSelect != null && minSelect > len) ||
          (maxSelect != null && maxSelect > len)
        ) {
          bad.push(q.title?.trim() || '未命名题目')
        }
      }
    }
  }
  if (bad.length) {
    ElMessage.error(
      `选择数超出选项数量的题目：${bad.join('、')}，请调整后再保存`
    )
    return
  }
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  lastSavedAt.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  ElMessage.success('保存成功')
}

async function handleReset() {
  try {
    await ElMessageBox.confirm('重置会清空当前所有编辑内容，是否继续？', '重置确认', {
      type: 'warning',
      confirmButtonText: '确认重置',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  form.value = createInitialForm()
  activePageId.value = form.value.pages[0].id
  activeQuestionId.value = form.value.pages[0].cards[0].questions[0].id
  ElMessage.success('已重置')
}

function handlePreview() {
  previewVisible.value = true
}
</script>

<template>
  <div class="editor-layout">
    <TopNav />

    <div class="editor-main">
      <ComponentLibrary @pick="handlePickFromLibrary" />

      <EditorArea
        :form="form"
        :page="activePage"
        :active-question-id="activeQuestionId"
        :last-saved-at="lastSavedAt"
        @change-page="handleChangePage"
        @add-page="handleAddPage"
        @remove-page="handleRemovePage"
        @add-card="handleAddCard"
        @remove-card="handleRemoveCard"
        @pick-type="handlePickType"
        @select-question="handleSelectQuestion"
        @remove-question="handleRemoveQuestion"
        @duplicate-question="handleDuplicateQuestion"
        @switch-question-type="handleSwitchQuestionType"
        @save="handleSave"
        @reset="handleReset"
        @preview="handlePreview"
      />

      <PropertyPanel :question="activeQuestion" />
    </div>

    <PreviewDialog v-model="previewVisible" :form="form" :page="activePage" />
  </div>
</template>

<style scoped>
.editor-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-page);
}

.editor-main {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
