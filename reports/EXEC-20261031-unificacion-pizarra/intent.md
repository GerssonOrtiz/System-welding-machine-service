# INTENT MANIFEST
**Execution ID:** `EXEC-20261031-unificacion-pizarra`  
**Fecha:** 2026-10-31  
**Autorización:** Aprobado por el usuario (`aprobdo`)  
**Riesgo Inicial:** BAJO  

## 1. Objetivo Central
Unificar de forma canónica los estados "Listo para entrega" y "Servicio culminado" (prevaleciendo `Servicio culminado` con retrocompatibilidad), sin alterar endpoints ni secciones de la Pizarra, descartar la persistencia forzada de enlaces/archivos de VRD e informes de servicio opcionales en BD, corregir políticas RLS de catálogo, limpiar dependencias de PostCSS y estabilizar el hook WebSocket en tiempo real.

## 2. Criterios de Aceptación
1. `package.json`: eliminación limpia de `@tailwindcss/postcss`.
2. Migración `023_fix_catalog_rls.sql` para superadmin insensible a mayúsculas.
3. Migración `024_unify_servicio_culminado_state.sql` para estado canónico "Servicio culminado" y transiciones correspondientes.
4. Soporte en frontend (`StatusChangeModal.tsx`) y backend (`update-status/route.ts`) para "Servicio culminado" / "Listo para entrega".
5. Pizarra: no modificar endpoints ni estructura de secciones de `PizarraBoard.tsx`.
6. Informes VRD y Servicio: netamente opcionales, sin persistencia en BD y sin alterar rutas públicas QR.
7. `types/equipment.ts` y `types/database.types.ts`: sincronización estricta de tipos.
8. `hooks/useRealtimePizarra.ts`: estabilización de suscripción Realtime.
9. Validación de build: `npm run build` o `npx tsc --noEmit` exitoso sin errores.

## 3. Alcance y Restricciones
- **Modo:** `AUTO_CONTROLADO`.
- **Archivos Autorizados:**
  - `package.json`
  - `supabase/migrations/023_fix_catalog_rls.sql`
  - `supabase/migrations/024_unify_servicio_culminado_state.sql`
  - `components/equipment/StatusChangeModal.tsx`
  - `app/api/equipment/[id]/update-status/route.ts`
  - `types/database.types.ts`
  - `types/equipment.ts`
  - `hooks/useRealtimePizarra.ts`
  - Reversión de cambios en `app/doc/` y `app/api/public/` si hubieran modificaciones no aprobadas.
