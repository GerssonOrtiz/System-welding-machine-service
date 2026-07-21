'use client'

import { useState } from 'react'
import BrandModelManager from '@/components/admin/BrandModelManager'
import PartManager from '@/components/admin/PartManager'

export default function CatalogAdminPage() {
  const [activeTab, setActiveTab] = useState<'parts' | 'brands'>('parts')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
              Catálogo <span className="text-emerald-500">Técnico</span>
            </h1>
            <p className="text-slate-400 text-sm">Gestión de repuestos, marcas y compatibilidad operativa.</p>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('parts')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === 'parts' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              Repuestos
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === 'brands' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              Marcas y Modelos
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'parts' ? (
          <PartManager />
        ) : (
          <BrandModelManager />
        )}
      </div>
    </div>
  )
}
