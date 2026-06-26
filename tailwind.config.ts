import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070B14',
        surface: '#0D1117',
        'surface-2': '#161B27',
        'surface-3': '#1E2535',
        accent: '#3B82F6',      // electric blue
        'accent-dim': '#2563EB',
        gain: '#10B981',        // green for positive
        loss: '#EF4444',        // red for negative
        amber: '#F59E0B',
        primary: '#F1F5F9',
        secondary: '#94A3B8',
        muted: '#64748B',
        border: '#1E2535',
        'border-2': '#2D3748',
      },
      fontFamily: {
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
