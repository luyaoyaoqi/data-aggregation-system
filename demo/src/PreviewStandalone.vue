<script setup>
import { ref, computed, onMounted } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import FormFill from "./components/FormFill.vue";

/**
 * 独立窗口 —— 面向最终填表人。
 *
 * 职责（容器层）：
 *  - 翻页（上一页 / 下一页）+ 提交按钮
 *  - 提交时调用 FormFill.getAnswers() 取数据
 *
 * 题目渲染、状态管理、序号计算 —— 全部交给 FormFill 共享组件。
 */
const STORAGE_KEY = "preview-form-snapshot";

const form = ref(null);
const loadError = ref("");

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      loadError.value = "暂无表单数据，请从编辑器预览入口重新进入。";
      return;
    }
    const snap = JSON.parse(raw);
    if (!snap?.form) {
      loadError.value = "快照数据无效。";
      return;
    }
    form.value = snap.form;
    loadError.value = "";
    /* 不再读后即删 —— 让 dialog 形态的 PreviewDialog 能稳定复用同一份快照
       （父页面打开 dialog 前会重写一次，保证拿到最新 form） */
  } catch (e) {
    console.error("[PreviewStandalone] 解析快照失败：", e);
    loadError.value = "表单数据已失效，请从编辑器重新打开预览";
  }
}

onMounted(() => {
  loadSnapshot();
});

const allPages = computed(() => form.value?.pages || []);
const currentPageIdx = ref(0);
const currentPage = computed(
  () => allPages.value[currentPageIdx.value] || null,
);

const isFirstPage = computed(() => currentPageIdx.value <= 0);
const isLastPage = computed(
  () => currentPageIdx.value >= allPages.value.length - 1,
);
const hasQuestions = computed(
  () =>
    currentPage.value &&
    currentPage.value.cards.some((c) => c.questions.length > 0),
);

