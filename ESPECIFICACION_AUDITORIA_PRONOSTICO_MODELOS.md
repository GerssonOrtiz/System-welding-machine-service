# ESPECIFICACION_AUDITORIA_PRONOSTICO_MODELOS.md — SYNAPSE v2.5
> Documento técnico de especificación e implementación para IA y desarrolladores.
> Define la arquitectura, lógica de datos, endpoints, UI y motor de pronóstico para la auditoría y estimación de tiempos de servicio por modelo de equipo.

---

## 1. OBJETIVO DEL MÓDULO

Transformar los datos históricos de servicio de CABELAB en un **motor de pronóstico predictivo y auditoría de modelos**.
Permite a taller, recepción y administración:
1. Conocer de antemano cuánto tardará el **diagnóstico**, la **aprobación**, el **mantenimiento** y la **entrega** según el modelo y marca del equipo.
2. Identificar los **factores reales que causan cuellos de botella y retrasos**, basándose en las observaciones y motivos registrados por cada rol (`operaciones`, `almacen`, `recepcion`, `admin`) en `status_history`.

---

## 2. FUENTES DE DATOS EXISTENTES EN EL SISTEMA

El módulo se alimenta de estructuras ya operativas en la base de datos de Supabase:

1. **`equipment_records`**:
   - `brand`, `model`: Identificación del equipo.
   - `service_type`: Tipo de servicio (`GARANTIA_CABELAB`, `GARANTIA_ESAB`, `REVISION_GENERAL`).
   - `date_in`: Fecha de ingreso.
   - `start_diagnosis_at`, `end_diagnosis_at`: Tiempos de diagnóstico.
   - `pending_approval_at`, `approval_at`: Tiempos de cotización y aprobación de ventas/cliente.
   - `start_maintenance_at`, `end_maintenance_at`: Tiempos de reparación/mantenimiento activo.
   - `finalized_at`: Culminación del servicio.
   - `priority_level`: Nivel VIP (0-3).

2. **Vista `equipment_with_status`**:
   - `days_elapsed`: Días totales transcurridos.
   - `phase_1_days`: Días de Ingreso ➔ Pendiente de Aprobación.
   - `phase_2_days`: Días de Evaluación ➔ Aprobación de Ventas.
   - `phase_3_days`: Días de Aprobación ➔ Entrega final.
   - `is_terminal`: Si el equipo ya fue entregado.

3. **`status_history`** (Audit Log de Transiciones):
   - `equipment_id`: FK del equipo.
   - `previous_status`, `new_status`: Transición ocurrida.
   - `changed_by_role`: Rol que realizó el movimiento (`operaciones`, `almacen`, `recepcion`, `superadmin`, etc.).
   - `notes`: Observaciones ingresadas al cambiar estado (explicación de repuestos faltantes, complejidad, fallas atípicas).
   - `is_override`, `override_reason`: Si hubo intervención forzada por superadmin.

4. **`catalog_brands`, `catalog_models`, `parts_catalog`, `part_compatibilities`**:
   - Repuestos compatibles y catálogo estandarizado de modelos.

---

## 3. ARQUITECTURA TÉCNICA PROPUESTA

```
Frontend (Next.js App Router)
├── app/(dashboard)/auditoria-modelos/page.tsx      → Vista interactiva principal
├── components/auditoria/
│   ├── ModelSelectorHeader.tsx                    → Selector dependiente Marca ➔ Modelo + Filtro Tipo Servicio
│   ├── ModelKpiCards.tsx                          → Tarjetas de promedios, medianas y volumen
│   ├── DeliveryForecastCalculator.tsx             → Calculadora interactiva (Fecha ingreso ➔ Fechas estimadas)
│   ├── StageGanttTimeline.tsx                     → Barra horizontal segmentada con tiempos típicos por etapa
│   └── DelayFactorsAudit.tsx                      → Análisis de observaciones y causas de demora por rol
Backend (API Routes)
├── app/api/stats/models/route.ts                  → Listado y ranking de modelos con métricas globales
└── app/api/stats/models/[model]/route.ts          → Análisis profundo de un modelo específico
```

---

## 4. ESPECIFICACIÓN DE APIS Y LÓGICA DE NEGOCIO

