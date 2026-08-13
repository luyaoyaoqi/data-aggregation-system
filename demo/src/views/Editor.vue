<script setup>
import ComponentLibrary, {
  createPage,
  createCard,
  createQuestion,
} from "../components/ComponentLibrary.vue";
import EditorArea from "../components/EditorArea.vue";
import PropertyPanel from "../components/PropertyPanel.vue";
import FormSettingsDialog from "../components/FormSettingsDialog.vue";
import PreviewDialog from "../components/PreviewDialog.vue";
import { loadForm, saveForm, clearForm, getSavedAt } from "../utils/storage";

/** 把时间戳格式化为 "YYYY-MM-DD HH:mm"。无值 → '' */
function formatSavedAt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ------------------------------ 表单数据 ------------------------------ */
function createInitialForm() {
  const form = {
    title: "",
    settings: {
      showIndex: true, // 是否展示序号
      crossPage: false, // 跨页连续（仅 showIndex=true 生效）
      crossCard: false, // 跨卡片连续（仅 showIndex=true 生效）
    },
    pages: [createPage(1), createPage(2)],
  };
  // 首页预置全部 12 种题型,预览/独立窗口一次即可看完整渲染
  const demoTypes = [
    // 选项类
    "radio",
    // "checkbox",
    // "radio-rate",
    // "checkbox-rate",
    // 填空类
    // "text",
    // "textarea",
    // "number",
    // "datetime",
    // 采集类
    // "image",
    // "tag",
    // "list",
    // "richtext",
  ];
  demoTypes.forEach((type) => {
    form.pages[0].cards[0].questions.push(createQuestion(type));
  });
  return reactive(form);
}

/**
 * 启动时尝试从 localStorage 恢复表单数据
 * - 命中且合法：用存档覆盖默认（含 12 种题型的演示页会被存档覆盖，符合用户预期）
 * - 未命中 / 解析失败：使用默认（包含全 12 种题型的演示页）
 * - 静默恢复，不弹 toast（避免每次刷新都打扰）
 */
const form = ref(loadForm() || createInitialForm());
const activePageId = ref(form.value.pages[0].id);
/**
 * 在 form 中找到第一个题目的 id，用于初始化 activeQuestionId。
 * 防御式遍历：localStorage 存档可能不含任何题目（如测试时删光后保存），
 * 直接用 `pages[0].cards[0].questions[0].id` 会让 setup 在初始化阶段崩溃。
 * 找不到时返回 ''，PropertyPanel 已有 `v-if="!question"` 兜底。
 */
function findFirstQuestionId(root) {
  for (const p of root?.pages || []) {
    for (const c of p?.cards || []) {
      const q = (c?.questions || [])[0];
      if (q?.id) return q.id;
    }
  }
  return "";
}
const activeQuestionId = ref(findFirstQuestionId(form.value));
const lastSavedAt = ref(formatSavedAt(getSavedAt()));

const settingsVisible = ref(false);
const effectPreviewVisible = ref(false);

const activePage = computed(
  () => form.value.pages.find((p) => p.id === activePageId.value) || null,
);

const activeQuestion = computed(() => {
  for (const page of form.value.pages) {
    for (const card of page.cards) {
      const q = card.questions.find((x) => x.id === activeQuestionId.value);
      if (q) return q;
    }
  }
  return null;
});

/**
 * 全局题目序号（按 form.settings 计算）
 * - showIndex=false → 不展示
 * - crossPage=false → 每页从 1 开始
 * - crossCard=false → 每张卡片从 1 开始
 * - 题目的增删改、卡片/页的增删会自动重算
 */
const questionIndexMap = computed(() => {
  const map = new Map();
  const s = form.value.settings;
  if (!s || !s.showIndex) return map;
  let crossPageCounter = 0;
  for (let pIdx = 0; pIdx < form.value.pages.length; pIdx++) {
    const page = form.value.pages[pIdx];
    let cardCounter = 0;
    for (let cIdx = 0; cIdx < page.cards.length; cIdx++) {
      const card = page.cards[cIdx];
      if (!s.crossCard && cIdx > 0) cardCounter = 0;
      for (const q of card.questions) {
        const idx = s.crossPage ? crossPageCounter : cardCounter;
        map.set(q.id, idx + 1);
        crossPageCounter++;
        cardCounter++;
      }
    }
    if (!s.crossPage) crossPageCounter = 0;
  }
  return map;
});

/* ------------------------------ 分页操作 ------------------------------ */
function handleChangePage(id) {
  activePageId.value = id;
}

