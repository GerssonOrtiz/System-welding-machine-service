import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fondos
        'bg-base':     '#070A12',
        'bg-surface':  '#0B0F1A',
        'bg-elevated': '#111827',

        // Colores primarios (neón)
        'neon-blue':   '#00E5FF',
        'electric':    '#0052FF',
        'neon-purple': '#9D4EDD',

        // Semánticos
        'success': '#10B981',
        'warning': '#F59E0B',
        'error':   '#EF4444',
        'info':    '#00E5FF',

        // Texto
        'text-primary':   '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted':     '#475569',

        // Estados de equipos (badges)
        'status-waiting':     '#00E5FF',
        'status-diagnosis':   '#0052FF',
        'status-parts':       '#9D4EDD',
        'status-pending':     '#F59E0B',
        'status-parts-ready': '#6366F1',
        'status-approved':    '#10B981',
        'status-maintenance': '#0052FF',
        'status-delivered':   '#6B7280',
      },
      boxShadow: {
        'neon-blue':   '0 0 12px rgba(0, 229, 255, 0.4), 0 0 30px rgba(0, 229, 255, 0.1)',
        'neon-purple': '0 0 12px rgba(157, 78, 221, 0.4), 0 0 30px rgba(157, 78, 221, 0.1)',
        'neon-red':    '0 0 12px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.1)',
        'neon-green':  '0 0 12px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'], // Para FRs, números de serie
      },
      keyframes: {
        // Glow pulsante para equipos atrasados (>5 días)
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        slideOut: {
          from: { transform: 'translateY(0)',    opacity: '1' },
          to:   { transform: 'translateY(8px)',  opacity: '0' },
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'fade-in':    'fadeIn 150ms ease-out',
        'slide-in':   'slideIn 200ms ease-out',
        'slide-out':  'slideOut 200ms ease-in',
      },
    },
  },
  plugins: [],
}

export default config
