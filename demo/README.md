# 数据采集系统 · 表单编辑器 Demo

在线表单设计器原型：可视化搭建（左侧组件库 → 中间画布 → 右侧属性面板），支持独立窗口预览、表单设置、localStorage 存档。

> 设计系统真源：[`../DESIGN.md`](../DESIGN.md)
> 项目规划：[`../README.md`](../README.md)
> 工程约定：[`../CLAUDE.md`](../CLAUDE.md)

---

## 技术栈

| 能力 | 选型 |
|---|---|
| 构建 | Vite 6 |
| 框架 | Vue 3（JavaScript，`<script setup>`） |
| UI | Element Plus（按需自动引入） |
| 原子 CSS | UnoCSS（presetUno / presetAttributify / presetIcons） |
| 字体 | Instrument Sans（Google Fonts）+ Satoshi（Fontshare）+ JetBrains Mono |
| 样式预处理 | Less（设计 token / EP 覆盖 / 业务样式） |
| 包管理 | pnpm |

---

## 启动

```bash
pnpm install
pnpm dev      # 编辑器 · http://localhost:5173
```

独立预览（不开编辑器）：

```bash
# 直接用静态文件服务打开 preview.html，或
pnpm dev --config vite.config.preview.js   # 视 vite 配置而定
# 也可访问 demo/preview/d5.html（设计系统预览页）
```

构建产物：

```bash
pnpm build        # 输出到 dist/
pnpm preview:vite # vite preview 本地预览构建产物
```

> 首次运行需先 `pnpm install`。

---

## 设计 Token

| 维度 | 取值 | 真源 |
|---|---|---|
| 主色 | `#2563EB`（indigo-600） | [src/styles/tokens.less](src/styles/tokens.less)（品牌层） |
| 容器底色 | `#F8FAFC` | `tokens.less` |
| 圆角 | 4 / 8 / 12 / 999 | `tokens.less` |
| 字号 | 12 / 14 / 16 / 20 / 24 | `tokens.less` + `uno.config.js` |

样式分层：

- **品牌层 / 形状层 / EP 桥接层**（含 `--c-primary` / `--el-color-primary` 等所有派生变量）→ [src/styles/tokens.less](src/styles/tokens.less)
- **EP 内部 class 主题化**（只放 `.el-*`）→ [src/styles/element-overrides.less](src/styles/element-overrides.less)
- **跨组件业务样式**（`.btn-*` / `.tool-*` / `.alert-*` / `.table-preview-*` / `.pill-active` 等）→ [src/styles/global.less](src/styles/global.less)
- UnoCSS 同名 token 在 [uno.config.js](uno.config.js) 的 `theme` 中定义，两边取值保持一致

> 改 token 必须先动 [DESIGN.md](../DESIGN.md) 决策，再同步 `tokens.less`；不要在组件里硬编码。

---

## 目录结构

```
demo/
├── index.html                    # 编辑器入口（字体 CDN）
├── preview.html                  # 独立预览入口（/src/preview-main.js）
├── vite.config.js                # UnoCSS + Element Plus 按需自动引入
├── uno.config.js                 # 颜色 / 字号 / 间距 / 圆角 token
├── preview/                      # 设计系统 / 早期原型预览页
│   ├── d1.html ~ d5.html
│   ├── board.html
│   └── README.md
└── src/
    ├── main.js                   # 编辑器启动
    ├── preview-main.js           # 独立预览启动
    ├── App.vue
    ├── PreviewStandalone.vue     # 独立预览用（渲染表单 + 收集答案）
    ├── styles/
    │   ├── tokens.less              # 设计 Token 真源（品牌层 + EP 桥接层）
    │   ├── element-overrides.less   # EP 内部 class 主题化
    │   ├── global.less              # 跨组件业务 class
    │   └── tokens-color.json        # 颜色 token 快照（用于设计稿核对）
    ├── components/
    │   ├── ComponentLibrary.vue    # 左侧组件库（导出题型元数据 + 工厂函数）
    │   ├── CardTabs.vue            # 分页 Tab 行
    │   ├── EditorArea.vue          # 中间画布 + 底部操作条 + 题目拖拽排序
    │   ├── QuestionCard.vue        # 单道题目（含 popover 选题型）
    │   ├── TypeChipGrid.vue        # 题型选择网格（popover 内容）
    │   ├── PropertyPanel.vue       # 右侧 320px 属性面板
    │   ├── FormSettingsDialog.vue  # 表单设置弹窗（序号 / 跨页连续 / 跨卡片连续）
    │   ├── FormFill.vue            # 填表模式（独立预览用）
    │   ├── ListQuestionSettings.vue# 名单类题型专项设置
    │   └── OptionLinkDialog.vue    # 选项跳转 / 关联设置
    ├── views/
    │   └── Editor.vue              # 状态中枢：表单 / 分页 / 卡片 / 题目 + settingsDialog
    ├── data/
    │   └── medicalTerms.js         # 医学术语字典（名单类题型自动联想）
    └── utils/
        └── storage.js              # localStorage 存档 / 读档 / 清空
```

---

## 数据持久化

- 表单定义通过 [src/utils/storage.js](src/utils/storage.js) 持久化到 `localStorage`（key：`dce.form`）
- 启动时静默恢复上次存档（解析失败则用默认演示数据，含全 12 种题型）；保存按钮触发显式存档
- 当前不接任何后端 API；刷新页面存档仍在

---

## 关键能力（当前实现）

- **分页 Tab**：切换 / 新增 / 删除 / 重命名（保留至少一页）
- **卡片管理**：增删 / 拖拽排序（卡片内题目上下移动）
- **题目操作**：增删 / 复制 / 题型切换 / 必填切换 / 选项增删 / 选项排列（单列/双列）/ 上下拖拽
- **题型**：12 种（选择 / 填空 / 采集三组）
- **表单设置**：显示序号 / 跨页连续编号 / 跨卡片连续编号（弹窗）
- **预览**：独立窗口预览（`preview.html`），手机 / 电脑双端
- **存档**：localStorage 持久化 + 重置

---

## 关键工作流（摘要）

完整版见 [`../CLAUDE.md`](../CLAUDE.md)。

- **改 token**：先改 [DESIGN.md](../DESIGN.md) 决策 → 同步 [src/styles/tokens.less](src/styles/tokens.less) → 不动组件
- **新增全局业务样式**：先查 [src/styles/global.less](src/styles/global.less) 是否有同类 class → 没有按命名约定添加
- **涉及 EP 内部 class**（`.el-*`）：写 [src/styles/element-overrides.less](src/styles/element-overrides.less)；teleport 组件必须全局、不能 scoped
- **新建组件**：先查 [DESIGN.md](../DESIGN.md) 现有 token + [src/styles/global.less](src/styles/global.less) 已有 class，不直接写硬编码

---

## 与设计系统的对应关系

| 设计系统维度 | 项目内落点 |
|---|---|
| 颜色 / 字体 / 间距 / 圆角 / 阴影 | `src/styles/tokens.less`（品牌层）+ `uno.config.js`（同名 token） |
| EP 主题（按钮 / 输入框 / 弹窗等） | `src/styles/element-overrides.less` |
| 业务组件 class（按钮 / 工具条 / 提示 / RTE / 表格预览 / pill 激活态） | `src/styles/global.less` |
| 设计决策（产品 / 美学） | [DESIGN.md](../DESIGN.md) |
| 工程约定 / 命名 / 提交检查 | [CLAUDE.md](../CLAUDE.md) |

> QA 模式下，任何代码与 [DESIGN.md](../DESIGN.md) 不符视为 bug。