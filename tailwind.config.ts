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

        // NUEVO — Fondos forge
        'bg-forge':      '#06080F',
        'bg-forge-mid':  '#0A0C17',
        'bg-forge-high': '#0E1120',
        'bg-glass':      'rgba(14, 17, 32, 0.60)',

        // NUEVO — Acento ámbar
        'amber-core':    '#F59E0B',
        'amber-glow':    '#FBBF24',
        'amber-deep':    '#D97706',
        'amber-ghost':   'rgba(245, 158, 11, 0.08)',
        'amber-border':  'rgba(245, 158, 11, 0.20)',
        'amber-shine':   'rgba(245, 158, 11, 0.40)',

        // NUEVO — Naranja forja
        'forge-orange':  '#EA580C',
        'forge-bright':  '#F97316',
        'forge-ghost':   'rgba(234, 88, 12, 0.08)',

        // NUEVO — Texto forge
        'text-forge':     '#F5F0E8',
        'text-forge-mid': '#A89880',
        'text-forge-dim': '#5C4F3D',
      },
      boxShadow: {
        'neon-blue':   '0 0 12px rgba(0, 229, 255, 0.4), 0 0 30px rgba(0, 229, 255, 0.1)',
        'neon-purple': '0 0 12px rgba(157, 78, 221, 0.4), 0 0 30px rgba(157, 78, 221, 0.1)',
        'neon-red':    '0 0 12px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.1)',
        'neon-green':  '0 0 12px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.1)',
        // NUEVO — Sombras ámbar / glass
        'amber-sm':   '0 0 8px rgba(245, 158, 11, 0.25)',
        'amber-md':   '0 0 16px rgba(245, 158, 11, 0.35), 0 0 32px rgba(245, 158, 11, 0.10)',
        'amber-lg':   '0 0 24px rgba(245, 158, 11, 0.45), 0 0 48px rgba(245, 158, 11, 0.15)',
        'forge':      '0 0 12px rgba(234, 88, 12, 0.35), 0 0 24px rgba(234, 88, 12, 0.10)',
        'glass':      '0 8px 32px rgba(0, 0, 0, 0.60), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'vip-amber':  '0 0 20px rgba(245, 158, 11, 0.60), 0 0 40px rgba(245, 158, 11, 0.20)',
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
        amberPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(245, 158, 11, 0.35), 0 0 0 1px rgba(245, 158, 11, 0.20)' },
          '50%':      { boxShadow: '0 0 28px rgba(245, 158, 11, 0.70), 0 0 0 1px rgba(245, 158, 11, 0.50)' },
        },
        glassIn: {
          from: { opacity: '0', transform: 'scale(0.98) translateY(6px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
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
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'amber-pulse':   'amberPulse 2.5s ease-in-out infinite',
        'glass-in':      'glassIn 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in':       'fadeIn 150ms ease-out',
        'slide-in':      'slideIn 200ms ease-out',
        'slide-out':     'slideOut 200ms ease-in',
      },
    },
  },
  plugins: [],
}

export default config
