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
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4 font-sans antialiased selection:bg-neon-blue selection:text-bg-base">
      <div className="w-full max-w-[440px] p-8 bg-bg-surface border border-white/6 rounded-2xl shadow-2xl relative overflow-hidden group hover:border-neon-blue/30 hover:shadow-neon-blue transition-all duration-300">
        
        {/* Adorno neón decorativo superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-60" />

        {/* Encabezado con logo de Synapse */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-48 h-24 flex items-center justify-center">
            <Image
              src="/synapse_completo.png"
              alt="Synapse"
              width={220}
              height={100}
              priority
              className="object-contain max-h-24 w-auto drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]"
            />
          </div>
          <p className="text-[11px] font-medium tracking-widest uppercase text-text-muted mt-1">
            powered by <span className="text-neon-blue font-semibold">Venllas</span>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nombre de Usuario
            </label>
            <input
              type="text"
              disabled={loading}
              placeholder="nombre_usuario"
              {...register('username')}
              className={`w-full bg-black/60 border ${
                errors.username ? 'border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] focus:border-red-500' : 'border-white/15 focus:border-neon-blue/70 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.15)]'
              } rounded-lg text-white px-4.5 py-3 text-sm outline-none transition-standard placeholder:text-white/30`}
            />
            {errors.username && (
              <p className="text-xs text-red-400 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              disabled={loading}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full bg-black/60 border ${
                errors.password ? 'border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] focus:border-red-500' : 'border-white/15 focus:border-neon-blue/70 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.15)]'
              } rounded-lg text-white px-4.5 py-3 text-sm outline-none transition-standard placeholder:text-white/30`}
            />
            {errors.password && (
              <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-electric text-white font-semibold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm hover:shadow-[0_0_12px_rgba(0,82,255,0.4)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'INICIAR SESIÓN'
            )}
          </button>
        </form>

        {/* Footer de autoría y versión */}
        <div className="mt-6 pt-5 border-t border-white/6 text-center space-y-1">
          <p className="text-[11px] text-text-muted font-mono">
            Desarrollado por{' '}
            <span className="text-text-secondary font-semibold">Br. Gersson Ortiz</span>
          </p>
          <p className="text-[10px] text-text-muted/70 font-mono tracking-wider">
            v2.4
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
