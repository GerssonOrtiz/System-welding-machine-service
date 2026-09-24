// app/(dashboard)/admin/catalog/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePageTitle } from '@/hooks/usePageTitle'
import BrandModelManager from '@/components/admin/BrandModelManager'
import PartManager from '@/components/admin/PartManager'
import { Wrench, Layers, ArrowLeft, BookOpen } from 'lucide-react'

export default function CatalogAdminPage() {
  usePageTitle('Catálogo')
  const [activeTab, setActiveTab] = useState<'parts' | 'brands'>('parts')

  return (
    <div className="space-y-6 font-sans text-text-primary max-w-7xl mx-auto">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-neon-blue transition-colors font-mono uppercase tracking-wider"
            >
              <ArrowLeft size={13} />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider uppercase text-neon-blue">
                Catálogo Técnico
              </h1>
              <p className="text-text-secondary text-xs mt-0.5">
                Gestión centralizada de repuestos, marcas, modelos y compatibilidades operativas.
              </p>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex items-center bg-bg-surface border border-border-subtle p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'parts'
                ? 'bg-electric text-white shadow-[0_0_12px_rgba(0,82,255,0.4)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <Wrench size={14} />
            <span>Repuestos</span>
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'brands'
                ? 'bg-neon-purple text-white shadow-[0_0_12px_rgba(157,78,221,0.4)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <Layers size={14} />
            <span>Marcas y Modelos</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'parts' ? (
          <PartManager />
        ) : (
          <BrandModelManager />
        )}
      </div>
    </div>
  )
}
