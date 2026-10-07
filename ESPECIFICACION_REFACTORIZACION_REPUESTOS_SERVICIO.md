# ESPECIFICACION_REFACTORIZACION_REPUESTOS_SERVICIO.md — SYNAPSE v2.5

> **Documento de Especificación Técnica y Plan de Ejecución**  
> **Objetivo:** Refactorizar el flujo de equipos aprobados desacoplando completamente el **ESTADO DEL SERVICIO** del **ESTADO DE LOS REPUESTOS**.  
> **Fecha:** 07/10/2026  
> **Estado:** Listo para ejecución

---

## 1. PRINCIPIO FUNDAMENTAL Y ALCANCE

Actualmente, el sistema confunde el estado del equipo con la disponibilidad de repuestos (`En espera de repuesto` y `En espera de repuesto adicional` son tratados como estados del workflow principal). Esto produce bloqueos operativos mutuos entre **Operaciones** y **Logística**.

### Las dos líneas de estado independientes:

1. **ESTADO DEL SERVICIO (Operativo taller):**
   - Maneja estrictamente el ciclo de trabajo físico sobre la máquina:
     ```
     [Pendiente de aprobación]
               ↓
          [Aprobado]
               ↓
      [En mantenimiento]
               ↓
     [Listo para entrega / Entregado]
     ```
   - Operaciones puede iniciar mantenimiento o culminar el servicio sin que el sistema lo restrinja por la entrega de repuestos.

2. **ESTADO DE LOS REPUESTOS (Logística / Almacén):**
   - Maneja la disponibilidad física de piezas aprobadas según cantidades:
     - `SIN REPUESTOS`: No se ha entregado ninguna pieza aprobada aún.
     - `PARCIAL`: Se ha entregado al menos un repuesto o una fracción de las cantidades requeridas.
     - `COMPLETO`: El 100% de los repuestos aprobados ha sido entregado a taller.
   - Logística puede registrar entregas (totales o parciales) **antes, durante o después** del mantenimiento.
   - **Regla estricta:** La entrega de repuestos **nunca** cambia automáticamente el estado del servicio, y el estado del servicio **no bloquea** a Logística para registrar entregas.

---

## 2. ARQUITECTURA DE DATOS (MIGRACIÓN SQL 019)

### 2.1 Nuevas columnas en `equipment_records`

```sql
-- 019_service_and_parts_status_separation.sql

-- 1. Enum o Check constraint para estado de repuestos
ALTER TABLE public.equipment_records
ADD COLUMN IF NOT EXISTS parts_status TEXT DEFAULT 'SIN_REPUESTOS' 
  CHECK (parts_status IN ('SIN_REPUESTOS', 'PARCIAL', 'COMPLETO')),
ADD COLUMN IF NOT EXISTS approved_parts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parts_deliveries JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.equipment_records.parts_status IS
  'Estado logístico de repuestos: SIN_REPUESTOS, PARCIAL o COMPLETO.';

COMMENT ON COLUMN public.equipment_records.approved_parts IS
  'Lista estructurada de repuestos aprobados por Ventas: [{ id, descripcion, cantidad_solicitada, cantidad_entregada, precio }]';

COMMENT ON COLUMN public.equipment_records.parts_deliveries IS
  'Historial inmutable de entregas realizadas por Logística: [{ id, fecha, entregado_por, items: [{ descripcion, cantidad, nota }], observaciones }]';
```

### 2.2 Recreación de la vista `equipment_with_status`

La vista expondrá las columnas `parts_status`, `approved_parts` y `parts_deliveries` directamente para que tanto la Pizarra, la tabla de Equipos y la ficha técnica tengan acceso inmediato sin consultas adicionales.

### 2.3 Limpieza de transiciones en `workflow_transitions`

Eliminar las transiciones obligatorias hacia/desde `En espera de repuesto` y `En espera de repuesto adicional` para los equipos aprobados, permitiendo el flujo continuo:
- `Aprobado` ➔ `En mantenimiento` (Operaciones, Admin, Superadmin)
- `En mantenimiento` ➔ `Listo para entrega / Entregado` (Operaciones, Admin, Superadmin)

---

## 3. LÓGICA DE NEGOCIO Y ENDPOINTS API

### 3.1 Aprobación de Presupuesto (`POST /api/equipment/[id]/update-status`)
Cuando Ventas pasa un equipo a `Aprobado`:
1. Valida los ítems aprobados (`descripcion`, `cantidad`, `precio`).
2. Actualiza `current_status_id` a `Aprobado`.
3. Inicializa `approved_parts` con:
   ```json
   [
     {
       "id": "part-1",
       "descripcion": "Carbones de repuesto",
       "cantidad_solicitada": 2,
       "cantidad_entregada": 0,
       "precio": "150.00"
     }
   ]
   ```