### 4.1 Endpoint: `GET /api/stats/models`
Retorna un listado de modelos con volumen de intervenciones y tiempos globales para alimentar tablas o selectores con métricas.

**Filtros aceptados:**
- `brand` (opcional): Filtrar por marca.
- `service_type` (opcional).

**Cálculos por modelo:**
- `total_services`: Cantidad de servicios registrados.
- `completed_services`: Cantidad de servicios con `is_terminal = true`.
- `avg_total_days`: Promedio de días de ciclo completo.
- `median_total_days`: Mediana de días de ciclo completo.
- `delayed_rate`: Porcentaje de equipos de ese modelo que superaron el umbral de atraso (`days_elapsed > 5`).

---

### 4.2 Endpoint: `GET /api/stats/models/[model]`
Retorna el detalle completo y analítico del modelo solicitado (`[model]` codificado en URL).

**Respuesta JSON esperada:**
```json
{
  "success": true,
  "data": {
    "model_name": "WARRIOR 500I",
    "brand": "ESAB",
    "sample_size": 24,
    "confidence_level": "ALTA", // "ALTA" (>=15), "MEDIA" (5-14), "BAJA" (<5)
    "timings": {
      "diagnosis": {
        "avg_days": 1.8,
        "median_days": 1.5,
        "optimistic_days": 1.0, // percentil 20
        "pessimistic_days": 3.2 // percentil 80
      },
      "approval": {
        "avg_days": 2.5,
        "median_days": 2.0,
        "optimistic_days": 1.0,
        "pessimistic_days": 4.5
      },
      "waiting_parts": {
        "occurred_in_pct": 58.3, // porcentaje de servicios que pasaron por "En espera de repuesto"
        "avg_days": 4.1,
        "median_days": 3.5
      },
      "maintenance": {
        "avg_days": 3.2,
        "median_days": 3.0,
        "optimistic_days": 2.0,
        "pessimistic_days": 5.0
      },
      "total_lead_time": {
        "avg_days": 9.4,
        "median_days": 8.0,
        "best_case_days": 5.0,
        "worst_case_days": 16.0
      }
    },
    "delay_factors": [
      {
        "category": "REPUESTOS_LOGISTICA",
        "role": "almacen",
        "frequency": 8,
        "impact": "ALTO",
        "common_terms": ["TARJETA DE CONTROL", "SIN STOCK", "IMPORTACION", "PROVEEDOR LIMA"],
        "sample_notes": [
          "En espera de módulo IGBT de proveedor en Lima",
          "Sin stock de potenciómetro original"
        ]
      },
      {
        "category": "COMPLEJIDAD_TECNICA",
        "role": "operaciones",
        "frequency": 5,
        "impact": "MEDIO",
        "common_terms": ["SULFATADO", "POLVO MINERAL", "BOBINADO"],
        "sample_notes": [
          "Equipo con sulfato severo en placa secundaria por trabajo en mina",
          "Requiere limpieza ultrasónica y barnizado"
        ]
      }
    ],
    "frequent_services": [
      { "service_type": "REVISION_GENERAL", "count": 14, "avg_days": 8.5 },
      { "service_type": "GARANTIA_ESAB", "count": 10, "avg_days": 10.2 }
    ]
  }
}
```

---

## 5. ALGORITMO DEL MOTOR DE PRONÓSTICO (Calculadora)

Dada una fecha de ingreso $D_{in}$ para un equipo de modelo $M$:

1. **Fecha Estimada de Término de Diagnóstico:**
   $$\text{Fecha}_{\text{diag}} = D_{in} + \text{median\_days}(\text{diagnosis})$$
2. **Fecha Estimada de Aprobación Comercial:**
   $$\text{Fecha}_{\text{appr}} = \text{Fecha}_{\text{diag}} + \text{median\_days}(\text{approval})$$
3. **Factor de Riesgo de Repuestos ($F_r$):**
   - Si el modelo requiere repuestos en más del 50% de sus históricos:
     $$\text{Días}_{\text{extra}} = \text{pct\_repuestos} \times \text{median\_days}(\text{waiting\_parts})$$
4. **Fecha Estimada de Culminación Técnica:**
   $$\text{Fecha}_{\text{culm}} = \text{Fecha}_{\text{appr}} + \text{median\_days}(\text{maintenance}) + \text{Días}_{\text{extra}}$$

