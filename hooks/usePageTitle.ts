// hooks/usePageTitle.ts
// Hook para establecer el título dinámico del tab del navegador en Client Components.
// Las páginas usan 'use client', por lo que no pueden exportar metadata estática de Next.js.
// Este hook reemplaza esa funcionalidad usando document.title directamente.
// Formato resultante: "Dashboard | CABELAB"
'use client'

import { useEffect } from 'react'

const APP_NAME = 'CABELAB'

export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${pageTitle} | ${APP_NAME}`
    return () => {
      document.title = previous
    }
  }, [pageTitle])
}