function changePage(idx) {
  if (idx < 0 || idx >= allPages.value.length) return;
  currentPageIdx.value = idx;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goPrev() {
  if (!isFirstPage.value) changePage(currentPageIdx.value - 1);
}

function goNext() {
  if (!isLastPage.value) changePage(currentPageIdx.value + 1);
}

/* -------------------- 提交 -------------------- */
const fillRef = ref(null);
const submitting = ref(false);

/** 收集当前所有答案（跨页扁平化） */
function collectAnswers() {
  return fillRef.value?.getAnswers?.() || { answers: {}, listRows: {} };
}

/**
 * 提交前校验：遍历 form.pages/cards/questions，对 required 题按题型规则校验。
 * - 返回 { ok: true } 或 { ok: false, firstQuestionId, errors: [{qid, reason}] }
 * - 校验失败的题目保留 qid，提交失败时通知 FormFill 高亮定位
 */
function validateSubmit(form, answersData) {
  const errors = [];
  let firstQuestionId = "";
  const answers = answersData?.answers || {};

  function pushError(q, reason) {
    if (!firstQuestionId) firstQuestionId = q.id;
    errors.push({ qid: q.id, reason });
  }

  for (const page of form?.pages || []) {
    for (const card of page.cards || []) {
      for (const q of card.questions || []) {
        if (!q.required) continue;
        const v = answers[q.id];
        const t = q.type;
        // 选项类
        if (t === "radio" || t === "radio-rate") {
          if (v == null || v === "") pushError(q, "请选择");
          continue;
        }
        if (t === "checkbox" || t === "checkbox-rate") {
          const arr = Array.isArray(v) ? v : [];
          if (arr.length < 1) {
            pushError(q, "请至少选择 1 项");
          } else {
            if (q.minSelect != null && arr.length < q.minSelect) {
              pushError(q, `至少需要选择 ${q.minSelect} 项`);
            } else if (q.maxSelect != null && arr.length > q.maxSelect) {
              pushError(q, `最多只能选择 ${q.maxSelect} 项`);
            }
          }
          continue;
        }
        // 文本类
        if (t === "text" || t === "textarea") {
          const s = (v || "").toString().trim();
          if (!s) {
            pushError(q, "请填写内容");
          } else if (q.maxLength > 0 && s.length > q.maxLength) {
            pushError(q, `内容长度不能超过 ${q.maxLength}`);
          }
          continue;
        }
        // 数字
        if (t === "number") {
          if (v == null || v === "") {
            pushError(q, "请填写数字");
          } else {
            const n = typeof v === "number" ? v : Number(v);
            if (Number.isNaN(n)) {
              pushError(q, "请填写数字");
            } else {
              if (q.minValue != null && n < q.minValue) {
                pushError(q, `不能小于最小值 ${q.minValue}`);
              } else if (q.maxValue != null && n > q.maxValue) {
                pushError(q, `不能大于最大值 ${q.maxValue}`);
              }
            }
          }
          continue;
        }
        // 日期时间
        if (t === "datetime") {
          if (v == null || v === "") pushError(q, "请选择日期时间");
          continue;
        }
        // 图片
        if (t === "image") {
          const arr = Array.isArray(v) ? v : [];
          if (arr.length < 1) pushError(q, "请上传至少 1 张图片");
          continue;
        }
      }
    }
  }

  if (errors.length) return { ok: false, firstQuestionId, errors };
  return { ok: true };
}

async function handleSubmit() {
  if (submitting.value) return;
  const data = collectAnswers();
  const result = validateSubmit(form.value, data);
  if (!result.ok) {
    ElMessage.warning(
      `校验未通过：${result.errors[0].reason}（共 ${result.errors.length} 处）`,
    );
    if (result.firstQuestionId) {
      fillRef.value?.highlight?.(result.firstQuestionId);
    }
    return;
  }
  submitting.value = true;
  try {
    // 预收集数据（调试用,真实场景未来接接口）
    await ElMessageBox.alert(
      "这是表单填写端的预览页面，填写的数据不会被提交。\n\n已收集到 " +
        Object.keys(data.answers).length +
        " 道题目的答案。",
      "预览模式",
      {
        type: "warning",
        confirmButtonText: "我知道了",
        customClass: "fill-msgbox",
      },
    ).catch(() => {});
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="fill-page">
    <!-- 空态 -->
    <div v-if="loadError" class="fill-empty">
      <p class="fill-empty__title">暂无法加载表单</p>
      <p class="fill-empty__desc">{{ loadError }}</p>
      <button type="button" class="fill-retry" @click="loadSnapshot">
        重新加载
      </button>
    </div>

    <!-- 主区：响应式居中卡片,内嵌 FormFill -->
    <main v-else-if="form" class="fill-main">
      <div class="fill-card">
        <FormFill
          ref="fillRef"
          :page="currentPage"
          :pages="allPages"
          :settings="form.settings || {}"
          :current-page-idx="currentPageIdx"
        />

        <!-- 底部：分页 + 提交
             即使当前页没有题目也保留底部条 —— 用户能继续翻页/提交，不能因为页面空就把出口卡住 -->
        <div v-if="allPages.length > 0" class="fill-footer">
          <div v-if="allPages.length > 1" class="fill-pager">
            <button
              v-if="!isFirstPage"
              type="button"
              class="fill-pager-btn"
              @click="goPrev"
            >
              <el-icon><ArrowLeft /></el-icon>
              <span>上一页</span>
            </button>

            <button
              v-if="!isLastPage"
              type="button"
              class="fill-pager-btn"
              @click="goNext"
            >
              <span>下一页</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
            <button
              v-else
              type="button"
              class="fill-submit"
              :disabled="submitting"
              @click="handleSubmit"
            >
              提交
            </button>
          </div>
          <button
            v-else
            type="button"
            class="fill-submit"
            :disabled="submitting"
            @click="handleSubmit"
          >
            提交
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="less">
/* ============ 顶层 ============ */
.fill-page {
  min-height: 100vh;
  background: var(--c-page);
  display: flex;
  flex-direction: column;
}

/* ============ 空态 ============ */
.fill-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-sm);
  padding: var(--sp-2xl);

  &__title {
    margin: 0;
    font-family: var(--ff-display);
    font-size: var(--fs-18);
    font-weight: 600;
    color: var(--c-text-strong);
  }

  &__desc {
    margin: 0;
    font-size: var(--fs-14);
    color: var(--c-text-secondary);
    text-align: center;
    max-width: 480px;
  }
}

/* ============ 主区：响应式居中卡片 ============ */
.fill-main {
  flex: 1;
  // padding: var(--sp-xl);
}

.fill-card {
  max-width: 1000px;
  margin: 0 auto;
  // background: var(--c-panel);
  // border: 1px solid var(--c-line-light);
  border-radius: var(--radius-lg);
  padding: var(--sp-xl);
  // box-shadow: var(--shadow-card);
}

@media (max-width: 1000px) {
  .fill-card {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: var(--sp-md);
  }
}

/* ============ 底部操作 ============ */
.fill-footer {
  margin-top: var(--sp-lg);
  padding: var(--sp-lg);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  position: sticky;
  bottom: 0;
  background: var(--c-panel);
  display: flex;
}

.fill-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-md);
  width: 100%;
}

.fill-pager-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-xs) var(--sp-md);
  font-family: inherit;
  color: var(--c-text-regular);
  background: var(--c-panel);
  border: 1px solid var(--c-line);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--dur) var(--ease);
  white-space: nowrap;
  height: 36px;
  font-family: inherit;
  font-size: var(--fs-14);
  flex: 0 0 120px;
  justify-content: center;
  color: var(--c-primary);
  border-color: var(--c-primary);
  background: var(--c-primary-bg);

  &:hover:not(:disabled) {
   opacity: 0.8;
  }

  &:disabled {
    color: var(--c-text-placeholder);
    background: var(--c-fill);
    cursor: not-allowed;
  }
}

.fill-submit {
  display: block;
  flex: 0 0 120px;
  height: 36px;
  font-family: inherit;
  font-size: var(--fs-14);
  font-weight: 500;
  color: var(--c-on-primary);
  background: var(--c-primary);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background var(--dur) var(--ease);

  &:hover {
    background: var(--c-primary-hover);
  }

  &:disabled {
    background: var(--c-fill);
    color: var(--c-text-placeholder);
    cursor: not-allowed;
  }
}

/* 空态里的「重新加载」按钮：与提交按钮同款主色样式，但更紧凑 */
.fill-retry {
  margin-top: var(--sp-sm);
  height: 36px;
  padding: 0 var(--sp-lg);
  font-family: inherit;
  font-size: var(--fs-14);
  font-weight: 500;
  color: var(--c-on-primary);
  background: var(--c-primary);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background var(--dur) var(--ease);

  &:hover {
    background: var(--c-primary-hover);
  }
}
</style>
