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
import { Lock, User, ArrowRight, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-bg-forge px-4 font-sans antialiased relative overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* ── Capa de Fondo Dinámica: Orbes Flotantes y Malla Cibernética ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Micro-malla técnica de fondo */}
        <div className="absolute inset-0 linux-grid-bg opacity-70" />

        {/* Orbe 1: Cian Eléctrico con animación fluida floatSlow */}
        <div className="absolute -top-[15%] left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-500/15 via-sky-600/8 to-transparent blur-[140px] animate-float-1" />

        {/* Orbe 2: Azul Cobalto/Índigo con animación inversa */}
        <div className="absolute -bottom-[20%] right-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-indigo-600/18 via-blue-600/10 to-transparent blur-[150px] animate-float-2" />

        {/* Orbe 3: Púrpura central sutil */}
        <div className="absolute top-[35%] left-[30%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-purple-600/10 to-transparent blur-[130px] animate-float-3" />

        {/* Marca de agua centralizada con el isotipo de Synapse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] opacity-[0.04] select-none pointer-events-none flex items-center justify-center">
          <img
            src="/synapse_logo.png"
            alt="SYNAPSE Watermark"
            className="w-full h-full object-contain filter invert drop-shadow-[0_0_90px_rgba(0,210,255,0.8)]"
          />
        </div>
      </div>

      {/* ── Tarjeta Glass Principal con animación de entrada (animate-slide-in / glass-in) ── */}
      <div className="w-full max-w-[440px] p-8 sm:p-9 vision-sidebar-capsule rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_35px_rgba(0,210,255,0.14)] relative z-10 overflow-hidden border border-white/12 hover:border-cyan-400/40 transition-all duration-500 animate-slide-in">
        
        {/* Línea superior con destello de arco cyan/violeta */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 via-indigo-400 to-transparent opacity-80" />

        {/* Header con Isotipo y Marca */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="relative w-56 h-16 flex items-center justify-center transition-transform duration-300 hover:scale-105">
            <Image
              src="/synapse_horizontal.png"
              alt="Synapse"
              width={240}
              height={80}
              priority
              className="object-contain max-h-16 w-auto filter drop-shadow-[0_0_18px_rgba(0,210,255,0.35)]"
            />
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
            <Sparkles size={11} className="text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-300">
              Sistema Operativo de Taller
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Nombre de Usuario
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                <User size={16} />
              </span>
              <input
                type="text"
                disabled={loading}
                placeholder="nombre_usuario"
                {...register('username')}
                className={`w-full pl-10 pr-4 py-3 bg-white/[0.04] border ${
                  errors.username
                    ? 'border-red-500/70 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : 'border-white/10 focus:border-cyan-400/80 focus:shadow-[0_0_15px_rgba(0,210,255,0.25)]'
                } rounded-2xl text-slate-100 text-sm outline-none transition-all placeholder:text-slate-500 focus:bg-white/[0.07]`}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type="password"
                disabled={loading}
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-10 pr-4 py-3 bg-white/[0.04] border ${
                  errors.password
                    ? 'border-red-500/70 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : 'border-white/10 focus:border-cyan-400/80 focus:shadow-[0_0_15px_rgba(0,210,255,0.25)]'
                } rounded-2xl text-slate-100 text-sm outline-none transition-all placeholder:text-slate-500 focus:bg-white/[0.07]`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold tracking-wider py-3.5 rounded-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase shadow-[0_4px_25px_rgba(0,210,255,0.35)] hover:shadow-[0_4px_35px_rgba(0,210,255,0.5)] border border-cyan-300/40"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <span>INGRESAR AL SISTEMA</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer de autoría */}
        <div className="mt-7 pt-4 border-t border-white/[0.08] text-center space-y-1">
          <p className="text-[11px] text-slate-400 font-mono">
            Desarrollado por{' '}
            <span className="text-slate-200 font-semibold">Br. Gersson Ortiz</span>
          </p>
          <p className="text-[9px] text-slate-500 font-mono">
            CABELAB · Arequipa, Perú
          </p>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-forge px-4 font-sans antialiased text-text-secondary">
        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
