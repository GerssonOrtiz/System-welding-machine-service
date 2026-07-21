// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations/user.schema'
import Link from 'next/link'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    try {
      // Usar SIEMPRE el patrón de correo virtual para la autenticación
      const authEmail = `${data.username.toLowerCase()}@cabelab.local`

      // 2. Crear usuario en Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password: data.password,
        options: {
          data: {
            username: data.username.toLowerCase(),
            contact_email: data.email || null, // Guardar el correo real solo como contacto
          },
        },
      })

      if (signUpError) {
        toast.error(signUpError.message || 'Error al registrar usuario')
        setLoading(false)
        return
      }

      if (signUpData.user) {
        // El trigger prevent_superadmin_modification y handle_new_user en Supabase
        // crea el perfil automáticamente en `user_profiles` con is_active = false
        // y role = 'visualizador' por defecto.
        setSuccess(true)
        toast.success('Cuenta creada exitosamente')
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error inesperado durante el registro')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-4 font-sans antialiased">
        <div className="w-full max-w-[460px] p-8 bg-bg-surface border border-neon-blue/30 rounded-2xl shadow-neon-blue relative text-center">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent" />
          
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue mb-4 animate-pulse">
            <span className="font-mono font-bold text-xl">✓</span>
          </div>
          
          <h2 className="text-xl font-bold text-text-primary tracking-wider uppercase mb-2">
            REGISTRO EXITOSO
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Tu cuenta ha sido creada correctamente en el sistema. 
            Por favor, <strong className="text-neon-blue">espera la aprobación de un administrador</strong> antes de intentar iniciar sesión.
          </p>

          <Link
            href="/login"
            className="inline-block w-full bg-electric text-white font-semibold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-150 text-sm hover:shadow-[0_0_12px_rgba(0,82,255,0.4)]"
          >
            VOLVER AL LOGIN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4 font-sans antialiased selection:bg-neon-blue selection:text-bg-base">
      <div className="w-full max-w-[460px] p-8 bg-bg-surface border border-white/6 rounded-2xl shadow-2xl relative overflow-hidden group hover:border-neon-blue/30 hover:shadow-neon-blue transition-all duration-300">
        
        {/* Adorno neón decorativo superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-60" />

        {/* Encabezado */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-wider text-text-primary uppercase font-sans">
            CREAR CUENTA
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Regístrate para solicitar acceso a CABELAB
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
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
              } rounded-lg text-white px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-white/30`}
            />
            {errors.username && (
              <p className="text-xs text-red-400 font-medium">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Correo Electrónico <span className="text-[10px] lowercase italic opacity-60">(Opcional)</span>
            </label>
            <input
              type="email"
              disabled={loading}
              placeholder="ejemplo@cabelab.pe"
              {...register('email')}
              className={`w-full bg-black/60 border ${
                errors.email ? 'border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] focus:border-red-500' : 'border-white/15 focus:border-neon-blue/70 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.15)]'
              } rounded-lg text-white px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-white/30`}
            />
            {errors.email && (
              <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
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
              } rounded-lg text-white px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-white/30`}
            />
            {errors.password && (
              <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              disabled={loading}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={`w-full bg-black/60 border ${
                errors.confirmPassword ? 'border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] focus:border-red-500' : 'border-white/15 focus:border-neon-blue/70 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.15)]'
              } rounded-lg text-white px-4.5 py-2.5 text-sm outline-none transition-standard placeholder:text-white/30`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-electric text-white font-semibold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm hover:shadow-[0_0_12px_rgba(0,82,255,0.4)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'SOLICITAR REGISTRO'
            )}
          </button>
        </form>

        {/* Enlace al login */}
        <div className="mt-6 text-center border-t border-white/6 pt-4">
          <p className="text-text-secondary text-xs">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href="/login"
              className="text-neon-blue hover:text-neon-blue/80 transition-standard font-medium ml-1"
            >
              Inicia sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
