import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        status: {
          passed: { bg: '#EAF3DE', text: '#27500A', dot: '#1D9E75' },
          failed: { bg: '#FCEBEB', text: '#791F1F', dot: '#E24B4A' },
          slow: { bg: '#FAEEDA', text: '#633806', dot: '#EF9F27' },
          running: { bg: '#E6F1FB', text: '#0C447C', dot: '#378ADD' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