function handleAddPage() {
  const page = createPage(form.value.pages.length + 1);
  form.value.pages.push(page);
  activePageId.value = page.id;
  ElMessage.success(`已新增「${page.name}」`);
}

async function handleRemovePage(id) {
  if (form.value.pages.length <= 1) {
    ElMessage.warning("至少保留一页");
    return;
  }
  const page = form.value.pages.find((p) => p.id === id);
  try {
    await ElMessageBox.confirm(
      `删除「${page.name}」后，该页下的卡片与题目会一并移除，是否继续？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }
  const index = form.value.pages.findIndex((p) => p.id === id);
  form.value.pages.splice(index, 1);
  if (activePageId.value === id) {
    activePageId.value = form.value.pages[Math.max(0, index - 1)].id;
  }
  ElMessage.success("已删除该页");
}

/* ------------------------------ 卡片操作 ------------------------------ */
function handleAddCard() {
  if (!activePage.value) return;
  activePage.value.cards.push(createCard());
  ElMessage.success("已新增卡片");
}

async function handleRemoveCard(cardId) {
  if (!activePage.value) return;
  if (activePage.value.cards.length <= 1) {
    ElMessage.warning("当前页至少保留一张卡片");
    return;
  }
  try {
    await ElMessageBox.confirm(
      "删除卡片会同时移除卡片内的题目，是否继续？",
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }
  const i = activePage.value.cards.findIndex((c) => c.id === cardId);
  if (i > -1) activePage.value.cards.splice(i, 1);
  ElMessage.success("已删除卡片");
}

/* ------------------------------ 题目操作 ------------------------------ */
/** 左侧组件库点击：插入到当前页最后一张卡片 */
function handlePickFromLibrary(type) {
  if (!activePage.value) return;
  const card = activePage.value.cards[activePage.value.cards.length - 1];
  insertQuestion(card, type);
}

/** 中间「+ 添加题目」popover 选中题型：插入到指定卡片 */
function handlePickType({ cardId, type }) {
  if (!activePage.value) return;
  const card =
    activePage.value.cards.find((c) => c.id === cardId) ||
    activePage.value.cards[activePage.value.cards.length - 1];
  insertQuestion(card, type);
}

function insertQuestion(card, type) {
  if (!card) return;
  const q = createQuestion(type);
  card.questions.push(q);
  activeQuestionId.value = q.id;
}

function handleSelectQuestion(id) {
  activeQuestionId.value = id;
}

/**
 * 题目顺序变化（VueDraggable 触发）
 * payload: { cardIdx, fromIdx, insertAt }
 * 注意：v-model 已由 EditorArea 接管 splice，这里**不再**做 splice，
 * 否则会把刚刚被组件 splice 的顺序再次 rollback。仅弹 toast 提示。
 */
function handleReorderQuestion({ cardIdx, fromIdx, insertAt }) {
  if (!activePage.value) return;
  const card = activePage.value.cards[cardIdx];
  if (!card) return;
  if (fromIdx === insertAt) return;
  // splice 后的新位置就是 insertAt（题目已就位）
  const moved = card.questions[insertAt];
  ElMessage.success(`已调整题目顺序：${moved?.title || "未命名题目"}`);
}

/**
 * 卡片上下移动（三点菜单触发，跨卡）
 * payload: { fromIdx, insertAt }
 * EditorArea.vue 已 splice page.cards，此处只做提示/持久化
 */
function handleReorderCard({ fromIdx, insertAt }) {
  if (!activePage.value) return;
  const cards = activePage.value.cards;
  if (fromIdx < 0 || fromIdx >= cards.length) return;
  if (fromIdx === insertAt) return;
  const moved = cards[insertAt]; // 已经被 EditorArea splice
  ElMessage.success(`已调整卡片顺序：${moved?.title || "未命名卡片"}`);
}

async function handleRemoveQuestion({ cardId, questionId }) {
  const card = activePage.value?.cards.find((c) => c.id === cardId);
  if (!card) return;
  const q = card.questions.find((x) => x.id === questionId);
  if (!q) return;
  try {
    await ElMessageBox.confirm("确认删除该题目？", "删除确认", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  const i = card.questions.findIndex((x) => x.id === questionId);
  if (i > -1) card.questions.splice(i, 1);
  if (activeQuestionId.value === questionId) activeQuestionId.value = "";
  ElMessage.success("已删除题目");
}

function handleDuplicateQuestion({ cardId, questionId }) {
  const card = activePage.value?.cards.find((c) => c.id === cardId);
  if (!card) return;
  const i = card.questions.findIndex((q) => q.id === questionId);
  if (i < 0) return;
  const source = card.questions[i];
  const copy = createQuestion(source.type);
  copy.title = source.title;
  copy.desc = source.desc;
  copy.required = source.required;
  copy.columns = source.columns;
  copy.placeholder = source.placeholder;
  copy.defaultValue = source.defaultValue;
  copy.maxLength = source.maxLength;
  copy.format = source.format;
  // 多行文本
  copy.rows = source.rows;
  // 数字
  copy.minValue = source.minValue;
  copy.maxValue = source.maxValue;
  copy.precision = source.precision;
  copy.unit = source.unit;
  // 日期时间
  copy.datePrecision = source.datePrecision;
  copy.defaultToday = source.defaultToday;
  // 图片
  copy.maxImageCount = source.maxImageCount;
  copy.maxImageSize = source.maxImageSize;
  // 标签文本
  copy.maxTags = source.maxTags;
  copy.allowDuplicate = source.allowDuplicate;
  copy.tags = Array.isArray(source.tags) ? [...source.tags] : [];
  // 列表（自增表格）
  copy.listColumns = Array.isArray(source.listColumns)
    ? source.listColumns.map((c) => ({
        ...c,
        options: Array.isArray(c.options)
          ? c.options.map((o) => ({ ...o }))
          : [],
      }))
    : [];
  copy.options = source.options.map((o, idx) => ({
    id: `${copy.id}_o${idx}`,
    label: o.label,
    isDefault: !!o.isDefault,
    linkType: o.linkType || null,
    linkData: o.linkData || null,
    displayName: o.displayName || "",
    score: o.score ?? null,
  }));
  card.questions.splice(i + 1, 0, copy);
  activeQuestionId.value = copy.id;
  ElMessage.success("已复制题目");
}

/**
 * 7 切换：选项类 4 种题型之间互相切换
 * - options/columns/defaultOption/linkField/desc/required/title 全部保留
 * - 单选 ↔ 多选（radio↔checkbox / radio-rate↔checkbox-rate）时清掉 isDefault
 */
function handleSwitchQuestionType({ cardId, questionId, newType }) {
  const card = activePage.value?.cards.find((c) => c.id === cardId);
  if (!card) return;
  const q = card.questions.find((x) => x.id === questionId);
  if (!q || q.type === newType) return;
  const oldIsRadio = q.type === "radio" || q.type === "radio-rate";
  const newIsRadio = newType === "radio" || newType === "radio-rate";
  q.type = newType;
  // 单选↔多选时，多选无「默认」概念，清掉
  if (oldIsRadio !== newIsRadio && q.options?.length) {
    q.options.forEach((o) => (o.isDefault = false));
  }
  ElMessage.success("已切换题型");
}

/* ------------------------------ 全局操作 ------------------------------ */
function handleSave() {
  const title = (form.value.title || "").trim();
  if (!title) {
    ElMessage.error("标题未填写，请检查");
    return;
  }
  if (title.length > 20) {
    ElMessage.error("标题超过长度限制，请检查");
    return;
  }
  const bad = [];
  for (const page of form.value.pages) {
    for (const card of page.cards) {
      for (const q of card.questions) {
        const qName = q.title?.trim() || "未命名题目";
        // 数字：最大值 ≤ 最小值
        if (q.type === "number") {
          const { minValue, maxValue } = q;
          if (minValue != null && maxValue != null && maxValue <= minValue) {
            bad.push({
              title: qName,
              reason: `最大值 ${maxValue} 不大于最小值 ${minValue}`,
            });
          }
        }
        // 图片：必填项不能为空（maxImageCount / maxImageSize 已有默认值 9 / 5，但仍校验兜底）
        if (q.type === "image") {
          if (!q.maxImageCount || q.maxImageCount < 1) {
            bad.push({ title: qName, reason: "数量上限未填写或不合法" });
          }
          if (!q.maxImageSize || q.maxImageSize < 1) {
            bad.push({ title: qName, reason: "单张大小上限未填写或不合法" });
          }
        }
        // 列表：至少 1 列；列名必填且 ≤ 20 字；下拉列至少 1 个选项；列宽 80-600
        if (q.type === "list") {
          const cols = q.listColumns || [];
          if (cols.length < 1) {
            bad.push({ title: qName, reason: "至少保留 1 列" });
          }
          for (let ci = 0; ci < cols.length; ci++) {
            const c = cols[ci];
            const name = (c.name || "").trim();
            if (!name) {
              bad.push({ title: qName, reason: `第 ${ci + 1} 列名称为空` });
            } else if (name.length > 20) {
              bad.push({
                title: qName,
                reason: `第 ${ci + 1} 列名称超过 20 字`,
              });
            }
            if (
              (c.colType === "radio" || c.colType === "checkbox") &&
              (!c.options || c.options.length < 1)
            ) {
              bad.push({
                title: qName,
                reason: `第 ${ci + 1} 列（下拉）至少 1 个选项`,
              });
            }
            if (c.width != null && (c.width < 80 || c.width > 600)) {
              bad.push({
                title: qName,
                reason: `第 ${ci + 1} 列宽需在 80-600 之间`,
              });
            }
            // width == null 视为「自动撑满」，合法
          }
        }
        if (!q.required) continue;
        const len = q.options?.length ?? 0;
        const { minSelect, maxSelect, defaultValue, maxLength } = q;
        // 多选题：选择数 超出选项数
        if (
          (minSelect != null && minSelect > len) ||
          (maxSelect != null && maxSelect > len)
        ) {
          bad.push({
            title: qName,
            reason: "选择数超出选项数量",
          });
        }
        // 填空类：默认值 超出最大长度（仅 maxLength > 0 时校验）
        if (maxLength > 0 && defaultValue && defaultValue.length > maxLength) {
          bad.push({
            title: qName,
            reason: `默认值长度 ${defaultValue.length} 超过 ${maxLength}`,
          });
        }
      }
    }
  }
  if (bad.length) {
    const msg = bad.map((b) => `${b.title}（${b.reason}）`).join("；");
    ElMessage.error(`保存校验未通过：${msg}，请调整后再保存`);
    return;
  }
  // 写入 localStorage（校验已通过，深拷贝后再写，避免 Vue Proxy / 循环引用被序列化）
  const result = saveForm(JSON.parse(JSON.stringify(form.value)));
  if (!result.ok) {
    console.error("[Editor] 保存失败：", result.error);
    ElMessage.error("保存失败：本地存储空间不足，请清理浏览器数据后重试");
    return;
  }
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  lastSavedAt.value = formatSavedAt(now.getTime());
  ElMessage.success("保存成功");
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      "重置会清空当前所有编辑内容（包括 localStorage 存档），是否继续？",
      "重置确认",
      {
        type: "warning",
        confirmButtonText: "确认重置",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }
  clearForm(); // 先清 localStorage，确保下次刷新不会复活旧存档
  form.value = createInitialForm();
  activePageId.value = form.value.pages[0].id;
  activeQuestionId.value = findFirstQuestionId(form.value);
  ElMessage.success("已重置");
}

/**
 * 在独立窗口中打开预览（最终用户填表端）
 * - 复用 writeSnapshot 写入 localStorage
 * - /preview.html 是 Vite 多入口构建的独立预览页
 */
function openStandalone() {
  writeSnapshot();
  window.open("/preview.html", "_blank", "noopener,noreferrer");
}

/**
 * 把当前 form 深拷贝快照写入 localStorage。
 * - 独立预览窗口与 dialog 形态的效果预览共用同一份快照（key: preview-form-snapshot）
 * - 每次打开预览入口都会重写，保证拿到最新 form
 */
function writeSnapshot() {
  const snapshot = {
    ts: Date.now(),
    form: JSON.parse(JSON.stringify(form.value)),
  };
  localStorage.setItem("preview-form-snapshot", JSON.stringify(snapshot));
}

/**
 * 在编辑器内以 dialog 形态打开效果预览
 * - 每次打开都重写快照，让 iframe 内 PreviewStandalone 拿到当前 form
 * - PreviewStandalone 现在不再 removeItem，dialog 重开时通过 src 时间戳强制 reload
 */
function openEffectPreview() {
  writeSnapshot();
  effectPreviewVisible.value = true;
}
</script>

<template>
  <div class="editor-layout">
    <div class="editor-main">
      <ComponentLibrary @pick="handlePickFromLibrary" />

      <EditorArea
        :form="form"
        :page="activePage"
        :active-question-id="activeQuestionId"
        :last-saved-at="lastSavedAt"
        :index-map="questionIndexMap"
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
        @reorder-question="handleReorderQuestion"
        @reorder-card="handleReorderCard"
        @save="handleSave"
        @reset="handleReset"
        @effect-preview="openEffectPreview"
        @settings="settingsVisible = true"
      />

      <PropertyPanel :question="activeQuestion" />
    </div>

    <FormSettingsDialog v-model="settingsVisible" :settings="form.settings" />

    <PreviewDialog
      v-model="effectPreviewVisible"
      :form="form"
      @open-standalone="openStandalone"
    />
  </div>
</template>

<style scoped lang="less">
.editor-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-page);

  .editor-main {
    flex: 1;
    min-height: 0;
    display: flex;
  }
}
</style>
