import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    vueDevTools(),
    // 自动引入 Vue / Element Plus 的组合式 API 与 ElMessage、ElMessageBox 等
    AutoImport({
      imports: ['vue'],
      resolvers: [ElementPlusResolver()],
      dts: false
    }),
    // Element Plus 组件按需自动注册
    Components({
      resolvers: [ElementPlusResolver()],
      dts: false
    })
  ],
  // Less:暴露常用 token 给组件 <style lang="less">,允许嵌套
  css: {
    preprocessorOptions: {
      less: {
        // 把 CSS 变量 / 常用 token 注入 less 作用域,组件里可直接 @primary 引用
        additionalData: `
          @primary: #2563EB;
          @primary-hover: #1D4ED8;
          @primary-bg: #EFF6FF;
          @primary-border: #BFDBFE;
          @danger: #EF4444;
          @danger-strong: #DC2626;
          @success: #10B981;
          @warning: #F59E0B;
          @text: #1E293B;
          @text-regular: #475569;
          @text-secondary: #64748B;
          @text-placeholder: #94A3B8;
          @line: #E2E8F0;
          @line-light: #F1F5F9;
          @fill: #F1F5F9;
          @panel: #FFFFFF;
          @fs-12: 12px;
          @fs-13: 13px;
          @fs-14: 14px;
          @fs-16: 16px;
          @sp-xs: 4px;
          @sp-sm: 8px;
          @sp-md: 12px;
          @sp-lg: 16px;
          @sp-xl: 24px;
          @radius: 8px;
          @radius-sm: 4px;
          @radius-lg: 12px;
          @dur: 0.15s;
        `
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
