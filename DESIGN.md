# Design System — 采集通（数据采集系统）

> **Memorable thing**：5 分钟搭出专业表单。
> 设计决策的每一步都为这个锚点服务：业务用户在不学习的前提下，能产出专业度可用的表单。

---

## Product Context

- **What this is**: 在线表单/数据采集编辑器，类似 问卷星 / 金数据 / Typeform 的国产 SaaS 工具
- **Who it's for**: 中小企业的业务人员（HR、市场、运营、行政），**非设计/技术背景**
- **Space/industry**: B 端 SaaS · 表单/数据采集 · 中文环境
- **Project type**: Web app（编辑器 + 自动渲染的填写端）

### Core Jobs

1. **搭表单** — 用户从空白开始，5 分钟内完成一份 5-10 题的可用表单
2. **配样式** — 基础换皮（标题/颜色/Logo），输出仍专业
3. **发布 + 收集** — 链接/二维码分发，实时看到回收数据
4. **导出** — Excel / 数据接口

---

## Aesthetic Direction

- **Direction**: 工业克制（Industrial-Utilitarian 现代版）
- **Decoration level**: minimal
- **Mood**: 工具型、可信赖、不喧宾夺主。专业感来自对比与留白，不是装饰
- **Reference sites**: Notion · Linear · Figma · Tally（克制派）；问卷星 · 金数据（行业 baseline）

### Why this direction

memorable thing "5 分钟搭出专业表单" 暗示：
- 用户**不需要**学习设计就能得到专业感 → 系统承担"专业感"的责任
- 工具密集 → 视觉必须**退后一步**，不抢内容
- 输出可信 → 整体偏 **Linear / Figma** 调性，不偏国产 SaaS 的"蓝紫渐变"

---

## Typography

| 角色 | 字体 | 来源 | 备注 |
|---|---|---|---|
| **Display / 标题** | Instrument Sans | Google Fonts | 工业感 sans，区别于 Inter / Space Grotesk |
| **Body / 正文** | Satoshi | Fontshare | 圆润但专业，14-16px 长时间阅读不疲劳 |
| **Data / 数字** | JetBrains Mono | Google Fonts | 开 `tabular-nums`，表格/统计列对齐 |
| **Code** | JetBrains Mono | Google Fonts | 等宽 |
| **中文回退** | PingFang SC → Microsoft YaHei | 系统 | Windows / macOS 兜底 |

**Loading 策略**:
- Google Fonts CDN（`<link rel="preconnect">` 提前握手）
- `&display=swap` 避免 FOIT
- 一次性加载 ~80KB（gzipped），缓存后 0 成本

### Type scale

| Token | Size | Line height | 用途 |
|---|---|---|---|
| `fs-12` | 12px | 1.4 | 辅助文字、标签、tag |
| `fs-14` | 14px | 1.5 | **正文默认**、按钮、输入 |
| `fs-16` | 16px | 1.5 | 卡片标题、tab |
| `fs-18` | 18px | 1.4 | 表单字段说明 |
| `fs-20` | 20px | 1.4 | 副标题 |
| `fs-24` | 24px | 1.3 | **页面标题**、填写端主题 |
| `fs-32` | 32px | 1.2 | 欢迎页、统计数字 |

### 字体使用规则

- 所有标题/数字/Logo  → `Instrument Sans`，`font-weight: 600`，`letter-spacing: -0.01em`
- 数字/统计/时间戳    → `JetBrains Mono`，**必开** `font-variant-numeric: tabular-nums`
- 一切正文/按钮        → `Satoshi`，`font-weight: 400` 或 `500`
- **不用** `system-ui` / `-apple-system` 作主字体（"AI 偷懒"信号）

---

## Color

**Approach**: restrained — 1 主色 + Slate 中性灰 + 4 语义色

### Brand

| Token | Hex | 用途 |
|---|---|---|
| `primary` | `#2563EB` | CTA、激活、聚焦环 |
| `primary-hover` | `#1D4ED8` | 按钮悬停 |
| `primary-active` | `#1E40AF` | 按钮按下 |
| `primary-bg` | `#EFF6FF` | 选中底色、轻微填充 |
| `primary-border` | `#BFDBFE` | 输入框聚焦边框 |

**为什么选 indigo-600（不用 #4A90E2 / sky-500）**:
- W3C AA 对比 4.69:1（白底 14px），比 #4A90E2（3.18:1）更稳
- 与 Notion / Linear / Figma / Vercel 同级，强化"产品感"
- 行业同级：问卷星 #2C7BE5 · 金数据 #4868FF → indigo 区间

### Neutrals — Slate

| Token | Hex | 用途 |
|---|---|---|
| `text-strong` | `#0F172A` | 标题、关键数字 |
| `text` | `#1E293B` | 标题次级 |
| `text-regular` | `#475569` | 正文 |
| `text-secondary` | `#64748B` | 辅助、说明 |
| `text-placeholder` | `#94A3B8` | 输入占位 |
| `border` | `#E2E8F0` | 默认边框 |
| `border-light` | `#F1F5F9` | 卡片内分隔 |
| `fill` | `#F1F5F9` | hover 浅底 |
| `panel` | `#FFFFFF` | 卡片、表单背景 |
| `page` | `#F8FAFC` | 画布底 |

