# Design System — 脉景问卷（数据采集系统）

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
| **Display / 标题** | PingFang SC | 系统 | macOS / iOS 系统中文，默认；标题字重 600 + letter-spacing -0.01em 强化层级 |
| **Body / 正文** | PingFang SC | 系统 | 同上；正文 400/500，长时间阅读不疲劳 |
| **Data / 数字** | JetBrains Mono | Google Fonts | 开 `tabular-nums`，表格/统计列对齐（**不改**，对齐需求远超中文字体选择） |
| **Code** | JetBrains Mono | Google Fonts | 等宽 |
| **跨平台兜底** | PingFang SC → Hiragino Sans GB → Microsoft YaHei → system-ui | 系统 | macOS / iOS → Windows / Linux 安然回退 |

**Loading 策略**:
- 主字体走系统字体（PingFang SC），**零网络成本**，无 FOIT
- 仅 JetBrains Mono（数字 / 代码）走 Google Fonts CDN，`display=swap`
- 不再加载 Instrument Sans / Satoshi

### Type scale

| Token | Size | Line height | 用途 |
|---|---|---|---|
| `fs-11` | 11px | 1.4 | 极小辅助（列宽标签、表格次级） |
| `fs-12` | 12px | 1.4 | 辅助文字、标签、tag |
| `fs-13` | 13px | 1.4 | 预览表格 / 列设置小字（介于 12 与 14 之间） |
| `fs-14` | 14px | 1.5 | **正文默认**、按钮、输入 |
| `fs-15` | 15px | 1.5 | 备用档（暂未使用） |
| `fs-16` | 16px | 1.5 | 卡片标题、tab |
| `fs-18` | 18px | 1.4 | 表单字段说明、对话框头图标 |
| `fs-20` | 20px | 1.4 | 副标题 |
| `fs-24` | 24px | 1.3 | **页面标题**、填写端主题 |
| `fs-32` | 32px | 1.2 | 欢迎页、统计数字 |

### 字体使用规则

- 所有标题 / Logo / 数据卡片头 → `var(--ff-display)`（PingFang SC），`font-weight: 600`，`letter-spacing: -0.01em`
- 一切正文 / 按钮 / 输入 / 提示文字 → `var(--ff-body)`（PingFang SC），`font-weight: 400` 或 `500`
- 数字 / 统计 / 时间戳 / 代码 → `var(--ff-mono)`（JetBrains Mono），**必开** `font-variant-numeric: tabular-nums`
- 跨平台保证：Windows / Linux 没有 PingFang SC 时自动落到 Microsoft YaHei，无需额外配置

---

## Color

**Approach**: restrained — 1 主色 + Slate 中性灰 + 4 语义色

### Brand

| Token | Hex | 用途 |
|---|---|---|
| `primary` | `#2563EB` | CTA、激活、聚焦环 |
| `primary-rgb` | `37,99,235` | 拖拽阴影 / 透明色派生（alpha 通道用） |
| `primary-hover` | `#1D4ED8` | 按钮悬停 |
| `primary-active` | `#1E40AF` | 按钮按下 |
| `primary-bg` | `#EFF6FF` | 选中底色、轻微填充（也作 `--c-primary-light` 别名） |
| `primary-border` | `#BFDBFE` | 输入框聚焦边框 |
| `on-primary` | `#FFFFFF` | 主色实底上的文字（如 Pill 激活态） |

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
| `text-disabled` | `#CBD5E1` | 禁用态文字 |
| `border` | `#E2E8F0` | 默认边框 |
| `border-light` | `#F1F5F9` | 卡片内分隔 |
| `fill` | `#F1F5F9` | hover 浅底 |
| `fill-hover` | `#F8FAFC` | 更浅的悬浮态（消除 `--c-fill` 在白底上的对比不足） |
| `panel` | `#FFFFFF` | 卡片、表单背景 |
| `overlay-strong` | `rgba(15,23,42,.6)` | 图片/媒体上的半透明遮罩按钮底（派生自 `text-strong`） |
| `page` | `#F8FAFC` | 画布底 |
| `stage` | `#EEF1F6` | 预览舞台底色（深于 page，区分"嵌入式预览"） |
| `scroll-thumb` | `#CBD5E1` | 滚动条滑块 |
| `scroll-thumb-hover` | `#94A3B8` | 滚动条滑块 hover |

### Semantic

每个语义色都有完整的「色值 - hover - 浅底 - 描边 - 反白」5 件套，可直接对应 Element Plus 同名变量。

