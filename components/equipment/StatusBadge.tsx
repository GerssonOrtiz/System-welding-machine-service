// components/equipment/StatusBadge.tsx
import React from 'react'

interface StatusBadgeProps {
  status: string
  color?: string
}

// Fallback color map based on status names
const STATUS_COLORS: Record<string, string> = {
  'En espera de diagnóstico': '#00E5FF',
  'En diagnóstico': '#0052FF',
  'En espera de repuesto': '#9D4EDD',
  'Pendiente de aprobación': '#F59E0B',
  'Aprobado': '#10B981',
  'En mantenimiento': '#0052FF',
  'En espera de repuesto adicional': '#9D4EDD',
  'Entregado': '#10B981',
}

export default function StatusBadge({ status, color }: StatusBadgeProps) {
  const badgeColor = color || STATUS_COLORS[status] || '#6B7280'

  return (
    <span
      style={{
        backgroundColor: `${badgeColor}15`, // 8% - 15% opacidad
        border: `1px solid ${badgeColor}50`, // 31% - 50% opacidad
        color: badgeColor,
        boxShadow: `0 0 8px ${badgeColor}30`, // glow suave
      }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider font-sans uppercase"
    >
      {status}
    </span>
  )
}
