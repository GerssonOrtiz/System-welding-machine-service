# PLAN DE ESPECIFICACIÓN: DEVOLUCIÓN Y REBOTE DE REPUESTOS (OPERACIONES ➔ LOGÍSTICA)

> **Documento de Diseño Técnico y Funcional**  
> **Sistema:** SYNAPSE v2.5  
> **Módulo:** Control Logístico y Repuestos en Taller  
> **Autor:** Br. Gersson Ortiz — Powered by Venllas  
> **Fecha:** Octubre 2026  

---

## 1. Justificación y Necesidad Operativa

Actualmente, el sistema gestiona la entrega de repuestos en un solo sentido: **Logística ➔ Taller**.  
En la operación real diaria de mantenimiento de motosoldadoras y máquinas de soldar, se presentan con frecuencia los siguientes escenarios en el taller:

1. **Repuesto incompatible:** La pieza entregada no coincide con el modelo o sub-serie específica del equipo.
2. **Defecto de fábrica o daño previo:** El componente nuevo presenta falla eléctrica o mecánica durante la instalación.
3. **Sobrante o no requerido:** Al desmontar el equipo, el técnico constata que el componente original podía recuperarse/repararse, dejando el repuesto nuevo sin uso.
4. **Error de despacho:** Se despacharon unidades de más o un código de parte equivocado.

**Objetivo:** Permitir que los técnicos u operadores (rol `operaciones`, `admin`, `superadmin`) puedan registrar formalmente la **devolución o rebote total o parcial de repuestos** hacia Almacén, recalculando los estados del sistema, dejando trazabilidad inmutable y notificando al área de Logística.

---

## 2. Reglas de Negocio y Lógica de Estados

### 2.1. Permisos y Roles
- **Roles autorizados para devolver repuestos:** `operaciones`, `admin`, `superadmin`.
- **Restricción:** El rol `almacen` registra *entregas*, pero la *devolución* proviene de la iniciativa de `operaciones` (quien tiene la pieza física en taller).

### 2.2. Validación de Cantidades
- Un repuesto solo puede devolverse si tiene `cantidad_entregada > 0`.
- La cantidad a devolver no puede exceder el saldo efectivamente entregado:  
  $$\text{Cantidad a Devolver} \le \text{cantidad\_entregada}$$
- Tras la devolución:  
  $$\text{Nueva cantidad\_entregada} = \text{cantidad\_entregada} - \text{cantidad\_devuelta}$$

### 2.3. Recálculo Automático de `parts_status`
Al registrarse la devolución, el sistema reevalúa el estado global de repuestos del equipo:
- Si `total_entregado == 0` ➔ `SIN_REPUESTOS`
- Si `0 < total_entregado < total_solicitado` ➔ `PARCIAL`
- Si `total_entregado >= total_solicitado` ➔ `COMPLETO`

> **Ejemplo:** Si un equipo estaba en estado `COMPLETO` (todas las piezas entregadas) y Operaciones rebota 1 pieza defectuosa, el estado del equipo retrocede inmediatamente a `PARCIAL` en Pizarra y en la tabla de Equipos, alertando que el equipo vuelve a necesitar abastecimiento.

---

## 3. Modelo de Datos y Trazabilidad

### 3.1. Estructura del Historial de Devoluciones (`parts_returns`)
Se agregará en `equipment_records` o en el JSONB de `parts_deliveries` un registro estructurado inmutable para auditoría:

```typescript
export interface PartsReturnItem {
  id: string
  fecha: string                     // ISO string
  devuelto_por_username: string
  devuelto_por_rol: string
  motivo: 'INCOMPATIBLE' | 'DEFECTUOSO' | 'NO_REQUERIDO' | 'DESPACHO_ERRONEO' | 'OTRO'
  items: Array<{
    part_id?: string
    descripcion: string
    cantidad_devuelta: number
    detalle_motivo?: string
  }>
  observaciones?: string
}
```

### 3.2. Registro en `status_history`
Cada evento de devolución generará una entrada inmutable en `status_history` con:
- `changed_by_username`: Nombre del usuario de operaciones.
- `changed_by_role`: `'operaciones'` (o admin).
- `notes`: `[DEVOLUCIÓN DE REPUESTOS] 1x Tarjeta de Control - Motivo: Pieza incompatible`.