### Semantic

| Token | Hex | 用途 |
|---|---|---|
| `success` | `#10B981` | 成功、已发布 |
| `warning` | `#F59E0B` | 待审核、警告 |
| `danger` | `#EF4444` | 删除、错误、必填星号 |
| `info` | `#3B82F6` | 提示、链接 |

**约束**: 语义色只能用于其语义场景，**不能** 拿来当装饰。

### Contrast 最低要求

- 文本 vs 背景：≥ 4.5:1（AA）
- 文本 vs 浅背景（如 primary-bg）：≥ 4.5:1
- 非文本对比：≥ 3:1

---

## Spacing

- **Base unit**: 4px
- **Density**: 紧凑（compact）—— 表单编辑器需要密集布局，但保留呼吸感

| Token | px | 典型场景 |
|---|---|---|
| `2xs` | 2px | 标签内边距、分割线 |
| `xs` | 4px | 表单字段内 padding、chip 间距 |
| `sm` | 8px | 卡片内 padding、按钮内 padding |
| `md` | 12px | 卡片间距、输入框高度 |
| `lg` | 16px | 区块内 padding、卡片标题 |
| `xl` | 24px | 区块间 padding |
| `2xl` | 32px | 页面左右 padding、对话框 |
| `3xl` | 48px | 大版块间距、欢迎页 |

**规则**: 出现的间距值必须是 token 之一，**禁止** 13px / 17px 等野值。

---

## Layout

- **Approach**: grid-disciplined（严格 8px 网格）
- **Grid**: 编辑器 3 栏（240 / 自适应 / 320），填写端单列居中（max 640px）
- **Border radius hierarchy**:
  - `sm: 4px` — 标签、dense 控件
  - `md: 8px` — **默认** — 按钮、输入框、卡片、chip
  - `lg: 12px` — 对话框、抽屉
  - `pill: 9999px` — 头像、状态点
- **Shadow**: 极轻三层
  - `card: 0 1px 2px rgba(15,23,42,.04)` — 卡片静止
  - `hover: 0 2px 6px rgba(15,23,42,.06)` — 卡片悬停
  - `modal: 0 12px 32px rgba(15,23,42,.10)` — 抽屉、对话框

### 编辑器栅格

```
┌─────────────────────────────────────────────────┐
│  TopNav  56px                                    │
├──────────┬──────────────────────┬───────────────┤
│ Library  │   Canvas             │  Property     │
│ 240px    │   flex (max 880px)   │  320px        │
│          │                      │               │
│  控件库  │   画布 + 题目卡片     │  属性面板     │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

### 填写端栅格

```
┌──────────────────────────────┐
│  Logo + 表单标题 (居中)       │
│  ─────────────────            │
│  题目卡片 (max 640px)         │
│  题目卡片                     │
│  ─────────────────            │
│  [上一步] [下一题/提交]        │
└──────────────────────────────┘
```

---

## Motion

- **Approach**: minimal-functional
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`（Material standard）— 所有过渡统一用这一个
- **Duration 档**:
  - micro: 50-100ms（hover、focus）
  - short: 150-200ms（按钮按下、卡片激活）
  - medium: 250-400ms（卡片展开、对话框）
- **不使用**:
  - 渐变过渡
  - scroll-driven 动画
  - 弹跳 / 视差
  - 进入页面整体动画（首屏直接呈现）

### 反馈即时性原则

- 题目点击 → 50ms 内高亮
- 选项增删 → 100ms 动画到位
- 拖拽排序 → 实时跟随，无延迟
- 保存 → toast 200ms 内出现，2s 自动消失

---

## Iconography

### 策略

- **首选**: Element Plus Icons（已集成，风格与本规范天然一致）
- **自建**: 业务/行业特定图标走自建 SVG；统一收口在 `demo/src/components/icons/`，禁止在各组件内零散定义
- **强制流程**: 自建图标必须走 `/svg-creator` skill 的渲染验证循环（WRITE → RENDER → VIEW → FIX → DELIVER），禁止只写代码不渲染就交付

### 画法规范

- **画布**: viewBox `0 0 16 16`
- **stroke**: 1.5px，`currentColor`，`stroke-linecap="round"`，`stroke-linejoin="round"`，`fill="none"`
- **几何对齐**: 坐标用整数 + 0.5 偏移（`x="2.5"`、`r="2.4"`），让 stroke 落在整数边界
- **圆角矩形**: 11×11 用 `rx="2"`；11×10 用 `rx="1.5"`
- **实心元素**: 选中点 / 状态指示用 `fill="currentColor" stroke="none"`
- **禁用**: 渐变、阴影、装饰元素、多色（保持单色统一）

### svg-creator 调用约定（覆盖 skill 默认值）

调用 `/svg-creator` 时，必须显式覆盖以下参数以匹配本规范：

- viewBox → `0 0 16 16`
- stroke-width → `1.5`
- 渲染尺寸 → 24px（chip）/ 16px（标准）/ 14px（行内）
- 颜色 → 通过 CSS `color` 控制，SVG 内只用 `currentColor`，**禁止** hex

