// middleware.ts — raíz del proyecto
// Protección de rutas + refresco de sesión en cada request
// Según GUIA_SUPABASE §5 y ARQUITECTURA_CABELAB_V2 §9
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register']

// Rutas exclusivas del superadmin
const SUPERADMIN_ROUTES = ['/admin/usuarios', '/admin/workflow', '/admin/configuracion']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // 1. Ruta pública: dejar pasar
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Si ya tiene sesión activa, redirigir al inicio correspondiente a su rol o al dashboard base
    if (user) {
      // Intentamos consultar el perfil para redirigir a su ruta específica
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active, is_superadmin')
          .eq('id', user.id)
          .single()

        if (profile?.is_active) {
          // Rutas iniciales por rol según GUIA_UI_UX y FLUJOS_DE_USUARIO
          const homeRoutes: Record<string, string> = {
            superadmin:   '/admin/usuarios',
            admin:        '/dashboard',
            operaciones:  '/taller',
            recepcion:    '/equipos',
            almacen:      '/equipos',
            visualizador: '/pizarra',
          }
          const destination = homeRoutes[profile.role] || '/'
          return NextResponse.redirect(new URL(destination, request.url))
        }
      } catch (e) {
        // Ignorar y usar redirección por defecto
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // 2. Sin sesión: redirigir a login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Verificar is_active y rol del usuario en user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active, is_superadmin')
    .eq('id', user.id)
    .single()

  // 4. Usuario no aprobado o bloqueado: redirigir a login con mensaje
  if (!profile?.is_active) {
    // Si tiene sesión activa pero no está aprobado, hacemos signOut para borrar la cookie de sesión
    // y evitar un loop infinito de redirecciones
    const response = NextResponse.redirect(new URL('/login?error=no-aprobado', request.url))
    // Limpiamos las cookies del cliente
    response.cookies.delete('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
    return response
  }

  // 5. Rutas de superadmin: verificar is_superadmin
  const isSuperadminRoute = SUPERADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isSuperadminRoute && !profile.is_superadmin) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Excluye archivos estáticos y rutas internas de Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
