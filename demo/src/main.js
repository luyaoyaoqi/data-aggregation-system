import { createApp } from 'vue'
import App from './App.vue'

// UnoCSS 原子样式（虚拟模块，由 unocss/vite 插件注入）
import 'virtual:uno.css'

// ElMessage / ElMessageBox 属函数式调用，样式需显式引入
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'

// 设计 Token / Element Plus 主题覆盖 / 跨组件业务样式
// （须晚于 EP 样式，保证覆盖生效；EP 内部 class 主题化 → element-overrides，业务 class → global）
import './styles/tokens.less'
import './styles/element-overrides.less'
import './styles/global.less'

createApp(App).mount('#app')
