# 采集通 · 数据采集系统

> 在线表单编辑器（类似 问卷星 / 金数据 / Typeform），面向非设计/技术背景的业务人员。

## Memorable thing

**5 分钟搭出专业表单** —— 设计决策、产品决策的最终衡量锚点。

详见 [`DESIGN.md`](DESIGN.md)。

---

## 设计系统

**做任何视觉/UI 决策前，先读 `DESIGN.md`。**

- 所有字体、颜色、间距、aesthetic 方向都在 `DESIGN.md` 里定义。
- 没有用户明确授权，不要偏离。
- QA 模式下，任何代码与 `DESIGN.md` 不符视为 bug。

### 快速索引

| 维度 | 决策 |
|---|---|
| 主色 | `#2563EB`（indigo-600） |
| 字体 | Instrument Sans / Satoshi / JetBrains Mono |
| 圆角 | 默认 8px，分级 4 / 8 / 12 / 999 |
| 阴影 | 极轻三层（0.04 / 0.06 / 0.10） |
| 间距基准 | 4px，紧凑 |
| Motion | minimal-functional · 100-200ms · ease-out |
| Nav | 白底 + 1px 边框 |

### Token 使用规则

- **必须**用 `var(--c-primary)` 等 CSS 变量，**禁止**硬编码 hex
- **禁止**用 Inter / system-ui 作主字体
- **禁止**在组件里写 13px / 17px 等非 token 间距
- 数字/统计 **必须**走 `var(--ff-mono)` + `font-variant-numeric: tabular-nums`

---

## 工程约束

- **栈**：Vite + Vue 3 + JavaScript（**不**用 TypeScript）
- **UI 库**：Element Plus（按需自动引入）
- **样式**：UnoCSS + CSS 变量（不用 Tailwind）
- **路径**：项目根相对路径，不写绝对路径

### 目录速览

```
/DESIGN.md                 ← 设计系统（真源）
/CLAUDE.md                 ← 本文件
/demo/                     ← 可运行原型
  /src/styles/tokens.css   ← CSS 变量定义
  /src/styles/element-overrides.css ← Element Plus 主题覆盖
  /preview/d5.html         ← 设计系统预览（最新）
```

---

## 关键工作流

- **改 token**：先改 `DESIGN.md` 决策 → 同步 `demo/src/styles/tokens.css` → 不动组件
- **新建组件**：先查 `DESIGN.md` 现有 token，不直接写硬编码
- **提交前**：`git diff demo/src/styles/` 检查是否动到 token，token 改动必须有 DESIGN.md 同步