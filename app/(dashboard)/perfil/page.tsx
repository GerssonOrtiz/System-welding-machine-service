// app/(dashboard)/perfil/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { passwordChangeSchema, type PasswordChangeInput } from '@/lib/validations/user.schema'
import { ROLE_LABELS } from '@/types/user'

export default function ProfilePage() {
  const { user, profile, role, isSuperadmin, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  })

  const onSubmit = async (data: PasswordChangeInput) => {
    setLoading(true)
    try {
      // 1. Validar la contraseña actual re-autenticando al usuario (según el flujo requerido por Supabase)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      })

      if (signInError) {
        toast.error('La contraseña actual es incorrecta')
        setLoading(false)
        return
      }

      // 2. Actualizar la contraseña del usuario actual
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (updateError) {
        toast.error(updateError.message || 'Error al actualizar la contraseña')
        setLoading(false)
        return
      }

      toast.success('Contraseña actualizada con éxito')
      reset()
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error inesperado al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base font-sans antialiased text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold font-mono">Cargando datos de perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-bg-base p-6 md:p-8 font-sans antialiased max-w-4xl mx-auto w-full selection:bg-neon-blue selection:text-bg-base">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-wider text-text-primary uppercase">
          CONFIGURACIÓN DE PERFIL
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Gestiona los detalles de tu cuenta y seguridad de acceso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta de Información General */}
        <div className="md:col-span-1 bg-bg-surface border border-white/6 rounded-xl p-6 h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-60" />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 font-mono text-neon-purple">
            Datos del Usuario
          </h2>
          <div className="space-y-4">
            <div>
              <span className="block text-xxs font-semibold text-text-secondary uppercase tracking-wider">Nombre de Usuario</span>
              <span className="text-sm font-semibold text-text-primary font-mono">{profile?.username || 'Sin username'}</span>
            </div>
            <div>
              <span className="block text-xxs font-semibold text-text-secondary uppercase tracking-wider">Correo Electrónico</span>
              <span className="text-sm font-semibold text-text-primary">{user?.email || 'Sin correo'}</span>
            </div>
            <div>
              <span className="block text-xxs font-semibold text-text-secondary uppercase tracking-wider">Rol de Sistema</span>
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1"
                style={{
                  backgroundColor: isSuperadmin ? 'rgba(157, 78, 221, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                  border: isSuperadmin ? '1px solid rgba(157, 78, 221, 0.31)' : '1px solid rgba(0, 229, 255, 0.31)',
                  color: isSuperadmin ? '#9D4EDD' : '#00E5FF',
                  boxShadow: isSuperadmin ? '0 0 8px rgba(157, 78, 221, 0.15)' : '0 0 8px rgba(0, 229, 255, 0.15)'
                }}
              >
                {role ? ROLE_LABELS[role] : 'Sin Rol'}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Cambio de Contraseña */}
        <div className="md:col-span-2 bg-bg-surface border border-white/6 rounded-xl p-6 relative overflow-hidden group hover:border-neon-blue/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-60" />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-5 font-mono text-neon-blue">
            Cambiar Contraseña
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Contraseña Actual
              </label>
              <input
                type="password"
                disabled={loading}
                placeholder="••••••••"
                {...register('currentPassword')}
                className={`w-full bg-white/3 border ${
                  errors.currentPassword ? 'border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-white/8 focus:border-neon-blue/50 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)]'
                } rounded-lg text-text-primary px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-text-muted`}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-400 font-medium">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Nueva Contraseña
              </label>
              <input
                type="password"
                disabled={loading}
                placeholder="••••••••"
                {...register('newPassword')}
                className={`w-full bg-white/3 border ${
                  errors.newPassword ? 'border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-white/8 focus:border-neon-blue/50 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)]'
                } rounded-lg text-text-primary px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-text-muted`}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-400 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                disabled={loading}
                placeholder="••••••••"
                {...register('confirmNewPassword')}
                className={`w-full bg-white/3 border ${
                  errors.confirmNewPassword ? 'border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-white/8 focus:border-neon-blue/50 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)]'
                } rounded-lg text-text-primary px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-text-muted`}
              />
              {errors.confirmNewPassword && (
                <p className="text-xs text-red-400 font-medium">{errors.confirmNewPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-electric text-white font-semibold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm hover:shadow-[0_0_12px_rgba(0,82,255,0.4)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'ACTUALIZAR CONTRASEÑA'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