4. Asigna `parts_status = 'SIN_REPUESTOS'`.
5. Envía el correo de aprobación de presupuesto (`sendAprobacionVentas`).

### 3.2 Registro de Entrega de Repuestos (`POST /api/equipment/[id]/deliver-parts`)
Endpoint dedicado para Logística (`almacen`, `admin`, `superadmin`):
- **Body recibido:**
  ```json
  {
    "items": [
      { "descripcion": "Carbones de repuesto", "cantidad": 1, "nota": "Entrega parcial" }
    ],
    "observaciones": "Falta entregar 1 unidad que llega mañana de Lima"
  }
  ```
- **Lógica de ejecución:**
  1. No modifica `current_status_id` (el estado del servicio permanece intacto).
  2. Suma las cantidades entregadas a los ítems correspondientes en `approved_parts`.
  3. Inserta el evento en el array `parts_deliveries`.
  4. Recalcula automáticamente `parts_status`:
     - Si total entregado == 0 ➔ `SIN_REPUESTOS`
     - Si total entregado < total solicitado ➔ `PARCIAL`
     - Si total entregado >= total solicitado ➔ `COMPLETO`
  5. Despacha el correo de Logística (`sendEntregaLogistica`) en el hilo compartido (`email_thread_id` y `email_thread_subject`).
  6. Registra una entrada en `status_history` con notas del tipo: `📦 Entrega de repuestos (PARCIAL): 1x Carbones de repuesto`.

---

## 4. IMPACTO EN EL FRONTEND (UI / UX)

### 4.1 Ficha Detallada del Equipo (`EquipmentDetail.tsx`)
1. **Indicador Visual Dual en Cabecera:**
   - Badge del Estado del Servicio (ej. `[Aprobado]` o `[En mantenimiento]`).
   - Badge del Estado de Repuestos:
     - 🔴 `Sin repuestos`
     - 🟡 `Repuestos parciales (1/2)`
     - 🟢 `Repuestos completos`
2. **Botón Dedicado para Logística:**
   - Botón independiente: `📦 Registrar Entrega de Repuestos` (abre modal de entrega para rol `almacen`, `admin`, `superadmin`).
   - El botón de Operaciones `⚡ Avanzar Estado` se mantiene exclusivamente para mover el servicio (`En mantenimiento` ➔ `Listo para entrega`).
3. **Sección Colapsable "Control de Repuestos":**
   - Tabla clara:
     | Repuesto / Insumo | Solicitado | Entregado | Saldo Pendiente |
     |---|:---:|:---:|:---:|
     | Carbones | 2 | 1 | 1 (Pendiente) |

### 4.2 Pizarra Kiosk (`PizarraBoard.tsx`) y Tarjetas (`PizarraCard.tsx`)
1. En la sección **⚙️ Servicio de Taller**, las columnas principales son:
   - `Aprobado`
   - `En mantenimiento`
2. Cada tarjeta `PizarraCard` muestra un chip compacto según `parts_status`:
   - Si `SIN_REPUESTOS` ➔ Icono de caja gris/rojo discreto.
   - Si `PARCIAL` ➔ Badge amarillo `📦 Parcial`.
   - Si `COMPLETO` ➔ Badge verde `📦 Listo`.

### 4.3 Tabla de Equipos (`EquipmentTable.tsx`)
- Añadir la columna o badge de repuestos junto al estado del equipo para que Almacén y Operaciones identifiquen de inmediato el estado del material sin entrar al detalle.

---

## 5. PLAN DE EJECUCIÓN PASO A PASO

| Paso | Archivo(s) | Acción |
|---|---|---|
| **1** | `supabase/migrations/019_service_and_parts_status_separation.sql` | Crear migración con columnas `parts_status`, `approved_parts`, `parts_deliveries` y actualizar vista `equipment_with_status`. |
| **2** | `types/equipment.ts` | Extender tipos de TypeScript con `PartsStatus = 'SIN_REPUESTOS' \| 'PARCIAL' \| 'COMPLETO'`, `ApprovedPartItem`, etc. |
| **3** | `app/api/equipment/[id]/deliver-parts/route.ts` | Crear endpoint REST para entrega de repuestos, cálculo de estado y despacho de correo en hilo. |
| **4** | `app/api/equipment/[id]/update-status/route.ts` | Ajustar evento `Aprobado` para inicializar `approved_parts` y desacoplar de `En espera de repuesto`. |
| **5** | `components/equipment/EquipmentDetail.tsx` | Integrar modal de entrega de repuestos independiente, tabla comparativa y badges duales. |
| **6** | `components/pizarra/` y `components/equipment/` | Actualizar PizarraBoard y EquipmentTable para mostrar indicadores de repuestos independientes. |
| **7** | `npm run build` | Validar compilación limpia sin errores de tipos. |
