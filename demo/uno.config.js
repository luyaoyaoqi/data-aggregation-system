import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle'
      }
    })
  ],
  theme: {
    colors: {
      // 与 src/styles/tokens.css 保持一致
      primary: {
        DEFAULT: '#4A90E2',
        hover: '#3A7BC8',
        active: '#2F6BB0',
        light: '#EAF2FC',
        border: '#B9D4F3'
      },
      nav: '#1B3A6B',
      navHover: '#264C87',
      page: '#F5F7FA',
      panel: '#FFFFFF',
      line: '#E4E7ED',
      text: {
        DEFAULT: '#1F2329',
        regular: '#4E5969',
        secondary: '#86909C',
        placeholder: '#C0C4CC'
      },
      danger: '#F56C6C'
    },
    fontSize: {
      xs: ['12px', '18px'],
      sm: ['14px', '22px'],
      base: ['16px', '24px'],
      lg: ['20px', '28px'],
      xl: ['24px', '32px']
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px'
    },
    borderRadius: {
      DEFAULT: '8px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      pill: '999px'
    }
  },
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'panel-card': 'bg-white rounded-md border border-line',
    'chip-base':
      'inline-flex items-center justify-center h-32px px-md text-sm rounded-pill border border-line bg-white text-text-regular cursor-pointer select-none transition-all duration-150'
  }
})
