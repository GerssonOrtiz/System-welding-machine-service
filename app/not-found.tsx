// app/not-found.tsx
// Página 404 global con el estilo del sistema CABELAB.
// Next.js la muestra automáticamente para cualquier ruta no encontrada.
// Ref: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md

import Link from 'next/link'
import { CabelabLogo } from '@/components/ui/CabelabLogo'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#070A12] text-[#F1F5F9] font-sans antialiased flex flex-col items-center justify-center px-4">

        {/* Línea decorativa superior */}
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-40" />

        <div className="flex flex-col items-center gap-6 text-center max-w-md">

          {/* Logo */}
          <CabelabLogo size={32} />

          {/* Número 404 */}
          <div className="relative">
            <span className="block text-[96px] leading-none font-black font-mono text-[#00E5FF]/10 select-none">
              404
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[96px] leading-none font-black font-mono text-[#00E5FF]/20 blur-sm select-none">
              404
            </span>
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-[#F1F5F9] tracking-wide uppercase">
              Ruta no encontrada
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              La página que buscas no existe en el sistema CABELAB o fue movida.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] rounded-lg text-sm font-semibold hover:bg-[#00E5FF]/15 transition-all"
            >
              <Home size={14} />
              Ir al inicio
            </Link>
            <Link
              href="javascript:history.back()"
              className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[#94A3B8] rounded-lg text-sm font-medium hover:text-[#F1F5F9] hover:border-white/20 transition-all"
            >
              <ArrowLeft size={14} />
              Volver atrás
            </Link>
          </div>

          {/* Código de error técnico */}
          <p className="text-[10px] font-mono text-[#475569] mt-2">
            HTTP 404 · CABELAB v2.4 · Arequipa, Perú
          </p>
        </div>

        {/* Línea decorativa inferior */}
        <div className="fixed bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      </body>
    </html>
  )
}
