// app/(dashboard)/admin/usuarios/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import TechnicianManager from '@/components/admin/TechnicianManager'

export default function AdminUsuariosPage() {
  const { role, loading: userLoading } = useUser()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningRoles, setAssigningRoles] = useState<Record<string, string>>({})
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<any | null>(null)

  // Roles válidos para asignar (excluyendo superadmin)
  const validRoles = ['admin', 'operaciones', 'recepcion', 'almacen', 'visualizador']

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users/list')
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        toast.error(data.error || 'Error al cargar usuarios')
      }
    } catch (err) {
      toast.error('Error de red al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'superadmin') {
      fetchUsers()
    }
  }, [role])

  if (userLoading) {
    return (
      <div className="text-center py-12 text-sm text-neon-blue font-mono tracking-widest animate-pulse">
        CONECTANDO CON SERVIDOR DE CREDENCIALES...
      </div>
    )
  }

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

  // Filtrados por estado
  const pendingUsers = users.filter((u) => !u.is_active && !u.is_superadmin)
  const activeUsers = users.filter((u) => u.is_active && !u.is_superadmin)

  // Manejo de roles pendientes antes de aprobar
  const handlePendingRoleChange = (userId: string, targetRole: string) => {
    setAssigningRoles((prev) => ({ ...prev, [userId]: targetRole }))
  }

  const handleApprove = async (userId: string) => {
    const selectedRole = assigningRoles[userId]
    if (!selectedRole) {
      toast.error('Por favor, selecciona un rol primero')
      return
    }

    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario aprobado con éxito')
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al aprobar usuario')
      }
    } catch {
      toast.error('Error de red al aprobar usuario')
    }
  }

  const handleBlock = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/block`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario bloqueado con éxito')
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al bloquear usuario')
      }
    } catch {
      toast.error('Error de red al bloquear usuario')
    }
  }

  const handleReactivate = async (userId: string, userRole: string) => {
    try {
      // Para reactivar, usamos el endpoint de aprobación pasándole su rol actual
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario reactivado con éxito')
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al reactivar usuario')
      }
    } catch {
      toast.error('Error de red al reactivar usuario')
    }
  }

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/update-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rol actualizado con éxito')
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al cambiar rol')
      }
    } catch {
      toast.error('Error de red al actualizar rol')
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/delete`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario eliminado permanentemente')
        setDeletingUserId(null)
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al eliminar usuario')
      }
    } catch {
      toast.error('Error de red al eliminar usuario')
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setImporting(true)
      setImportResults(null)
      const res = await fetch('/api/equipment/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Importación finalizada')
        setImportResults(data.data)
      } else {
        toast.error(data.error || 'Error al importar datos')
      }
    } catch {
      toast.error('Error de red al importar archivo')
    } finally {
      setImporting(false)
      // Reset input value to allow uploading same file again
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-8 font-sans text-text-primary p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neon-blue">
            🛡️ Control de Acceso y Usuarios
          </h1>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">
            Panel exclusivo para el Superadministrador. Gestiona solicitudes, roles, accesos e importaciones.
          </p>
        </div>

        {/* Botones de Importación/Exportación */}
        <div className="flex flex-wrap gap-2.5">
          <label className="cursor-pointer bg-bg-surface hover:bg-bg-surface/80 border border-border-subtle hover:border-neon-blue text-text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded transition-all select-none">
            {importing ? 'Importando...' : '📥 Importar Equipos (Excel)'}
            <input
              type="file"
              accept=".xlsx"
              disabled={importing}
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <a
            href="/api/equipment/export?format=xlsx"
            download
            className="bg-bg-surface hover:bg-bg-surface/80 border border-border-subtle hover:border-neon-blue text-text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded transition-all inline-block select-none"
          >
            📤 Exportar Excel
          </a>
        </div>
      </div>

      {/* Resumen de Importación */}
      {importResults && (
        <div className="bg-bg-surface border border-neon-blue/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neon-blue">
              Resumen del Proceso de Importación
            </h3>
            <button
              onClick={() => setImportResults(null)}
              className="text-[10px] font-bold uppercase text-text-muted hover:text-text-primary"
            >
              Cerrar Resumen
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-bg-base border border-border-subtle p-3 rounded-lg">
              <div className="text-lg font-bold font-mono text-emerald-400">
                {importResults.imported}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted mt-1">Importados</div>
            </div>
            <div className="bg-bg-base border border-border-subtle p-3 rounded-lg">
              <div className="text-lg font-bold font-mono text-amber-400">
                {importResults.skipped}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted mt-1">Omitidos (Existentes)</div>
            </div>
            <div className="bg-bg-base border border-border-subtle p-3 rounded-lg">
              <div className="text-lg font-bold font-mono text-red-400">
                {importResults.errors.length}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted mt-1">Errores encontrados</div>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400">Detalles de Errores:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin text-[11px] font-mono">
                {importResults.errors.map((err: any, idx: number) => (
                  <div key={idx} className="bg-red-500/5 border border-red-500/10 rounded px-3 py-1.5 text-red-300">
                    Fila {err.row} {err.fr ? `(FR: ${err.fr})` : ''} — {err.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 👤 GESTIÓN DE PERSONAL TÉCNICO */}
      <TechnicianManager />

      {loading ? (
        <div className="text-center py-12 text-sm text-neon-blue font-mono tracking-widest animate-pulse">
          CONECTANDO CON SERVIDOR DE CREDENCIALES...
        </div>
      ) : (
        <>
          {/* ⏳ PENDIENTES DE APROBACIÓN */}
          <section className="bg-bg-surface border border-border-subtle rounded-xl p-6">
            <div className="flex items-center gap-3 border-b border-border-subtle pb-3 mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {pendingUsers.length}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">
                Pendientes de Aprobación
              </h2>
            </div>

            {pendingUsers.length === 0 ? (
              <p className="text-[11px] text-text-muted uppercase italic">
                No hay solicitudes de registro pendientes de aprobación.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 bg-bg-base border border-border-subtle rounded-lg p-4 transition-all hover:border-amber-500/30"
                  >
                    <div>
                      <div className="text-xs font-bold font-mono tracking-wider text-text-primary">
                        {user.username}
                      </div>
                      <div className="text-[10px] text-text-secondary select-all font-mono mt-0.5">
                        {user.email}
                      </div>
                      <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">
                        Registrado el: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 items-center mt-2 border-t border-border-subtle/50 pt-2.5">
                      <select
                        value={assigningRoles[user.id] || ''}
                        onChange={(e) => handlePendingRoleChange(user.id, e.target.value)}
                        className="flex-1 bg-bg-elevated border border-border-subtle text-[11px] uppercase tracking-wider text-text-primary rounded px-2.5 py-1 focus:outline-none focus:border-neon-blue"
                      >
                        <option value="">-- Seleccionar Rol --</option>
                        {validRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={!assigningRoles[user.id]}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                      >
                        Aprobar
                      </button>

                      <button
                        onClick={() => setDeletingUserId(user.id)}
                        className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 👥 USUARIOS DEL SISTEMA (ACTIVOS Y BLOQUEADOS) */}
          <section className="bg-bg-surface border border-border-subtle rounded-xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neon-blue border-b border-border-subtle pb-3 mb-4">
              Usuarios del Sistema
            </h2>

            {activeUsers.length === 0 ? (
              <p className="text-[11px] text-text-muted uppercase italic">
                Ningún usuario registrado en la base de datos.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] uppercase tracking-widest text-text-muted">
                      <th className="py-2.5">Username</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Rol</th>
                      <th className="py-2.5">Estado</th>
                      <th className="py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/30 text-xs">
                    {activeUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-bg-base/40">
                        <td className="py-3 font-mono font-semibold tracking-wider text-text-primary">
                          {user.username}
                        </td>
                        <td className="py-3 font-mono text-text-secondary select-all">{user.email}</td>
                        <td className="py-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                            className="bg-bg-elevated border border-border-subtle text-[10px] uppercase tracking-wider text-text-primary rounded px-2 py-0.5 focus:outline-none focus:border-neon-blue"
                          >
                            {validRoles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            Activo
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleBlock(user.id)}
                              className="border border-amber-500/30 hover:bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                            >
                              Bloquear
                            </button>
                            <button
                              onClick={() => setDeletingUserId(user.id)}
                              className="border border-red-500/30 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 🚫 USUARIOS BLOQUEADOS */}
          {users.some((u) => !u.is_active && u.role !== 'pendiente' && !u.is_superadmin) && (
            <section className="bg-bg-surface border border-border-subtle rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-red-400 border-b border-border-subtle pb-3 mb-4">
                Usuarios Bloqueados / Inactivos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] uppercase tracking-widest text-text-muted">
                      <th className="py-2.5">Username</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Rol Guardado</th>
                      <th className="py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/30 text-xs">
                    {users
                      .filter((u) => !u.is_active && u.role !== 'pendiente' && !u.is_superadmin)
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-bg-base/40 opacity-70">
                          <td className="py-3 font-mono tracking-wider text-text-primary">
                            {user.username}
                          </td>
                          <td className="py-3 font-mono text-text-secondary select-all">{user.email}</td>
                          <td className="py-3 uppercase text-[10px] text-text-secondary">{user.role}</td>
                          <td className="py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleReactivate(user.id, user.role)}
                                className="border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                              >
                                Reactivar
                              </button>
                              <button
                                onClick={() => setDeletingUserId(user.id)}
                                className="border border-red-500/30 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold uppercase text-red-400 tracking-wider">
              ¿Eliminar Usuario Permanentemente?
            </h3>
            <p className="text-xs text-text-secondary">
              Esta acción no se puede deshacer. Se removerán los perfiles del usuario en el sistema de autenticación de Supabase y en la base de datos de manera definitiva.
            </p>
            <div className="flex gap-3 justify-end pt-2 border-t border-border-subtle/50">
              <button
                onClick={() => setDeletingUserId(null)}
                className="bg-bg-base border border-border-subtle hover:border-text-secondary text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingUserId)}
                className="bg-red-500 hover:bg-red-600 text-black text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded transition-all"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
