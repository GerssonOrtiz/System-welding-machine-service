// components/ui/EmptyState.tsx
// Componente reutilizable para estados vacíos en tablas, listas y secciones.
// Uso: <EmptyState icon={Package} title="Sin equipos" description="No hay equipos registrados aún." action={<button>...</button>} />

import { type LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  /** Ícono de lucide-react a mostrar. Default: Inbox */
  icon?: LucideIcon
  /** Título principal */
  title: string
  /** Descripción secundaria opcional */
  description?: string
  /** Elemento React para la acción sugerida (botón, link, etc.) */
  action?: React.ReactNode
  /** Tamaño compacto para usar dentro de secciones pequeñas */
  compact?: boolean
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 gap-2' : 'py-16 gap-3'
      }`}
    >
      {/* Ícono con halo sutil */}
      <div className={`rounded-full bg-amber-ghost border border-amber-border/30 flex items-center justify-center shadow-glass ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <Icon
          size={compact ? 18 : 24}
          className="text-amber-core/60"
          strokeWidth={1.5}
        />
      </div>

      {/* Textos */}
      <div className="space-y-1">
        <p className={`font-semibold text-text-forge ${compact ? 'text-xs' : 'text-sm'}`}>
          {title}
        </p>
        {description && (
          <p className={`text-text-forge-mid ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {description}
          </p>
        )}
      </div>

      {/* Acción */}
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  )
}
