# PLAN TÉCNICO DE EJECUCIÓN (PLANNER)
**Execution ID:** `EXEC-PIZARRA-UNIFICACION-RLS-TYPES-20261031`  
**Iteración:** 2 (Ajustado según directivas del usuario)  
**Estado:** `READY_FOR_APPROVAL`  
**Riesgo:** `BAJO` (Estabilización, compatibilidad de estados y corrección de permisos)

---

## 1. Alcance y Objetivos Revisados

En base a las instrucciones expresas del usuario:
> *"del archivo plan_ejecucion_synapse.md, cambia esto, en unificación de estados y pizarra, no hacer ningún cambio en el endpoint de la pizarra, que mantenga sus secciones, solo unificar los dos estados mencionados, y en informes de certificados de vrd y servicio no son obligatorios, son opcionales, asi que no hacer persistencia en sus enlaces o pdf, creo que quitas esa mejora, teniendo eso, procede con lo demas"*

El plan actualizado define:

1. **Unificación Estricta de Estados (Sin alterar secciones ni endpoints de Pizarra):**
   - NO alterar endpoints de la pizarra (/api/workflow/states, etc.) ni la estructura interna ni las secciones en `PizarraBoard.tsx`.
   - Migración SQL  `024_unify_servicio_culminado_state.sql` para asegurar que el estado canónico sea **`Servicio culminado`** (actualizando o creando si correspondía `Listo para entrega`) y garantizando las transiciones: `En mantenimiento -> Servicio culminado -> Entregado`.
   - Compatibilidad completa en código frontend y backend (`StatusChangeModal.tsx` y `app/api/equipment/[id]/update-status/route.ts`) para tratar indistintamente `Servicio culminado` y `Listo para entrega`.
2. **Retiro de Mejora de Persistencia de Informes VRD y Servicio:**
   - Al ser documentos/certificados netamente opcionales, **NO se realiza persistencia en base de datos** para estos enlaces/archivos.
   - Se excluye cualquier modificación a las rutas públicas de consulta QR (`/api/public/...` y `/doc/...`), conservando su funcionamiento original intacto sin campos obligatorios ni persistencia extra.
3. **Seguridad RLS de Catálogo:**
   - Aplicar `supabase/migrations/023_fix_catalog_rls.sql` para corregir la evaluación insensible a mayúsculas del rol superadmin (`public.is_superadmin() OR lower(role) = 'superadmin'`).
4. **Sincronización de Tipos TypeScript:**
   - Mantener tipado coherente en `types/database.types.ts` y `types/equipment.ts` con las columnas activas y roles relevantes incluyendo `Servicio culminado`.
5. **Estabilización de WebSocket en Pizarra:**
   - En `hooks/useRealtimePizarra.ts`, memoizar el cliente de Supabase y desacoplar callbacks con `useRef` para evitar desconexiones constantes del canal en tiempo real.
6. **Higiene de Dependencias:**
   - Eliminar `@tailwindcss/postcss` v4 de `package.json` para asegurar compatibilidad limpia con Tailwind CSS v3.

---

## 2. Plan Paso a Paso