### 尺寸

| 场景 | 渲染尺寸 |
|---|---|
| 行内（紧贴文字） | 14px |
| 标准（chip / 列表行） | 16px |
| 控件库题型卡片 | 24px |
| 按钮内 | 16px |

### 颜色规则

- **默认**: `var(--c-text-secondary)`
- **激活 / 选中**: `var(--c-primary)`
- **禁用**: `var(--c-text-placeholder)`
- **危险**（删除等）: `var(--c-danger)` —— 仅该场景

### 与文字组合

- **默认**: 图标 + 文字（图标在左）
- **例外**: 高频工具栏按钮可只用图标（必须配 `title` 或 `aria-label`）

### 验收清单（交付前自查）

- [ ] 渲染后目视通过（svg-creator 循环已跑完）
- [ ] 所有描边落在整数边界（坐标用整数 + 0.5 偏移）
- [ ] 实心元素都标了 `fill="currentColor" stroke="none"`
- [ ] SVG 内无硬编码颜色（只有 `currentColor`）
- [ ] 在 16px 尺寸下仍清晰可辨（不依赖细节才能看懂）
- [ ] 与同组图标视觉权重一致（不会某个特别大 / 特别重）

---

## Components（已规划）

| 组件 | 状态 | 备注 |
|---|---|---|
| 按钮（primary/secondary/ghost/icon） | ✅ 设计稿 | demo 已实现 |
| 文本输入（单行/多行） | ✅ 设计稿 | demo 已实现 |
| 题目卡片 | ✅ 设计稿 | demo 已实现 |
| 单选/多选 选项 | ✅ 设计稿 | demo 已实现 |
| 属性面板 | ✅ 设计稿 | demo 已实现 |
| 控件库 chip | ✅ 设计稿 | demo 已实现 |
| 切换开关 | ✅ 设计稿 | demo 已实现 |
| Tab / 标签 | ✅ 设计稿 | demo 已实现 |
| 拖拽手柄 | 🚧 规划中 | 键盘优先是 RISK 3 |
| 题型预览（图片/标签/列表/富文本） | ✅ 设计稿 | demo 已实现 |
| Toast / 消息 | 📋 复用 Element Plus | 不重做 |
| 弹窗 / 抽屉 | 📋 复用 Element Plus | 不重做 |
| 表头 / 表格 | 📋 复用 Element Plus | 配合 mono 字体 |

---

## SAFE / RISK 决议（设计背书）

### SAFE（行业 baseline — 用户的预期）

1. **三栏编辑器**（控件库 / 画布 / 属性面板）— 问卷星/金数据/Typeform 通用，零学习成本
2. **顶部浅色导航 + 侧边栏** — B 端 SaaS 标配
3. **题目卡片 1px 边框 + 极轻阴影** — 通用模式

### RISK（差异化产品脸）

1. **主色从 #4A90E2 → #2563EB（indigo-600）**
   - 收益：更克制、更"产品感"，避免 sky 色的通用组件库感
   - 代价：与原型截图视觉有偏差
   - 对应：DEVELOPER 在 demo 阶段已替换 tokens.css

2. **字体从 system-ui → Instrument Sans + Satoshi + JetBrains Mono**
   - 收益：拉开层级，告别 AI 收敛陷阱，数字真正对齐
   - 代价：~80KB CDN 加载（一次缓存）

3. **键盘优先**（Tab / ↑↓ / Enter 直接编辑）
   - 收益：业务用户搭表单快 2x，对应 memorable thing
   - 代价：每个题目卡片需加键盘焦点环 + 触发逻辑
   - 状态：未实现，后续迭代

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-07 | 锚定 memorable thing "5 分钟搭出专业表单" | 设计方向的产品视角 |
| 2026-08-07 | 主色切换 #4A90E2 → #2563EB | 行业产品感 + AA 对比 |
| 2026-08-07 | 字体三层：Instrument Sans / Satoshi / JetBrains Mono | 摆脱 AI 收敛 |
| 2026-08-07 | 顶部导航白底 + 1px 边框 | 轻量化、不抢内容 |
| 2026-08-07 | 单列填写端、max 640px | 移动端优先、可读性 |
| 2026-08-07 | 设计文件位于 `demo/preview/d5.html` | 预览基线 |

---

## Open Questions

1. **Logo / 品牌名**：当前 demo 用 "采集通"，是否最终品牌名？
2. **暗色模式**：是否要做？demo 暂未实现
3. **国际 / 双语**：是否支持英文界面？影响字体选择
4. **键盘优先（RISK 3）**：是否纳入 v1.0 交付，影响排期

---

## How to use this file

- **新建组件前**：先查 token，不直接写硬编码色值/字号
- **调整设计**：先改 DESIGN.md 决策，再同步 `demo/src/styles/tokens.css`
- **Code Review**：提交前 `git diff` 检查是否动到 token，token 改动必须有 DESIGN.md 同步
- **QA 模式**：UI 不符 DESIGN.md 视为 bug