| Token | Hex | 用途 |
|---|---|---|
| `success` | `#10B981` | 成功、已发布 |
| `success-hover` | `#059669` | success 按钮悬停 |
| `success-bg` | `#ECFDF5` | success 浅底 |
| `success-border` | `#A7F3D0` | success 描边 |
| `on-success` | `#FFFFFF` | success 实底上的文字 |
| `warning` | `#F59E0B` | 待审核、警告 |
| `warning-hover` | `#D97706` | warning 按钮悬停 |
| `warning-text` | `#B45309` | warning 提示条文字（amber-700，比 warning 主色更深更易读） |
| `warning-bg` | `#FFFBEB` | warning 浅底 |
| `warning-border` | `#FDE68A` | warning 描边 |
| `on-warning` | `#FFFFFF` | warning 实底上的文字 |
| `danger` | `#EF4444` | 删除、错误、必填星号 |
| `danger-strong` | `#DC2626` | 深红（red-600，RTE 红字按钮、删除强提示） |
| `danger-hover` | `#DC2626` | danger 按钮悬停 |
| `danger-bg` | `#FEF2F2` | danger 浅底 |
| `danger-border` | `#FECACA` | danger 描边 |
| `on-danger` | `#FFFFFF` | danger 实底上的文字 |
| `info` | `#3B82F6` | 提示、链接 |
| `info-hover` | `#2563EB` | info 按钮悬停 |
| `info-bg` | `#EFF6FF` | info 浅底 |
| `info-border` | `#BFDBFE` | info 描边 |
| `on-info` | `#FFFFFF` | info 实底上的文字 |

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
  - `xs: 3px` — 选项标记方框（多选）、dense 标记
  - `sm: 4px` — 标签、dense 控件
  - `md: 6px` — 小号按钮（`--el-button--small`）
  - `lg: 12px` — 对话框、抽屉
  - `pill: 9999px` — 头像、状态点
  - **默认** `8px`（`--radius`）—— 按钮、输入框、卡片、chip
