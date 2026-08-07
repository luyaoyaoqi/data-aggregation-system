# 数据采集系统 · 表单编辑器 Demo

基于原型（`img/原型截图1.jpg`、`img/原型截图2.jpg`）实现的在线表单设计器后台 Demo。

## 技术栈

| 能力 | 选型 |
| --- | --- |
| 构建 | Vite 5 |
| 框架 | Vue 3（JavaScript，`<script setup>`） |
| UI | Element Plus（按需自动引入） |
| 原子 CSS | UnoCSS（presetUno / presetAttributify / presetIcons） |
| 字体 | Inter（Google Fonts CDN，`index.html` 中 `<link>` 引入） |

## 启动

```bash
npm install
npm run dev      # http://localhost:5173
```

其他命令：

```bash
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

> 依赖尚未安装，首次运行务必先执行 `npm install`。

## 设计 Token

主色 `#4A90E2`、圆角 `8px`、容器底色 `#F5F7FA`、字号档 `12 / 14 / 16 / 20 / 24`。

- CSS 变量定义在 `src/styles/tokens.css`
- Element Plus 主题与圆角覆盖在 `src/styles/element-overrides.css`
- UnoCSS 同名 token 定义在 `uno.config.js` 的 `theme` 中，两边取值保持一致

## 目录结构

```
demo/
├── index.html                  # Inter 字体 CDN
├── vite.config.js              # UnoCSS + Element Plus 按需自动引入
├── uno.config.js               # 颜色 / 字号 / 间距 / 圆角 token
└── src/
    ├── main.js                 # 引入 uno.css、EP 函数式组件样式、token 与主题覆盖
    ├── App.vue
    ├── styles/
    │   ├── tokens.css
    │   └── element-overrides.css
    ├── components/
    │   ├── TopNav.vue              # 顶部 56px 深蓝导航
    │   ├── ComponentLibrary.vue    # 左侧 240px 组件库（同时导出题型元数据与工厂函数）
    │   ├── CardTabs.vue            # 分页 Tab 行
    │   ├── EditorArea.vue          # 中间画布 + 底部操作条
    │   ├── QuestionCard.vue        # 单道题目
    │   ├── PropertyPanel.vue       # 右侧 320px 属性面板
    │   ├── AddQuestionDrawer.vue   # 底部弹出的添加题目抽屉
    │   └── PreviewDialog.vue       # 手机 / 电脑双端预览弹窗
    └── views/
        └── Editor.vue          # 状态中枢：分页、卡片、题目的增删改
```

## 已实现的交互

| # | 交互 | 说明 |
| --- | --- | --- |
| 1 | 分页 Tab 切换 | 点击切换，激活态主色填充 |
| 2 | 添加题目 | 点「+ 添加题目」从底部滑出抽屉（`el-drawer direction="btt"`） |
| 3 | 添加卡片 | 「+ 添加卡片」在当前页末尾追加空卡片 |
| 4 | 新增分页 | Tab 行「+」新增「第 N 页」并自动切换 |
| 5 | 抽屉选题型 | 点击题型 → 抽屉关闭 → 题目插入到目标卡片并自动选中 |
| 6 | 左侧组件库 | 点击 chip 直接插入到当前页最后一张卡片 |
| 7 | 保存 | `ElMessage.success('保存成功')`，同时刷新「最近保存」时间 |
| 8 | 预览 | `el-dialog` 弹出，手机（375px）/ 电脑（640px）双端切换 |
| 9 | 删除分页 / 卡片 / 重置 | `ElMessageBox.confirm` 二次确认；仅剩一项时提示「至少保留一页 / 一张卡片」 |
| 10 | 必填开关 | 属性面板或题目底部工具条切换，题干右侧红星实时显隐 |
| 11 | 选项增删 | 「+ 添加选项」追加，选项右侧 × 删除（保留至少一项） |
| 12 | 复制题目 | 工具条「复制」在原题下方插入副本 |
| 13 | 题型切换 | 属性面板下拉切换题型，切到选项类会自动补齐默认三个选项 |
| 14 | 选项排列 | 属性面板单列 / 双列切换，编辑区与预览同步生效 |

## 实现说明

- **题型元数据**（12 个题型分「选择 / 填空 / 采集」三组）与 `createQuestion`、`createCard`、`createPage`
  等工厂函数，通过 `ComponentLibrary.vue` 的普通 `<script>` 块具名导出，左侧组件库与抽屉共用同一份定义。
- **状态集中在 `views/Editor.vue`**，通过 props 下发、emit 上报。题目 / 选项的文本编辑直接绑定到对象属性
  （`question.title`、`opt.label`），Demo 场景下省去逐字段事件透传；接入真实项目时建议改为 Pinia 或
  `defineModel`。
- 数据全部在内存中，刷新页面即恢复初始状态，未接任何后端接口。

## 与原型的差异

- 原型顶部导航为深蓝色（`#1B3A6B`），主色 `#4A90E2` 用于按钮、激活态与强调元素。
- 「添加题目」在原型中是贴按钮弹出的浮层，本 Demo 按需求改为底部抽屉，题型分组与文案保持一致。
- 原型中的绿色编号气泡与标注虚线属于说明性元素，未在实现中保留。