|ID|Acción|Archivos Involucrados|Dependencias|Verificación|Riesgo|
|---|---|---|---|---|---|
|**PASO-01**|**Higiene de Dependencias**|`package.json`|Ninguna|`@tailwindcss/postcss` removido de `devDependencies`. `npm run build` o `npx tsc` no arrojan advertencias de plugins PostCSS.|Muy Bajo|
|**PASO-02**|**Migración RLS Catalogo**|`supabase/migrations/023_fix_catalog_rls.sql`|Ninguna|Sintaxis PostgreSQL válida. Políticas `catalog_categories` y `catalog_equipments` evalúan correctamente `is_superadmin() OR `lower(role) = 'superadmin'.|Bajo|
|**PASO-03**|**Migración Unificación de Estado**|`supabase/migrations/024_unify_servicio_culminado_state.sql`|Ninguna|Idempotencia comprobada. Transiciones `En mantenimiento -> Servicio culminado` y `Servicio culminado -> Entregado` asignadas con roles autorizados.|Bajo|
|**PASO-04**|**Unificación en Código de Transición y Modales**|`components/equipment/StatusChangeModal.tsx`<br>`app/api/equipment/[id]/update-status/route.ts`|PASO-03|`isCulminadoODP` valida tanto `'servicio culminado'` como `'listo para entrega'. Envío de correos se ejecuta sin errores.|Bajo|
|**PASO-05**|**Sincronización de Tipos TypeScript**|`types/database.types.ts`<br>`types/equipment.ts`|PASO-03|Incorporación de `'Servicio culminado'` a los arrays de estados permitidos por rol. `npx tsc --noEmit` sin errores.|Muy Bajo|
|**PASO-06**|**Estabilización del Hook Realtime**|`hooks/useRealtimePizarra.ts`|Ninguna|Instancia de Supabase a nivel de módulo, listener estable con dependencias `[]` y callback via `onTriggerRefetchRef`. Sin ciclo de re-suscripciones.|Bajo|
|**PASO-07**|**Validación y Compilación Global**|Workspace completo|Todos los anteriores|`npm run build` exitoso sin errores de tipos o empaquetado.|Bajo|

---

## 3. Delimitación de Alcance

### Incluido
- Eliminación de `@tailwindcss/postcss` v4 en `package.json`.
- Migración 023 para RLS de catálogo con comparación segura de roles.
- Migración 024 para unificar el estado "Listo para entrega" en "Servicio culminado" con sus transiciones correspondientes.
- Manejo canónico y retrocompatible de "Servicio culminado" / "Listo para entrega" en modales de cambio de estado y en el endpoint de actualización de estado.
- Estabilización del hook `useRealtimePizarra` mediante singleton y refs.
- Tipos TypeScript actualizados.

### Excluido Expresamente (Por Directiva del Usuario)
- **Modificación a secciones o endpoints de la Pizarra:** NO se modifica la estructura ni columnas de `PizarraBoard.tsx` ni los endpoints de la pizarra (`/api/workflow/states`).
- **Persistencia de Certificados VRD e Informes:** NO se crean columnas ni lógica de base de datos obligatoria para persistencia de enlaces o PDFs de VRD/informe de servicio.
- **Rutas Públicas QR:** Se descarta cualquier modificación en `app/doc/[serial]/page.tsx`, `app/doc/fr/[fr]/page.tsx` y en sus endpoints públicos (`/api/public/...`), manteniéndolas en su estado original verificado.

---

## 4. Riesgos y Mitigaciones
|Riesgo|Probabilidad|Impacto|Mitigación|
|---|---|---|---|
|Inconsistencia si en la BD coexisten equipos con 'Listo para entrega' |Baja|Bajo|La migración 024 actualiza el nombre del estado existente; el helper `isCulminadoODP` en código soporta ambos valores indistintamente.|
|Incompatibilidad de tipos en Next.js build|Baja|Medio|Verificación previa con `npx tsc --noEmit` y `npm run build`.|
|Disrupción en visualización de Pizarra|Muy Baja|Nulo|No se altera la estructura de secciones de `PizarraBoard.tsx` ni se tocan endpoints de consulta.|

---

## 5. Manifiesto Breve
- **Pasos:�* 7 pasos secuenciales y comprobables.
- **Archivos Clave:** `package.json`, `supabase/migrations/023_fix_catalog_rls.sql`, `supabase/migrations/024_unify_servicio_culminado_state.sql`, `components/equipment/StatusChangeModal.tsx`, `app/api/equipment/[id]/update-status/route.ts`, `types/database.types.ts`, `types/equipment.ts`, `hooks/useRealtimePizarra.ts`.
- **Riesgo:** BAJO.
- **Estado:** `READY_FOR_APPROVAL`
