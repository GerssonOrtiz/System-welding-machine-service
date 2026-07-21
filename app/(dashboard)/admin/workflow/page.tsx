// app/(dashboard)/admin/workflow/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'

interface StateItem {
  id: number
  name: string
  order_index: number
  color: string
  is_initial: boolean
  is_terminal: boolean
}

interface TransitionItem {
  id: number
  from_state_id: number
  from_state_name: string
  to_state_id: number
  to_state_name: string
  allowed_roles: string[]
}

export default function AdminWorkflowPage() {
  const { role } = useUser()
  const [states, setStates] = useState<StateItem[]>([])
  const [transitions, setTransitions] = useState<TransitionItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modales y formularios
  const [isStateModalOpen, setIsStateModalOpen] = useState(false)
  const [editingState, setEditingState] = useState<StateItem | null>(null)
  const [stateForm, setStateForm] = useState({
    name: '',
    order_index: 0,
    color: '#00E5FF',
    is_initial: false,
    is_terminal: false,
  })

  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false)
  const [transitionForm, setTransitionForm] = useState({
    from_state_id: '',
    to_state_id: '',
    allowed_roles: [] as string[],
  })

  const rolesOptions = ['superadmin', 'admin', 'operaciones', 'recepcion', 'almacen']

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resStates, resTransitions] = await Promise.all([
        fetch('/api/workflow/states'),
        fetch('/api/workflow/transitions'),
      ])

      const dataStates = await resStates.json()
      const dataTransitions = await resTransitions.json()

      if (dataStates.success) {
        setStates(dataStates.data)
      } else {
        toast.error(dataStates.error || 'Error al cargar estados')
      }

      if (dataTransitions.success) {
        setTransitions(dataTransitions.data)
      } else {
        toast.error(dataTransitions.error || 'Error al cargar transiciones')
      }
    } catch {
      toast.error('Error de red al cargar el flujo de trabajo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'superadmin') {
      fetchData()
    }
  }, [role])

  if (role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-2 p-6">
        <h2 className="text-xl font-extrabold uppercase text-red-500 tracking-wider">Acceso Restringido</h2>
        <p className="text-text-secondary text-sm max-w-md text-center">
          Esta sección está disponible exclusivamente para el rol de Superadministrador.
        </p>
      </div>
    )
  }

  // --- Manejo de Estados ---
  const handleOpenStateCreate = () => {
    setEditingState(null)
    setStateForm({
      name: '',
      order_index: states.length > 0 ? Math.max(...states.map((s) => s.order_index)) + 10 : 10,
      color: '#00E5FF',
      is_initial: false,
      is_terminal: false,
    })
    setIsStateModalOpen(true)
  }

  const handleOpenStateEdit = (state: StateItem) => {
    setEditingState(state)
    setStateForm({
      name: state.name,
      order_index: state.order_index,
      color: state.color,
      is_initial: state.is_initial,
      is_terminal: state.is_terminal,
    })
    setIsStateModalOpen(true)
  }

  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingState ? `/api/workflow/states/${editingState.id}` : '/api/workflow/states'
      const method = editingState ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateForm),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingState ? 'Estado actualizado' : 'Estado creado con éxito')
        setIsStateModalOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Error al guardar el estado')
      }
    } catch {
      toast.error('Error de red al guardar el estado')
    }
  }

  const handleDeleteState = async (stateId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este estado? Solo se eliminará si no tiene equipos vinculados.')) {
      return
    }

    try {
      const res = await fetch(`/api/workflow/states/${stateId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Estado eliminado')
        fetchData()
      } else {
        toast.error(data.error || 'Error al eliminar el estado')
      }
    } catch {
      toast.error('Error de red al eliminar el estado')
    }
  }

  // --- Manejo de Transiciones ---
  const handleOpenTransitionCreate = () => {
    setTransitionForm({
      from_state_id: states[0]?.id.toString() || '',
      to_state_id: states[0]?.id.toString() || '',
      allowed_roles: [],
    })
    setIsTransitionModalOpen(true)
  }

  const toggleRoleSelection = (targetRole: string) => {
    setTransitionForm((prev) => {
      const current = prev.allowed_roles
      const updated = current.includes(targetRole)
        ? current.filter((r) => r !== targetRole)
        : [...current, targetRole]
      return { ...prev, allowed_roles: updated }
    })
  }

  const handleSaveTransition = async (e: React.FormEvent) => {
    e.preventDefault()
    const { from_state_id, to_state_id, allowed_roles } = transitionForm
    if (!from_state_id || !to_state_id) {
      toast.error('Selecciona los estados de origen y destino')
      return
    }

    try {
      const res = await fetch('/api/workflow/transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_state_id: parseInt(from_state_id, 10),
          to_state_id: parseInt(to_state_id, 10),
          allowed_roles,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Transición creada con éxito')
        setIsTransitionModalOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear la transición')
      }
    } catch {
      toast.error('Error de red al crear la transición')
    }
  }

  const handleDeleteTransition = async (transitionId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta regla de transición?')) {
      return
    }

    try {
      const res = await fetch(`/api/workflow/transitions/${transitionId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Transición eliminada')
        fetchData()
      } else {
        toast.error(data.error || 'Error al eliminar la transición')
      }
    } catch {
      toast.error('Error de red al eliminar la transición')
    }
  }

  return (
    <div className="space-y-8 font-sans text-text-primary p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neon-blue">
            ⚙️ Editor del Workflow (Flujos y Estados)
          </h1>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">
            Modifica la máquina de estados, el orden visual del taller y las reglas de transiciones permitidas por rol.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-neon-blue font-mono tracking-widest animate-pulse">
          CONECTANDO CON MOTOR DE FLUJO CABELAB...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 📊 SECCIÓN ESTADOS (Columnas taller/pizarra) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neon-blue">
                Estados del Workflow
              </h2>
              <button
                onClick={handleOpenStateCreate}
                className="bg-neon-blue hover:bg-neon-blue/80 text-black text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded transition-all"
              >
                + Nuevo Estado
              </button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
              {states.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 bg-bg-surface border border-border-subtle rounded-lg p-3 hover:border-neon-blue/30 transition-all"
                >
                  <div
                    className="w-3 h-8 rounded"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">{s.name}</span>
                      <span className="text-[9px] font-mono bg-bg-base px-1.5 py-0.5 rounded border border-border-subtle text-text-muted">
                        Index: {s.order_index}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {s.is_initial && (
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Inicial
                        </span>
                      )}
                      {s.is_terminal && (
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                          Terminal
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenStateEdit(s)}
                      className="border border-border-subtle hover:border-text-secondary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all"
                    >
                      Editar
                    </button>
                    {s.name !== 'Entregado' && (
                      <button
                        onClick={() => handleDeleteState(s.id)}
                        className="border border-red-500/30 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔗 SECCIÓN TRANSICIONES (Reglas de cambio de estado) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neon-blue">
                Reglas de Transición
              </h2>
              <button
                onClick={handleOpenTransitionCreate}
                className="bg-neon-blue hover:bg-neon-blue/80 text-black text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded transition-all"
              >
                + Nueva Regla
              </button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
              {transitions.length === 0 ? (
                <p className="text-[11px] text-text-muted italic uppercase py-8 text-center border border-dashed border-border-subtle rounded-lg">
                  No hay transiciones definidas. Los equipos no podrán cambiar de estado.
                </p>
              ) : (
                transitions.map((t) => (
                  <div
                    key={t.id}
                    className="bg-bg-surface border border-border-subtle rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider">
                      <div className="flex items-center gap-1">
                        <span className="text-text-primary uppercase">{t.from_state_name}</span>
                        <span className="text-neon-blue">➔</span>
                        <span className="text-text-primary uppercase">{t.to_state_name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteTransition(t.id)}
                        className="text-red-400 hover:text-red-500 text-[10px] uppercase font-bold px-1"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {t.allowed_roles.length === 0 ? (
                        <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold">
                          Sin roles autorizados (Deshabilitada)
                        </span>
                      ) : (
                        t.allowed_roles.map((roleName) => (
                          <span
                            key={roleName}
                            className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-secondary"
                          >
                            {roleName}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📝 MODAL EDITAR/CREAR ESTADO */}
      {isStateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveState}
            className="bg-bg-surface border border-border-subtle rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-base font-extrabold uppercase text-neon-blue tracking-wider">
              {editingState ? 'Editar Estado del Workflow' : 'Crear Nuevo Estado'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">
                  Nombre del Estado
                </label>
                <input
                  type="text"
                  required
                  disabled={editingState?.name === 'Entregado'}
                  value={stateForm.name}
                  onChange={(e) => setStateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej. EN DIAGNÓSTICO"
                  className="w-full bg-bg-elevated border border-border-subtle rounded p-2 text-xs text-text-primary uppercase tracking-wide focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">
                    Índice de Orden
                  </label>
                  <input
                    type="number"
                    required
                    value={stateForm.order_index}
                    onChange={(e) =>
                      setStateForm((p) => ({ ...p, order_index: parseInt(e.target.value, 10) }))
                    }
                    className="w-full bg-bg-base border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">
                    Color Representativo
                  </label>
                  <input
                    type="color"
                    required
                    value={stateForm.color}
                    onChange={(e) => setStateForm((p) => ({ ...p, color: e.target.value }))}
                    className="w-full h-[34px] bg-bg-base border border-border-subtle rounded px-1.5 focus:outline-none focus:border-neon-blue cursor-pointer"
                  />
                </div>
              </div>

              {editingState?.name !== 'Entregado' && (
                <div className="space-y-2 pt-2 border-t border-border-subtle/50">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={stateForm.is_initial}
                      onChange={(e) => setStateForm((p) => ({ ...p, is_initial: e.target.checked }))}
                      className="rounded border-border-subtle bg-bg-base text-neon-blue focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-text-primary">
                      Marcar como Estado Inicial
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={stateForm.is_terminal}
                      onChange={(e) => setStateForm((p) => ({ ...p, is_terminal: e.target.checked }))}
                      className="rounded border-border-subtle bg-bg-base text-neon-blue focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-text-primary">
                      Marcar como Estado Terminal (Entregado/Archivado)
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-border-subtle/50">
              <button
                type="button"
                onClick={() => setIsStateModalOpen(false)}
                className="bg-bg-base border border-border-subtle hover:border-text-secondary text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-neon-blue hover:bg-neon-blue/80 text-black text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all"
              >
                Guardar Estado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📝 MODAL CREAR TRANSICIÓN */}
      {isTransitionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTransition}
            className="bg-bg-surface border border-border-subtle rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-base font-extrabold uppercase text-neon-blue tracking-wider">
              Registrar Regla de Transición
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">
                  Estado de Origen
                </label>
                <select
                  required
                  value={transitionForm.from_state_id}
                  onChange={(e) => setTransitionForm((p) => ({ ...p, from_state_id: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-subtle rounded p-2 text-xs text-text-primary uppercase tracking-wide focus:outline-none focus:border-neon-blue"
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">
                  Estado de Destino
                </label>
                <select
                  required
                  value={transitionForm.to_state_id}
                  onChange={(e) => setTransitionForm((p) => ({ ...p, to_state_id: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-subtle rounded p-2 text-xs text-text-primary uppercase tracking-wide focus:outline-none focus:border-neon-blue"
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-2">
                  Roles Autorizados a Efectuar este Cambio
                </label>
                <div className="grid grid-cols-2 gap-2 border border-border-subtle bg-bg-base/50 p-3 rounded">
                  {rolesOptions.map((roleOpt) => {
                    const isChecked = transitionForm.allowed_roles.includes(roleOpt)
                    return (
                      <label
                        key={roleOpt}
                        className="flex items-center gap-2 cursor-pointer select-none text-xs uppercase font-mono text-text-primary hover:text-neon-blue"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRoleSelection(roleOpt)}
                          className="rounded border-border-subtle bg-bg-base text-neon-blue focus:ring-0 focus:ring-offset-0"
                        />
                        {roleOpt}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-border-subtle/50">
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                className="bg-bg-base border border-border-subtle hover:border-text-secondary text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-neon-blue hover:bg-neon-blue/80 text-black text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all"
              >
                Habilitar Transición
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
