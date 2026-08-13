/**
 * localStorage 持久化工具
 * - 命名空间：maijing:*
 * - 字段版本：v1（未来 schema 变化时升 v2，load 时按 version 分支处理或丢弃）
 * - 与预览快照 key（preview-form-snapshot）完全隔离，不冲突
 */

export const KEY_FORM = "maijing:form:v1";
/** 解析失败时备份的 raw 字符串 key（不可 JSON.parse 时使用） */
const KEY_CORRUPT = "maijing:form:v1:corrupt";

/** 读取表单数据。返回 null 表示：未存过 / 解析失败 / 版本不匹配 */
export function loadForm() {
  try {
    const raw = localStorage.getItem(KEY_FORM);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    if (!parsed.data) return null;
    return parsed.data;
  } catch {
    // 解析失败：把原始 raw 备份到 corrupt key（供 Editor 启动时提示恢复），
    // 然后 removeItem 掉当前 KEY_FORM，避免下次启动再次踩坑。
    try {
      const raw = localStorage.getItem(KEY_FORM);
      if (raw) {
        try {
          localStorage.setItem(KEY_CORRUPT, raw);
        } catch {
          /* 备份失败时回退到 removeItem，避免死循环 */
          localStorage.removeItem(KEY_FORM);
        }
        localStorage.removeItem(KEY_FORM);
      }
    } catch {
      /* noop */
    }
    return null;
  }
}

/** 写入表单数据。返回 { ok, error }；失败（如 QuotaExceededError）不抛 */
export function saveForm(form) {
  const payload = JSON.stringify({
    version: 1,
    data: form,
    savedAt: Date.now(),
  });
  try {
    localStorage.setItem(KEY_FORM, payload);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

/** 清除表单数据（重置场景使用） */
export function clearForm() {
  try {
    localStorage.removeItem(KEY_FORM);
  } catch {
    /* noop */
  }
}

/** 读取上次保存的时间戳（ms）。无存档 / 解析失败 → null */
export function getSavedAt() {
  try {
    const raw = localStorage.getItem(KEY_FORM);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.savedAt ?? null;
  } catch {
    return null;
  }
}