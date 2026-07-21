// lib/env.ts
// Validación de variables de entorno al iniciar la app
// Importar en el layout raíz para detectar variables faltantes al arrancar
// Si falta cualquier variable requerida, el servidor falla rápido con mensaje claro

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable de entorno faltante: ${name}`)
  }
  return value
}

export const env = {
  supabaseUrl:            requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:        requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  timezone:               process.env.TZ ?? 'America/Lima',
}
