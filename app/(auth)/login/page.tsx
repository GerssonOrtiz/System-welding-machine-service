// app/(auth)/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations/user.schema'
import { ROLE_HOME_ROUTE, type UserProfile } from '@/types/user'
import Image from 'next/image'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  // Mostrar mensaje de error si el middleware redirigió por falta de aprobación
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'no-aprobado') {
      toast.error('Tu cuenta aún no ha sido aprobada o fue bloqueada. Contacta al superadmin.', {
        id: 'no-aprobado-toast',
        duration: 5000,
      })
    }
  }, [searchParams])

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      // Usar el patrón de correo virtual: usuario@cabelab.local
      const virtualEmail = `${data.username.toLowerCase()}@cabelab.local`

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: data.password,
      })

      if (error) {
        toast.error('Usuario o contraseña incorrectos')
        setLoading(false)
        return
      }

      if (authData.user) {
        // Consultar el perfil del usuario para obtener su rol y ver si está activo
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profile) {
          toast.error('No se pudo cargar el perfil de usuario')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        const userProfile = profile as unknown as UserProfile

        if (!userProfile.is_active) {
          toast.error('Tu cuenta aún no ha sido aprobada o fue bloqueada')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        toast.success('Sesión iniciada con éxito')
        
        // Redirección inteligente basada en el rol
        const destination = ROLE_HOME_ROUTE[userProfile.role] || '/'
        router.push(destination)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-forge px-4 font-sans antialiased selection:bg-amber-core/20 selection:text-amber-glow relative overflow-hidden">
      {/* Background glow effects - ambient warm amber lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-core/10 blur-[140px] rounded-full" />
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[300px] bg-amber-dim/10 blur-[130px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] p-8 glass-card rounded-3xl shadow-glass relative overflow-hidden group hover:border-amber-core/40 hover:shadow-vip-amber transition-all duration-300">
        
        {/* Adorno ámbar decorativo superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-core to-transparent opacity-75" />

        {/* Encabezado con logo de Synapse y badge de CABELAB */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-56 h-16 flex items-center justify-center">
            <Image
              src="/synapse_horizontal.png"
              alt="Synapse"
              width={240}
              height={80}
              priority
              className="object-contain max-h-16 w-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            />
          </div>

          <p className="text-[8px] font-medium tracking-widest uppercase text-text-muted mt-2 font-mono">
            powered by <span className="text-amber-glow font-semibold">Venllas</span>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
              Nombre de Usuario
            </label>
            <input
              type="text"
              disabled={loading}
              placeholder="nombre_usuario"
              {...register('username')}
              className={`w-full bg-white/[0.03] border ${
                errors.username ? 'border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] focus:border-red-500' : 'border-white/[0.08] focus:border-amber-core/70 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]'
              } rounded-xl text-white px-4.5 py-3 text-sm outline-none transition-standard placeholder:text-text-muted/60`}
            />
            {errors.username && (
              <p className="text-xs text-red-400 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
              Contraseña
            </label>
            <input
              type="password"
              disabled={loading}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full bg-white/[0.03] border ${
                errors.password ? 'border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] focus:border-red-500' : 'border-white/[0.08] focus:border-amber-core/70 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]'
              } rounded-xl text-white px-4.5 py-3 text-sm outline-none transition-standard placeholder:text-text-muted/60`}
            />
            {errors.password && (
              <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-core to-amber-glow text-bg-forge font-bold tracking-wider py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase shadow-amber-glow hover:shadow-vip-amber"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-bg-forge/40 border-t-bg-forge rounded-full animate-spin" />
            ) : (
              'INICIAR SESIÓN'
            )}
          </button>
        </form>

        {/* Footer de autoría y versión */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center space-y-1">
          <p className="text-[11px] text-text-muted font-mono">
            Desarrollado por{' '}
            <span className="text-text-secondary font-semibold">Br. Gersson Ortiz</span>
          </p>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-4 font-sans antialiased text-text-secondary">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
