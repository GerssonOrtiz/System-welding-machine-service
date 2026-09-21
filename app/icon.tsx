// app/icon.tsx
// Favicon generado dinámicamente con el estilo de CABELAB.
// Next.js lo sirve como /icon y lo inyecta en el <head> automáticamente.
// Documentación: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070A12',
          borderRadius: '6px',
        }}
      >
        {/* Símbolo de arco eléctrico simplificado al tamaño 32x32 */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 5 L15 13 L11 13 L17 27 L22 19 L18 19 L23 5"
            stroke="#00E5FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="24" r="1.5" fill="#00E5FF" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