---

## 4. Arquitectura y Componentes a Desarrollar / Modificar

```
Flujo de Implementación:
─────────────────────────────────────────────────────────────────────────────
1. Backend:
   └── app/api/equipment/[id]/return-parts/route.ts
       • Valida rol (operaciones, admin, superadmin).
       • Valida cantidad devuelta <= cantidad_entregada.
       • Descuenta cantidad_entregada en approved_parts.
       • Inserta en parts_returns / status_history.
       • Recalcula parts_status ('PARCIAL' / 'SIN_REPUESTOS').
       • Dispara correo en hilo único vía Resend a Logística.

2. Mailer:
   └── lib/mail/mailer.ts
       • Nueva función: sendReboteRepuestos(data)
       • Envía notificación en el hilo existente a heady.mamani@cabelab.com
         alertando el motivo y pieza devuelta.

3. Frontend:
   └── components/equipment/modals/ModalDevolucionRepuestos.tsx
       • Modal interactivo con selección de ítems entregados.
       • Selector de motivo (Incompatible, Defectuoso, No requerido, etc.).
       • Input numérico limitado al stock entregado actual.
       • Campo de observaciones / notas técnicas.

4. Ficha de Equipo:
   └── components/equipment/EquipmentDetail.tsx
       • Nuevo botón "Rebotar / Devolver Repuesto" visible para Operaciones
         cuando hay piezas entregadas (> 0).
       • Nueva pestaña o fila en la tabla de repuestos que muestre historial
         de devoluciones realizadas.
─────────────────────────────────────────────────────────────────────────────
```

---

## 5. Mockup / Interfaz de Usuario Prevista

### Modal: Devolución de Repuestos a Almacén
```
┌──────────────────────────────────────────────────────────────────┐
│  ↩️ DEVOLUCIÓN DE REPUESTOS A ALMACÉN / LOGÍSTICA                │
│  Equipo: FR-2026-084 — LINCOLN Vantage 500                       │
├──────────────────────────────────────────────────────────────────┤
│  Seleccione los ítems y cantidades a devolver a Almacén:         │
│                                                                  │
│  [✓] Diodos de Potencia (Entregados: 4)                          │
│      Cantidad a devolver: [ 2 ]                                  │
│      Motivo: [ Repuesto incompatible / no calza ▼ ]              │
│                                                                  │
│  [ ] Filtro de Combustible (Entregados: 1)                       │
│                                                                  │
│  Observaciones técnicas para Logística:                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Los diodos entregados tienen rosca métrica M12 y el soporte│  │
│  │ requiere M10 según manual técnico.                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Cancelar ]                   [ Confirmar Devolución a Almacén ]│
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Notificación por Correo en Hilo

El sistema despachará automáticamente un correo tipo **RE:** dentro del hilo de la orden:
- **Asunto:** `RE: [INGRESO] FR-2026-084 - LINCOLN Vantage 500 - [Cliente]`
- **Destinatarios:** `heady.mamani@cabelab.com` (Logística), `odp@cabelab.com` (Operaciones).
- **Contenido del correo:**
  - Banner en color ámbar/rojo de advertencia: **"Devolución de Repuesto a Almacén"**.
  - Tabla con repuesto devuelto, cantidad, motivo y responsable de taller.
  - Indicación de que el estado de repuestos del equipo ha retrocedido a `PARCIAL` o `SIN_REPUESTOS` y requiere re-atención.

---

## 7. Plan de Ejecución

Una vez aprobado este documento por el usuario:
1. **Paso 1:** Crear el endpoint de servidor `POST /api/equipment/[id]/return-parts`.
2. **Paso 2:** Crear la función `sendReboteRepuestos` en `lib/mail/mailer.ts`.
3. **Paso 3:** Crear el componente visual `ModalDevolucionRepuestos.tsx`.
4. **Paso 4:** Enlazar el botón en `EquipmentDetail.tsx` condicionado al rol de `operaciones`/`admin` y a la existencia de repuestos entregados.
5. **Paso 5:** Pruebas de verificación de cálculo de estado (`COMPLETO` ➔ `PARCIAL`).
