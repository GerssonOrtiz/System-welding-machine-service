// app/(dashboard)/historial/page.tsx
'use client'

import React, { useState } from 'react'
import { useEquipmentList } from '@/hooks/useEquipmentList'
import EquipmentTable from '@/components/equipment/EquipmentTable'

export default function HistorialPage() {
  const [currentPage, setCurrentPage] = useState(0)
  // Solicitar incluyendo entregados (el ordenamiento por fecha de ingreso es por defecto en la API)
  const { equipments, total, totalPages, isLoading, mutate } = useEquipmentList(currentPage, true)

  return (
    <div className="space-y-6 font-sans text-text-primary p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neon-blue tracking-wider uppercase">📜 Historial General de Equipos</h1>
        <p className="text-text-secondary text-xs mt-1">
          Registro histórico de todos los equipos en el sistema, ordenados por fecha de ingreso (los más recientes primero).
        </p>
      </div>

      {/* Main Table Container */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-neon-blue animate-pulse font-mono text-xs uppercase tracking-widest">
              Cargando historial...
            </span>
          </div>
        ) : (
          <EquipmentTable
            equipments={equipments}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onUpdateSuccess={mutate}
          />
        )}
      </div>
    </div>
  )
}

