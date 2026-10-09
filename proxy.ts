// proxy.ts — raíz del proyecto (Next.js 16 Proxy convention)
// Protección de rutas + refresco de sesión en cada request
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { ROLE_HOME_ROUTE } from '@/types/user'

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login']

// Rutas exclusivas del superadmin
const SUPERADMIN_ROUTES = ['/admin/usuarios', '/admin/workflow', '/admin/configuracion']

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Permitir acceso público a documentación de equipos por QR y su API pública
  if (pathname.startsWith('/doc') || pathname.startsWith('/api/public')) {
    return supabaseResponse
  }

  // Bloquear acceso a registro público
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 1. Ruta pública de login: dejar pasar o redirigir si ya tiene sesión
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Si ya tiene sesión activa, redirigir al inicio correspondiente a su rol
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active, is_superadmin')
          .eq('id', user.id)
          .single()

        if (profile?.is_active) {
          const destination = ROLE_HOME_ROUTE[profile.role as keyof typeof ROLE_HOME_ROUTE] || '/pizarra'
          const redirectResponse = NextResponse.redirect(new URL(destination, request.url))
          // Copiar cookies refrescadas de Supabase al redirect
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
          })
          return redirectResponse
        }
      } catch {
        // Ignorar y continuar
      }
      const defaultRedirect = NextResponse.redirect(new URL('/login', request.url))
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        defaultRedirect.cookies.set(cookie.name, cookie.value, cookie)
      })
      return defaultRedirect
    }
    return supabaseResponse
  }

  // 2. Sin sesión: redirigir a login
  if (!user) {
    const loginRedirect = NextResponse.redirect(new URL('/login', request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      loginRedirect.cookies.set(cookie.name, cookie.value, cookie)
    })
    return loginRedirect
  }

  // 3. Verificar is_active y rol del usuario en user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active, is_superadmin')
    .eq('id', user.id)
    .single()

  // 4. Usuario no aprobado o bloqueado: redirigir a login con mensaje
  if (!profile?.is_active) {
    const response = NextResponse.redirect(new URL('/login?error=no-aprobado', request.url))
    // Limpiar todas las cookies de supabase auth
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith('sb-')) {
        response.cookies.delete(c.name)
      }
    })
    return response
  }

  // 5. Redirección en raíz (/) según rol del usuario autenticado
  if (pathname === '/') {
    const destination = ROLE_HOME_ROUTE[profile.role as keyof typeof ROLE_HOME_ROUTE] || '/pizarra'
    const homeRedirect = NextResponse.redirect(new URL(destination, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      homeRedirect.cookies.set(cookie.name, cookie.value, cookie)
    })
    return homeRedirect
  }

  // 6. Rutas de superadmin: verificar is_superadmin
  const isSuperadminRoute = SUPERADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isSuperadminRoute && !profile.is_superadmin) {
    const unauthorizedRedirect = NextResponse.redirect(new URL('/pizarra', request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      unauthorizedRedirect.cookies.set(cookie.name, cookie.value, cookie)
    })
    return unauthorizedRedirect
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Excluye archivos estáticos y rutas internas de Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