- **Shadow**: 6 层（从极轻到浮起）
  - `card: 0 1px 2px rgba(15,23,42,.04)` — 卡片静止
  - `hover: 0 2px 6px rgba(15,23,42,.06)` — 卡片悬停
  - `modal: 0 12px 32px rgba(15,23,42,.10)` — 抽屉、对话框
  - `float: 0 8px 24px rgba(15,23,42,.12)` — 设备框、悬浮元素
  - `drag: 0 8px 20px rgba(37,99,235,.25)` — 拖拽中主体
  - `drag-edge: 0 0 1px rgba(37,99,235,.45)` — 拖拽中边线 / 占位条

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
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`（Material standard）— 暴露为 token `--ease`
- **Duration 档**（暴露为 token，组件写法统一 `transition: all var(--dur) var(--ease)`）：
  - `--dur: 0.15s` — 默认 / 短动画（hover、focus、按钮按下）
  - `--dur-slow: 0.2s` — 中等动画（设备框切换宽度）
  - 长动画（250-400ms）项目内罕见，暂不暴露 token，按需内联
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

## Style Architecture

CSS 分三层,职责严格分离。新增样式必须先判断归属,不要混用。

| 文件 | 职责 | 谁来改 |
|---|---|---|
| `tokens.less` | 设计 Token 真源 · 分两层:品牌层 (`--c-*` / `--fs-*` / `--sp-*` / `--radius-*` / `--shadow-*` / `--dur` / `--ease`) + EP 桥接层 (`--el-color-*` / `--el-text-color-*` / `--el-border-color-*` / `--el-fill-color-*` / `--el-mask-color-*` / `--el-disabled-*`)。所有 EP 颜色由品牌层派生 | 设计师 / 设计 owner |
| `element-overrides.less` | EP 内部 class 主题化（`.el-input__wrapper` 圆角、`.el-dialog` padding、`.el-dropdown-menu` 对齐等）。**只放 `.el-*` 选择器**,业务 class 全部搬到 global.less | 开发 |
| `global.less` | 跨组件复用的**业务 class** —— 按钮、工具条、提示、表格预览、富文本、上传框等。无 EP 内部 class | 开发 |

### 全局业务 class 清单（global.less）

**命名约定**:`.btn-*` 按钮 · `.tool-*` 工具条 · `.u-*` 通用 utility · `.rte-*` 富文本 · `.alert-*` 提示 · `.table-preview-*` 列表预览 · `.pill-active` 激活态 · `.option-mark` · `.drag-grip`

| Class | 替代的旧局部 class | 用途 |
|---|---|---|
| `.btn-text-primary` | `.add-option` `.list-settings-btn` `.pq-list-add-row` | 主色文字按钮（hover 主色深） |
| `.btn-text-primary-sm` | `.opt-add` `.col-add` | 同上的小号变体（font-12） |
| `.btn-outline-dashed-primary` | `.opt-set-default` `.opt-link-btn` | 主色虚线描边按钮 |
| `.btn-icon-ghost` | `.option-del` `.link-clear` `.card-del` `.tab-close` `.opt-del` | 中性图标按钮（hover 变 danger） |
| `.tool-btn` `.tool-divider` `.tool-label` `.toolbar` | `.q-tools` `.tool-*` 局部副本 | 题目底部 / 列设置底部工具条 |
| `.row` `.row-tight` `.row-label` | `.switch-row` `.switch-label` `.col-row` | flex 横行 + 行内 label |
| `.tip` `.tip.is-warn` `.tip.is-muted` | `.section-tip` `.list-hint` `.list-warn` | 灰色提示文本 |
| `.section-title` | `.group-title` | section 分组小标题 |
| `.w-full` | 各处 `width: 100%` | 100% 宽度 |
| `.option-mark` `.is-square` | `.option-mark` `.pq-mark` | 单选/多选圆点/方框 |
| `.drag-grip` | `.q-drag` `.width-bar-grip` | 拖拽手柄 |
| `.alert` `.is-warning` `.is-info` | `.link-tip` `.fsd-tip` | 提示条 |
| `.upload-box` | `.upload-box` `.pq-upload` | 上传占位框 |
| `.rte` `.rte__toolbar` `.rte__btn` `.rte__btn.is-blue/.is-red/.is-italic/.is-list` `.rte__dot` `.rte__area` | `.rich-*` `.pq-rte-*` | 富文本编辑器（两套重复样式合并） |
| `.table-preview` `.table-preview__head` `.table-preview__cell` `.table-preview__cell--head` `.table-preview__cell--body` `.table-preview__required` | `.ltp-*` `.pq-list-table` | 列表预览表格 |
| `.pill-active` | `.tab-item.is-active` `.page-tab.is-active` | 主色实底白字激活态 |

**新增样式的工作流**:
1. 跨组件复用 → 提到 `global.less`,命名走上述前缀
2. 仅当前组件用 → 写在组件 `<style scoped lang="less">`
3. 涉及 EP 内部 class → 写 `element-overrides.less`（注意 teleport 组件 dropdown/popover/message 等必须在全局）
4. 涉及 EP 颜色变量 → 写 `tokens.less` 的 EP 桥接层

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

2. ~~**字体从 system-ui → Instrument Sans + Satoshi + JetBrains Mono**~~
   - 历史状态：2026-08-07 锚定的 RISK 2
   - 翻转（2026-08-17）：主字体切回 PingFang SC（系统中文），仅保留 JetBrains Mono 用于数字 / 代码
   - 翻转原因：业务用户多在中文环境，Satoshi + Instrument Sans 的"工业感差异化"对中文渲染 0 增益，反而引入 ~80KB CDN 成本和 FOIT 风险
   - 数字对齐仍是约束：JetBrains Mono + `tabular-nums` 不动

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
| 2026-08-17 | 主字体切回 PingFang SC（移除 Instrument Sans / Satoshi） | 中文环境下系统字体验最优、零 CDN 成本；数字仍走 JetBrains Mono |

---

## Open Questions

1. ~~**Logo / 品牌名**：当前 demo 用 "采集通"，是否最终品牌名？~~ → 已确定为「脉景问卷」
2. **暗色模式**：是否要做？demo 暂未实现
3. **国际 / 双语**：是否支持英文界面？影响字体选择
4. **键盘优先（RISK 3）**：是否纳入 v1.0 交付，影响排期

---

## How to use this file

- **新建组件前**：先查 [Style Architecture](#style-architecture) 与全局 class 清单；若已存在对应 class（如 `.btn-text-primary`），直接复用，不要在 scoped 里重写
- **调整设计**：先改 DESIGN.md 决策（含 token 表 / class 清单），再同步 `demo/src/styles/tokens.less` → `element-overrides.less` → `global.less`；组件 `<style scoped lang="less">` 不要动
- **新增业务样式**：先判断归属（全局 / 当前组件 / EP 内部 class），不要把跨组件样式塞进 scoped
- **Code Review**：提交前 `git diff demo/src/styles/` 检查是否动到 token 或全局 class，token 改动必须有 DESIGN.md 同步
- **QA 模式**：UI 不符 DESIGN.md 视为 bug