El cálculo debe excluir fines de semana (opcionalmente configurable como días hábiles vs días calendario).

---

## 6. CLASIFICACIÓN DE FACTORES DE RETRASO (Text Mining / NLP Simple)

Para procesar el campo `notes` en `status_history` sin sobreingeniería:

1. **Diccionario de Palabras Clave por Categoría:**
   - **Logística / Repuestos:** `STOCK`, `PROVEEDOR`, `LIMA`, `IMPORTACION`, `REPUESTO`, `TARJETA`, `IGBT`, `MODULO`, `PEDIDO`, `EN ESPERA`.
   - **Técnica / Falla Compleja:** `SULFATADO`, `QUEMADO`, `CORTO`, `REBOBINADO`, `MINA`, `POLVO`, `INTERMITENTE`, `HUMEDAD`, `REVISIÓN ADICIONAL`.
   - **Cliente / Aprobación:** `CLIENTE`, `COTIZACION`, `APROBACION`, `COSTO`, `PRESUPUESTO`, `DECISION`, `SIN RESPUESTA`.
   - **Control de Calidad / Pruebas:** `PRUEBA`, `SOLDADURA`, `VOLTAJE`, `AMPERAJE`, `FALLA EN CARGA`, `CALIDAD`.

2. **Asociación con el Rol:**
   - Se cruza el texto con `changed_by_role` para identificar qué área detectó o reportó el motivo de retención del equipo.

---

## 7. DISEÑO DE LA INTERFAZ DE USUARIO (Componentes)

1. **Cabecera de Selección:**
   - Dropdown de Marca ➔ Dropdown dependiente de Modelo (usando `BrandSelector` y `ModelSelector`).
   - Badge de "Muestra Estadística": ej. *"24 mantenimientos analizados — Precisión Alta"*.

2. **Línea de Tiempo Típica (Gantt Promedio):**
   - Barra con segmentos de colores:
     - 🟦 Diagnóstico (~1.8d)
     - 🟨 Aprobación (~2.5d)
     - 🟧 Espera de Repuesto (~4.1d, si aplica)
     - 🟩 Mantenimiento activo (~3.2d)
     - 🟪 Pruebas y Entrega (~1.0d)

3. **Calculadora Interactiva de Fecha de Entrega:**
   - Entrada: Fecha de ingreso + Tipo de servicio.
   - Salida visual: Calendario con fechas hitos proyectadas y advertencia de riesgo si el modelo suele requerir piezas de importación.

4. **Tarjeta de Factores de Retraso Críticos:**
   - Alertas con badges amarillos/rojos:
     - *"El 58% de estos equipos se retrasa por falta de stock en Tarjetas de Control (+4.1 días promedio)."*
     - *"Frecuente daño por polvo mineral reportado por Operaciones."*

---

## 8. PERMISOS Y SEGURIDAD

- **Ruta de UI:** Accesible para `superadmin`, `admin`, `operaciones`, `visualizador`.
- **API Backend:** Protegida con `requireAuth()` (`lib/api/auth.ts`). Solo usuarios autenticados con cuentas activas pueden consultar las estadísticas.
- **Rendimiento:** Las consultas sobre `status_history` y `equipment_records` deben tener índice en `(model, current_status_id)` y `(equipment_id, timestamp)`.

---

## 9. PLAN DE IMPLEMENTACIÓN PASO A PASO

- [ ] **Paso 1:** Crear migración SQL con índices recomendados en `equipment_records(model)` si no existieran.
- [ ] **Paso 2:** Crear helper analítico `lib/stats/model-forecast.ts` que calcule percentiles, medianas y análisis de términos frecuentes en notas.
- [ ] **Paso 3:** Implementar endpoints `/api/stats/models` y `/api/stats/models/[model]`.
- [ ] **Paso 4:** Crear componentes de UI en `components/auditoria/`.
- [ ] **Paso 5:** Crear la página `/app/(dashboard)/auditoria-modelos/page.tsx` y agregar el item al Sidebar (`SIDEBAR_ITEMS_BY_ROLE` en `types/user.ts`).
- [ ] **Paso 6:** Validar build y tipos con `npx tsc --noEmit` y `npm run build`.
