// components/ui/ToasterProvider.tsx
'use client'

import { Toaster } from 'sonner'

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0B0F1A',
          color: '#F1F5F9',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 0 12px rgba(0, 229, 255, 0.2)',
        },
        classNames: {
          error: 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)] bg-[#0B0F1A] text-red-400',
          success: 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-[#0B0F1A] text-emerald-400',
          warning: 'border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)] bg-[#0B0F1A] text-amber-400',
        }
      }}
    />
  )
}
