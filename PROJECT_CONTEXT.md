# PROJECT_CONTEXT.md — SYNAPSE v2.5
> Documento de contexto técnico optimizado para lectura por IA. Contiene arquitectura, estructura, flujos y convenciones. Leer antes de tocar cualquier archivo.

---

## 1. IDENTIDAD DEL PROYECTO

**SYNAPSE** es un sistema de gestión operativa para un taller de mantenimiento de motosoldadoras en Arequipa, Perú. Digitaliza el ciclo completo: ingreso → diagnóstico → cotización/aprobación → mantenimiento → entrega, con una **Pizarra Virtual** sincronizada en tiempo real como pieza central.

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| Lenguaje | TypeScript (strict) | ^5 |
| Base de Datos | PostgreSQL vía Supabase | — |
| Auth | Supabase Auth | @supabase/ssr ^0.10.3 |
| Realtime | Supabase Realtime (WebSockets) | — |
| Estado cliente | SWR | ^2.4.1 |
| Estilos | Tailwind CSS | ^3.4.19 |
| Iconos | Lucide React | ^1.18.0 |
| Formularios | react-hook-form + Zod | ^7 + ^4 |
| Notificaciones UI | Sonner (Toasts) | ^2.0.7 |
| Códigos QR | qrcode.react (SVG / Canvas) | ^4.2.0 |
| Email | Resend | ^6.12.4 — **pendiente configurar RESEND_API_KEY** |
| Export | xlsx | ^0.18.5 |
| UI Primitives | Radix UI (Dialog, Select, Dropdown) | — |

---

## 3. ARQUITECTURA GENERAL

```
Next.js App Router
├── app/                   → Páginas y API Routes (server-side por defecto)
│   ├── page.tsx           → Raíz dinámica con redirección inteligente según sesión y rol
│   ├── (auth)/            → Rutas públicas: /login
│   ├── (dashboard)/       → Rutas protegidas (layout.tsx Server Component con UserProvider)
│   ├── doc/               → Rutas públicas para escaneo QR de motosoldadoras
│   │   ├── [serial]/      → /doc/[serial]  — historial completo por número de serie
│   │   └── fr/[fr]/       → /doc/fr/[fr]   — ficha de ingreso único por FR (equipos sin serie)
│   ├── admin/             → Páginas de administración (fuera del layout dashboard)
│   └── api/               → API Routes (REST, server-side)
│       └── public/        → API Routes públicas sin autenticación (/api/public/equipment/...)
├── proxy.ts               → Next.js 16 Proxy: protección de rutas, preservación de cookies en redirects y refresh
├── components/            → Componentes React reutilizables (client-side)
│   ├── layout/            → DashboardShell (menú/UI), Navbar, Sidebar
│   └── equipment/modals/  → Sub-modales de correo y entrega de repuestos
├── lib/                   → Lógica de servidor: Supabase, workflow, validaciones, mail
├── hooks/                 → Custom hooks (useUser context provider, useRealtimePizarra, etc.)
├── types/                 → Tipos TypeScript derivados del esquema de BD
└── supabase/migrations/   → Historial SQL del esquema (001–019)
```

**Patrón de renderizado:** Server Components por defecto en `app/`. `app/(dashboard)/layout.tsx` valida sesión en el servidor y alimenta `<UserProvider>` y `<DashboardShell>`, eliminando pantallas de carga infinitas en el cliente. Directiva `'use client'` solo donde se necesita interactividad. Las API Routes actúan como capa de acceso a Supabase desde el cliente.

---

## 4. ESTRUCTURA DETALLADA

### `/app/(auth)/`
- `login/page.tsx` — Formulario de login. Autenticación por nombre de usuario → email virtual `usuario@cabelab.local`. Registro público deshabilitado (solo superadmin crea cuentas).

### `/app/doc/`
- `[serial]/page.tsx` — **Página pública de documentación técnica y trazabilidad por QR** para equipos **con número de serie**. Responsiva para móviles, exenta de autenticación en `middleware.ts`. Muestra datos del equipo, botón destacado para ver/descargar el último informe en Google Drive, y línea cronológica de todos los servicios anteriores.
- `fr/[fr]/page.tsx` — **Página pública para equipos sin número de serie**. Accesible por QR via FR number (`/doc/fr/FR-2024-001`). Muestra los datos del ingreso específico (marca, modelo, cliente, estado, tipo de servicio, informe si existe). Incluye aviso de que el QR identifica únicamente ese ingreso. Sin historial cruzado de intervenciones.

### `/app/(dashboard)/`
Layout en `layout.tsx` incluye `Sidebar` y `Navbar`. Rutas hijas:
| Ruta | Descripción | Roles con acceso |
|---|---|---|
| `/dashboard` | Métricas globales + tabla paginada de todos los equipos | superadmin, admin |
| `/pizarra` | Tablero kanban realtime con columnas por estado | todos |
| `/equipos` | CRUD de equipos con filtros y paginación | superadmin, admin, operaciones, recepcion, almacen |
| `/taller` | Vista operativa para técnicos (equipos asignados) | superadmin, admin |
| `/estadisticas` | Analytics: por empresa, marca, modelo, tiempos | superadmin, admin, visualizador |
| `/auditoria-modelos` | Auditoría y pronóstico predictivo por modelo (tiempos por fase, cálculo de entrega y motivos de retraso) | superadmin, admin, operaciones, visualizador |
| `/dna` | Historial clínico completo por número de serie | todos |
| `/buscar` | Buscador instantáneo por FR, cliente, serie | recepcion, almacen |
| `/historial` | Log de cambios de estado (status_history) | admin |
| `/perfil` | Edición de perfil propio | todos |
| `/admin/usuarios` | Aprobar/bloquear usuarios, asignar roles | superadmin |
| `/admin/workflow` | Editor visual del flujo de estados/transiciones | superadmin |

### `/app/admin/`
- `catalog/page.tsx` — Gestión de catálogo (marcas, modelos, repuestos). Fuera del layout dashboard para diseño full-screen.

### `/app/api/`
Todas las API Routes usan `createServerClient()` de `lib/supabase/server.ts`, salvo `/api/public/` que usa `createAdminClient()`.
| Endpoint | Método | Función |
|---|---|---|
| `/api/equipment` | GET | Listado paginado con filtros y permisos por rol |
| `/api/equipment` | POST | Crear equipo (valida con Zod, auto-registra marca) |
| `/api/equipment/[id]` | GET | Detalle + historial + next_states disponibles |
| `/api/equipment/[id]` | PATCH | Actualizar campos (superadmin puede editar timestamps) |
| `/api/equipment/[id]` | DELETE | Eliminar (solo superadmin/admin) |
| `/api/equipment/search` | GET | Búsqueda por FR, cliente, serie |
| `/api/equipment/serial/[serial]` | GET | DNA: historial completo por número de serie (autenticado) |
| `/api/public/equipment/serial/[serial]` | GET | **Público**: consulta de ficha técnica, último informe PDF e intervenciones por QR (historial completo) |
| `/api/public/equipment/fr/[fr]` | GET | **Público**: consulta de un único ingreso por FR number. Usado por el QR de equipos sin número de serie |
| `/api/equipment/export` | GET | Exportar a Excel (.xlsx) |
| `/api/equipment/import` | POST | Importar desde Excel |
| `/api/equipment/create` | POST | Creación de equipo (individual o lote/batch). Genera un único correo consolidado, asigna `batch_id`, `email_thread_id` y `email_thread_subject` |
| `/api/equipment/[id]/update-status` | POST | Cambio de estado. Detecta estado destino y dispara correo-reply específico en el hilo existente (`In-Reply-To` / `References` normalizados). Acepta JSON o FormData (informe ODP con PDF y `report_url`). Soporta evento "En espera de repuesto" con solicitud estructurada de piezas. Usa `supabase.auth.getUser()` |
| `/api/equipment/[id]/deliver-parts` | POST | **Logística / Almacén**: Entrega total/parcial de repuestos aprobados o ítems adicionales. Actualiza `approved_parts`, `parts_deliveries`, recalcula `parts_status` ('SIN_REPUESTOS' \| 'PARCIAL' \| 'COMPLETO') e inserta en `status_history`. Despacha correo `sendEntregaLogistica` en el hilo |
| `/api/equipment/[id]/update` | PUT | Edición de equipo. Permitida para `superadmin`, `admin` y para `recepcion` únicamente si el equipo está en estado inicial "En espera de diagnóstico" |
| `/api/equipment/[id]/force-status` | POST | Override de estado (solo superadmin). Notificación por correo opcional |
| `/api/workflow/states` | GET/POST | CRUD de estados del workflow |
| `/api/workflow/transitions` | GET/POST | CRUD de transiciones del workflow |
| `/api/calendar/holidays` | GET/POST | CRUD de feriados y días no laborables (`non_business_days`) para el cálculo de días hábiles |
| `/api/calendar/holidays/[id]` | DELETE | Eliminar día no laborable |
| `/api/users/list` | GET | Lista de usuarios con email (solo superadmin) |
| `/api/users/[id]` | PATCH | Aprobar/bloquear/cambiar rol |
| `/api/users/technicians` | GET | Técnicos para asignación |
| `/api/clients` | GET | Nombres únicos de clientes (para ClientSelector) |
| `/api/catalog/brands` | GET/POST | CRUD de marcas del catálogo |
| `/api/catalog/models` | GET/POST | CRUD de modelos por marca |
| `/api/admin/technicians` | GET/POST/PATCH | Gestión de técnicos |
| `/api/stats` | GET | Métricas del dashboard (totales, atrasados, promedios) |
| `/api/stats/models` | GET | Listado y ranking de modelos con volumen, tiempos medios y tasa de retraso |
| `/api/stats/models/[model]` | GET | Detalle analítico profundo de un modelo (tiempos p20/p80 por fase, factores de retraso y NLP de notas) |

### `/components/`
| Componente | Responsabilidad |
|---|---|
| `layout/Sidebar.tsx` | Navegación lateral. Items visibles según `SIDEBAR_ITEMS_BY_ROLE` del tipo `user.ts` |
| `layout/Navbar.tsx` | Barra superior con usuario activo y logout |
| `layout/DashboardShell.tsx` | Envoltorio client-side del layout dashboard (menú móvil, Navbar y Sidebar) desacoplado del server layout |
| `equipment/EquipmentForm.tsx` | Formulario de creación/edición de equipos (individual o en lote) |
| `equipment/EquipmentDetail.tsx` | Ficha completa del equipo. Layout con secciones colapsables: Tiempos Operativos, Demora por Fases, Historial de Estados y Control de Repuestos. Cabecera con badge dual (servicio y repuestos). Botón de edición habilitado para superadmin/admin y recepción (estado inicial). Modal de entregas |
| `equipment/EquipmentTable.tsx` | Tabla paginada con indicadores VIP, badge de repuestos (`parts_status`), filtros y botón directo de etiqueta QR |
| `equipment/QRPrintModal.tsx` | Modal con generación de código QR (qrcode.react) e impresión optimizada de etiqueta física |
| `equipment/StatusChangeModal.tsx` | Modal principal de cambio de estado de servicio taller. Renderiza sub-modales de correo según estado destino |
| `equipment/StatusBadge.tsx` | Badge de color dinámico según `status_color` de la vista |
| `equipment/ClientSelector.tsx` | Búsqueda predictiva de clientes existentes + registro de nuevos |
| `equipment/BrandSelector.tsx` | Búsqueda predictiva de marcas del catálogo. Auto-registra marcas nuevas |
| `equipment/ModelSelector.tsx` | Selector de modelos filtrado por marca seleccionada |
| `equipment/modals/ModalInformeODP.tsx` | Sub-modal: diagnóstico técnico + upload PDF (estado "Pendiente de aprobación") |
| `equipment/modals/ModalAprobacionVentas.tsx` | Sub-modal: tabla dinámica repuestos/servicios aprobados + observaciones (estado "Aprobado", inicializa `approved_parts` y `parts_status = 'SIN_REPUESTOS'`) |
| `equipment/modals/ModalEntregaLogistica.tsx` | Sub-modal de solicitud/entrega de repuestos con items requeridos y notas |
| `equipment/modals/ModalEntregaRepuestos.tsx` | Modal dedicado de Almacén/Logística para registro directo de entregas (totales o parciales) de repuestos aprobados e ítems adicionales |
| `equipment/modals/ModalCulminadoODP.tsx` | Sub-modal: texto predefinido + observaciones finales (estado "Listo para entrega") |
| `pizarra/PizarraBoard.tsx` | Tablero kanban realtime con columnas de taller (`Aprobado`, `En mantenimiento`). Usa `useRealtimePizarra` |
| `pizarra/PizarraCard.tsx` | Tarjeta de equipo con estrellas VIP ⭐, efecto glow pulsante y chip independiente de estado de repuestos (`📦 Parcial`, `📦 Listo`, etc.) |
| `admin/BrandModelManager.tsx` | CRUD de marcas y modelos del catálogo |
| `admin/PartManager.tsx` | CRUD de repuestos con asignación de compatibilidad por modelo |
| `admin/TechnicianManager.tsx` | CRUD de técnicos del taller |
| `admin/HolidayCalendarManager.tsx` | Gestión de calendario de feriados y días no laborables para cálculo predictivo |
| `auditoria/ModelSelectorHeader.tsx` | Selector jerárquico Marca ➔ Modelo con badge de tamaño de muestra y nivel de confianza |
| `auditoria/ModelKpiCards.tsx` | Tarjetas con promedios, medianas, percentiles y tasa de retraso histórico |
| `auditoria/StageGanttTimeline.tsx` | Diagrama Gantt horizontal de tiempos típicos por etapa (diagnóstico, cotización, repuestos, taller, entrega) |
| `auditoria/DeliveryForecastCalculator.tsx` | Calculadora interactiva de fecha proyectada de culminación considerando días no laborables y feriados de BD |
| `auditoria/DelayFactorsAudit.tsx` | Matriz de factores de retraso clasificados por NLP y agrupados por rol (`almacen`, `operaciones`) |
| `ui/ToasterProvider.tsx` | Wrapper de Sonner para notificaciones globales |

### `/lib/`
| Archivo | Responsabilidad |
|---|---|
| `supabase/client.ts` | Cliente Supabase para browser (`createBrowserClient`) |
| `supabase/server.ts` | Cliente Supabase para Server Components y API Routes (`createServerClient`) |
| `supabase/middleware.ts` | `updateSession()` — refresca cookies de sesión en cada request |
| `workflow/engine.ts` | `WorkflowEngine` — clase estática: `validateTransition`, `getNextStates`, `isTerminal` |
| `validations/equipment.schema.ts` | Schemas Zod: `createEquipmentSchema`, `updateStatusSchema`, `forceStatusSchema`, + 4 schemas de eventos de correo |
| `validations/user.schema.ts` | Schema Zod para validar inputs de usuarios |
| `mail/mailer.ts` | Sistema de correos en hilo con Resend (envíos dirigidos a `ENTRY_TO` y cabeceras normalizadas RFC 2822). Ver sección 11 para detalle completo |
| `stats/model-forecast.ts` | Motor analítico de pronóstico: cálculo de medianas, p20/p80, lead time y clasificador NLP de motivos de retraso |
| `env.ts` | Validación de variables de entorno al arrancar |
| `api/auth.ts` | Helpers centralizados de autenticación server-side (`requireAuth`, `requireSuperadmin`) con validación estricta vía `getUser()` |

### `/hooks/`
| Hook | Responsabilidad |
|---|---|
| `useRealtimePizarra.ts` | Suscripción a cambios en `equipment_records` vía WebSocket. Agrupa equipos por estado. Ordena por `priority_level` DESC, luego por `date_in` ASC |
| `useEquipmentList.ts` | SWR fetch paginado de `/api/equipment` + `/api/stats` para el dashboard |
| `useUser.tsx` | Contexto `<UserProvider>` y hook `useUser()`. Recibe datos del servidor sin loading asíncrono, escucha `onAuthStateChange` para refrescos/sign-out |

### `/types/`
| Archivo | Contenido |
|---|---|
| `database.types.ts` | Tipos auto-generados del esquema de Supabase (fuente de verdad de tipos de BD) |
| `equipment.ts` | `EquipmentRecord`, `EquipmentWithStatus`, `WorkflowState`, helpers de negocio |
| `user.ts` | `UserProfile`, `UserRole`, helpers de permisos, `SIDEBAR_ITEMS_BY_ROLE`, `ROLE_HOME_ROUTE` |
| `catalog.ts` | Tipos para `CatalogBrand`, `CatalogModel`, `Part` |

---

## 5. BASE DE DATOS — ESQUEMA

### Tablas principales
| Tabla | Descripción clave |
|---|---|
| `user_profiles` | `id` (FK auth.users), `username`, `role` (enum), `is_active`, `is_superadmin` |
| `equipment_records` | Tabla central. `fr_number`, `serial_number`, `current_status_id`, `priority_level` (0-3 VIP), timestamps por fase, `email_thread_id`, `email_cc[]` |
| `workflow_states` | `id`, `name`, `color`, `is_initial`, `is_terminal`, `order_index` |
| `workflow_transitions` | `from_state_id`, `to_state_id`, `allowed_roles[]` |
| `status_history` | Audit log inmutable. `equipment_id`, `new_status`, `previous_status`, `changed_by_username`, `is_override` |
| `technicians` | `id` (integer), `name`, `is_active` |
| `catalog_brands` | `id` (UUID), `name` UNIQUE |
| `catalog_models` | `id`, `brand_id` (FK), `name`. UNIQUE(brand_id, name) |
| `parts_catalog` | `part_number` UNIQUE, `name`, `specifications` |
| `part_compatibilities` | JOIN table parts ↔ models |

### Columnas en `equipment_records` destacadas
| Columna | Tipo | Migración | Descripción |
|---|---|---|---|
| `parts_status` | `TEXT` | 019 | Estado logístico de repuestos: `SIN_REPUESTOS`, `PARCIAL` o `COMPLETO` |
| `approved_parts` | `JSONB` | 019 | Lista de repuestos/insumos aprobados por Ventas con cantidades solicitadas y entregadas |
| `parts_deliveries` | `JSONB` | 019 | Historial inmutable de entregas realizadas por Logística con fechas, notas y responsable |
| `email_thread_id` | `TEXT` | 013 | Message-ID devuelto por Resend al enviar el correo de ingreso. Se usa formateado como `<id@domain>` en `In-Reply-To` y `References` en todos los replies del hilo |
| `email_cc` | `TEXT[]` | 013 | Columna en BD (legacy / sin uso actual: CC fue removido del frontend y backend para simplificar el flujo) |
| `report_url` | `TEXT` | 015 | Enlace directo al PDF del informe técnico (Google Drive u otro). Se muestra en la página pública por QR `/doc/[serial]` |
| `batch_id` | `UUID` | 018 | Identificador del lote para agrupar múltiples equipos ingresados juntos en la misma orden |
| `email_thread_subject` | `TEXT` | 018 | Asunto original exacto del hilo generado al ingresar el o los equipos. Se usa para prefijar `RE:` idéntico en todos los replies |

### Vista central: `equipment_with_status`
JOIN de `equipment_records` + `workflow_states`. Agrega `status_name`, `status_color`, `is_terminal`, `days_elapsed`, `phase_1/2/3_days`, `assigned_technicians[]`, `priority_level`, `parts_status`, `approved_parts` y `parts_deliveries`.

### Flujo desacoplado: Servicio de Taller vs. Repuestos (Migración 019 / Especificación implementada)
El sistema opera con **dos líneas de estado completamente desacopladas**:
1. **Línea de Servicio Taller (Workflow principal)**:
   ```
   En espera de diagnóstico
     → En diagnóstico
       → Pendiente de aprobación   ← correo: Informe ODP (con PDF adjunto)
         → Aprobado                ← correo: Aprobación Ventas (tabla repuestos, inicia parts_status = 'SIN_REPUESTOS')
           → En mantenimiento      (Operaciones inicia trabajo físico sin bloqueo de repuestos)
             → Control de calidad
               → Listo para entrega  ← correo: Culminado ODP
                 → Entregado (terminal)
   ```
2. **Línea Logística de Repuestos (Almacén)**:
   - Funciona en paralelo sin bloquear ni ser bloqueada por el avance del taller.
   - Estados: `SIN_REPUESTOS` ➔ `PARCIAL` ➔ `COMPLETO`.
   - Logística registra entregas mediante `/api/equipment/[id]/deliver-parts` o `ModalEntregaRepuestos`, disparando el correo `sendEntregaLogistica` en el hilo sin forzar cambios de estado del taller.

---

## 6. AUTENTICACIÓN Y AUTORIZACIÓN

**Login:** Usuario ingresa su `username` → el sistema construye `username@cabelab.local` → Supabase Auth.

**Proxy (`proxy.ts` — convención Next.js 16):**
1. Rutas públicas (`/login`) → redirige al dashboard correspondiente según rol si ya tiene sesión, transfiriendo cookies actualizadas.
2. Sin sesión → redirect a `/login`.
3. `is_active = false` → redirect a `/login?error=no-aprobado` + borra cookies de sesión.
4. Rutas protegidas (`/` y subrutas) → redirige según `ROLE_HOME_ROUTE` preservando cookies de refresco.
5. Rutas de superadmin → verifica `is_superadmin = true`.

**Layout Protegido (`app/(dashboard)/layout.tsx`):**  
Es un **Server Component**. Verifica sesión y perfil en el servidor antes del render y los inyecta en `<UserProvider>`, eliminando estados de espera (`loading: false`) y asegurando render instantáneo sin pantallas de carga infinitas al recargar.

**RLS (Row Level Security):** Activo en todas las tablas. Políticas en migración `005_rls_policies.sql`.

**Roles y permisos** (definidos en `types/user.ts`):
| Rol | Home Route (`ROLE_HOME_ROUTE`) | Acceso principal / Sidebar |
|---|---|---|
| `superadmin` | `/admin/usuarios` | Todo + gestión de usuarios, edición de timestamps, workflow, catálogo |
| `admin` | `/dashboard` | Dashboard, pizarra, equipos, historial, estadísticas, pronóstico, DNA, gestión de feriados |
| `operaciones` | `/equipos` | Equipos, pizarra, pronóstico, DNA, perfil |
| `recepcion` | `/equipos` | Equipos (crear y editar en estado inicial "En espera de diagnóstico"), pizarra, búsqueda, pronóstico, DNA |
| `almacen` | `/equipos` | Equipos (gestión y entrega de repuestos), pizarra, búsqueda, DNA |
| `visualizador` | `/pizarra` | Solo lectura: pizarra, estadísticas, pronóstico, equipos, DNA |

---

## 7. FLUJO DE DATOS

```
Usuario → Componente (client) → fetch /api/... → API Route (server)
                                                      ↓
                                              createServerClient()
                                                      ↓
                                              Supabase PostgreSQL (RLS activo)
                                                      ↓
                                              Respuesta JSON → SWR cache → Re-render

Realtime (Pizarra):
Supabase Realtime → useRealtimePizarra (WebSocket) → setState → Re-render PizarraBoard
```

---

## 8. PATRONES DE DISEÑO

- **Server/Client split:** Server Components para fetching inicial, `'use client'` para interactividad.
- **Repository pattern vía API Routes:** Toda la lógica de BD está en `/app/api/`, los componentes nunca tocan Supabase directamente.
- **Schema-first typing:** `database.types.ts` es la fuente de verdad.
- **Workflow Engine dinámico:** `WorkflowEngine` consulta la BD en runtime, no hay estados hardcodeados.
- **Zod validation en boundary:** Validación en la API Route, no en el componente.
- **SWR para cache + revalidación:** `mutate()` manual tras mutaciones.
- **Audit Log obligatorio:** Todo cambio de estado escribe en `status_history` (inmutable).
- **Correos en hilo:** El correo de ingreso genera un `message_id` que se persiste en BD. Todos los eventos posteriores usan `In-Reply-To` para aparecer en el mismo hilo en Gmail/Outlook.

---

## 9. CONVENCIONES DE CÓDIGO

- **Imports:** Alias `@/` apunta a la raíz del proyecto.
- **Supabase cliente:** `createServerClient()` en API Routes/Server Components. `createBrowserClient()` solo en hooks o componentes client-side.
- **Respuestas API:** Formato uniforme `{ success: boolean, data?: any, error?: string }`.
- **Estilos:** Solo Tailwind CSS. Colores clave: `neon-blue`, `neon-purple`, `bg-base`, `bg-surface`, `bg-elevated`, `text-primary`, `text-secondary`, `border-subtle`.
- **Fondos sólidos:** SIEMPRE usar `bg-bg-elevated` en dropdowns, modales, filtros y selectores. No usar transparencias en elementos interactivos.
- **Iconos:** Solo `lucide-react`. No instalar otras librerías de iconos.

---

## 10. VARIABLES DE ENTORNO REQUERIDAS

```env
NEXT_PUBLIC_SUPABASE_URL=...        # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Anon key pública
SUPABASE_SERVICE_ROLE_KEY=...       # Service role key (solo servidor, para admin ops)
RESEND_API_KEY=re_xxxxxxxxxxxx      # Obtener en resend.com — sin esto los correos se omiten silenciosamente
```

---

## 11. SISTEMA DE CORREOS EN HILO — DETALLE COMPLETO

> Última actualización: 04/10/2026

### Arquitectura general

- **Proveedor:** [Resend](https://resend.com) — infraestructura de email como servicio. No requiere cuentas de correo reales. Solo la `RESEND_API_KEY`.
- **Remitente actual:** `Ventas Cabelab <onboarding@resend.dev>` (dominio de prueba de Resend).
- **Remitente en producción:** Cambiar a `notificaciones@cabelab.com` una vez verificado el dominio `cabelab.com` en el panel de Resend.
- **Hilo de correo:** El correo de ingreso guarda su `id` devuelto por Resend en `equipment_records.email_thread_id`. Todos los correos posteriores del mismo equipo usan `In-Reply-To` y `References` normalizados al estándar RFC 2822 (`<threadId@dominio>`) con asunto `RE:` idéntico → se agrupan de forma fiable en el mismo hilo en Gmail, Outlook y otros clientes de correo.
- **Sin CC:** Para simplificar el sistema, se eliminó la selección y envío de CC del frontend y backend; los correos se envían exclusivamente a los destinatarios definidos en `ENTRY_TO`.
- **Los correos del workflow NO se almacenan en BD** — solo van al correo. Ahorra espacio en Supabase gratuito (500 MB límite).

### Destinatarios fijos de todos los correos (ENTRY_TO)
```
ventas@cabelab.com       → Recepción / Ventas
odp@cabelab.com          → Operaciones
heady.mamani@cabelab.com → Logística
daniel.rojas@cabelab.com → Fijo adicional
vivian.mamani@cabelab.com → Fijo adicional
```

### Puntos de disparo de correo

| Estado destino | Quién lo hace | Correo que se envía | Datos requeridos en el modal |
|---|---|---|---|
| **Ingreso** (al crear equipo) | Recepción / Ventas | Tabla horizontal con datos del equipo | Datos del equipo |
| **Pendiente de aprobación** | ODP | Informe técnico con PDF adjunto | Texto de diagnóstico + archivo PDF |
| **Aprobado** | Ventas | Tabla de repuestos/servicios aprobados | Filas: descripción / cantidad / precio + observaciones |
| **En espera de repuesto** | Logística / Taller | Solicitud o entrega de repuestos | Filas: descripción / cantidad / detalle + observaciones |
| **Coordinación con el cliente** | Operaciones / Admin | Reply en hilo con cuerpo personalizado | Checkbox "Enviar correo" + campo de texto para cuerpo del correo |
| **Listo para entrega** | ODP | Texto predefinido de culminado | Observaciones adicionales (opcional) |
| Otros estados | — | **Sin correo** | — |
| **Override superadmin** | Superadmin | Correo con banner amarillo de advertencia | Solo si activa el checkbox "notificar por correo" |

### Archivos del sistema de correos

```
lib/mail/mailer.ts                              → Lógica central. ENTRY_TO[], normalización formatMessageId(), 6 funciones de envío
lib/validations/equipment.schema.ts             → Schemas Zod para eventos de correo
app/api/equipment/create/route.ts               → Guarda email_thread_id tras el envío de ingreso
app/api/equipment/[id]/update-status/route.ts   → Detecta estado destino y dispara el reply en hilo correspondiente
app/api/equipment/[id]/force-status/route.ts    → Override con correo opcional
components/equipment/EquipmentForm.tsx          → Formulario de ingreso de equipo
components/equipment/StatusChangeModal.tsx      → Orquesta sub-modales según estado destino
components/equipment/modals/ModalInformeODP.tsx         → Diagnóstico + upload PDF
components/equipment/modals/ModalAprobacionVentas.tsx   → Tabla dinámica repuestos aprobados
components/equipment/modals/ModalEntregaLogistica.tsx   → Tabla repuestos solicitados/entregados
components/equipment/modals/ModalCoordinacionCliente.tsx → Checkbox de envío + redacción del cuerpo del correo
components/equipment/modals/ModalCulminadoODP.tsx       → Texto predefinido + observaciones
supabase/migrations/013_email_thread.sql        → Columna email_thread_id
```

### Funciones del mailer

Todas las funciones retornan un objeto normalizado `MailerResult` (`{ success: boolean, messageId?: string, skipped?: boolean, error?: string }`). Si `RESEND_API_KEY` no está configurada, retornan `{ success: false, skipped: true }` sin lanzar error no controlado.

| Función | Descripción | Retorno |
|---|---|---|
| `sendBatchEquipmentEntry(data)` | Correo de ingreso consolidado con tabla HTML para 1 o varios equipos de un mismo cliente. Genera asunto con lista de FRs. | `Promise<MailerResult & { subject?: string }>` |
| `sendEquipmentEntry(data)` | Correo de ingreso unitario (delega en `sendBatchEquipmentEntry`). | `Promise<MailerResult & { subject?: string }>` |
| `sendInformeODP(data)` | Reply en hilo con diagnóstico + PDF adjunto (Buffer). Respeta `thread_subject` si existe. | `Promise<MailerResult>` |
| `sendAprobacionVentas(data)` | Reply en hilo con tabla de repuestos/servicios aprobados. Respeta `thread_subject` si existe. | `Promise<MailerResult>` |
| `sendSolicitudRepuestos(data)` | Reply en hilo solicitando repuestos/componentes a Almacén/Logística. Respeta `thread_subject` si existe. | `Promise<MailerResult>` |
| `sendEntregaLogistica(data)` | Reply en hilo con tabla de repuestos entregados y nota compatible. Respeta `thread_subject` si existe. | `Promise<MailerResult>` |
| `sendCoordinacionCliente(data)` | Reply en hilo con cuerpo personalizado redactado por el usuario en el modal. Respeta `thread_subject` si existe. | `Promise<MailerResult>` |
| `sendCulminadoODP(data)` | Reply en hilo con texto institucional de culminado + observaciones. Respeta `thread_subject` si existe. | `Promise<MailerResult>` |
| `sendStatusChange(data, isOverride)` | Correo interno por override (banner amarillo) o cambio manual. | `Promise<MailerResult>` |

### `update-status/route.ts` — lógica de ejecución y resiliencia

1. **Recepción:** Acepta tanto **JSON** como **FormData** (`multipart/form-data` para subida de informe PDF).
2. **Autenticación robusta:** Valida la sesión con `supabase.auth.getUser()`.
3. **Validación:** Valida con Zod y comprueba permisos con `WorkflowEngine.validateTransition`. Maneja adecuadamente errores de base de datos diferenciándolos de "Equipo no encontrado".
4. **Persistencia e Historial:** Actualiza `equipment_records`, disparando el trigger en PostgreSQL que inserta inmutablemente en `status_history`.
5. **Despacho de Correo:** Si el estado destino requiere correo y existe `email_thread_id`, ejecuta el reply correspondiente mediante `mailer` con cabeceras `In-Reply-To` y `References` delimitadas.
6. **Resiliencia (No Reversión):** Si el cambio de estado tiene éxito pero el envío de correo falla (o no hay hilo registrado), **el estado no se revierte** en base de datos. La API retorna `success: true` con una propiedad `warning: string` que `StatusChangeModal` muestra mediante `toast.warning()`, permitiendo al usuario conocer el incidente y reintentar si lo requiere.

### Para modificar destinatarios

Editar directamente `lib/mail/mailer.ts`:
```typescript
// Destinatarios fijos de todos los correos:
const ENTRY_TO = [ ... ]
```

### Pasos pendientes para activar el sistema de correos

1. **Ejecutar migración** `013_email_thread.sql` en el panel SQL de Supabase
2. **Configurar** `RESEND_API_KEY` en `.env.local` o en Variables de Entorno de Vercel
3. **Verificar dominio** `cabelab.com` en [resend.com/domains](https://resend.com/domains) (agregar registros DNS SPF + DKIM)
4. **Cambiar el remitente** en `lib/mail/mailer.ts`:
   ```typescript
   const FROM_ADDRESS = 'CABELAB <notificaciones@cabelab.com>'
   ```

---

## 12. ESTADO ACTUAL Y PENDIENTES

> Última sesión: 04/10/2026

### ✅ Implementado y funcional
 
 - Sistema de roles y autenticación por username completo
+- **Arquitectura de Autenticación Server-First y Persistencia de Sesión (Next.js 16)**:
+  - Migración a convención `proxy.ts` de Next.js 16 (reemplazo de `middleware.ts`).
+  - Propagación obligatoria de cookies de sesión refrescadas en redirecciones HTTP.
+  - Cliente Supabase de servidor adaptado con `getAll()` / `setAll()`.
+  - Layout `app/(dashboard)/layout.tsx` transformado en Server Component que alimenta `<UserProvider>` y `<DashboardShell>`, erradicando bloqueos infinitos de `"Autenticando sesión..."` al recargar el navegador.
+  - Ruta raíz `/` (`app/page.tsx`) dinámica con redirección inteligente según sesión activa y rol.
+- **Desacoplamiento de Estado de Servicio y Repuestos (ESPECIFICACION_REFACTORIZACION_REPUESTOS_SERVICIO.md — 100% Implementado y Funcional)**:
+  - **Migración 019**: columnas `parts_status` (`SIN_REPUESTOS`, `PARCIAL`, `COMPLETO`), `approved_parts` (JSONB) y `parts_deliveries` (JSONB).
+  - Vista `equipment_with_status` actualizada con las nuevas columnas.
+  - Transiciones de workflow liberadas: `Aprobado` ➔ `En mantenimiento` ➔ `Listo para entrega` sin bloqueo por entrega de piezas físicas.
+  - Endpoint `/api/equipment/[id]/deliver-parts` para registro de entregas totales o parciales por Almacén/Logística con auditoría en `status_history` y envío de correo en hilo `sendEntregaLogistica`.
+  - Sub-modal interactivo `ModalEntregaRepuestos.tsx` y botón dedicado en `EquipmentDetail.tsx` con badges duales (servicio y material).
+  - Tarjetas `PizarraCard.tsx` y tabla `EquipmentTable.tsx` con indicadores visuales de repuestos (`📦 Parcial`, `📦 Listo`, etc.).
 - Workflow dinámico configurable por superadmin
- Pizarra realtime con agrupación por estados
- Sistema de prioridad VIP (3 niveles, estrellas ⭐⭐⭐, glow pulsante)
- CRUD completo de equipos con validación Zod
- `ClientSelector` y `BrandSelector` con auto-registro
- Catálogo de marcas/modelos/repuestos con compatibilidad
- DNA del equipo (historial por número de serie)
- Dashboard analítico con estadísticas por empresa
- Export/Import Excel
- Audit log inmutable (`status_history`) con captura automática del rol (`changed_by_role`) y comentarios/motivos opcionales (`notes`) para auditoría precisa de tiempos por rol
- Timestamps operativos por fase + edición superadmin
- Buscador instantáneo (FR, cliente, serie)
- **Rediseño UI/UX Apple Vision Pro & Cyber Glassmorphism (UI_UX_REDESIGN_PLAN.md - 100% Completado)**:
  - Sidebar interactivo en cápsula flotante centrada verticalmente con despliegue orgánico al cursor y ancho dinámico adaptable (w-max).
  - Navbar en cápsula flotante compacta desacoplada con chip de estado en tiempo real.
  - Tarjetas y paneles con vidrio translúcido real (backdrop-filter blur 28px saturate 200%) con opacidad calibrada para legibilidad perfecta.
  - Eliminación de fondos opacos rígidos en Pizarra, Equipos y Búsqueda.
  - Login interactivo con orbes flotantes animados de luz plasma, micro-malla cibernética, y toggle ver/ocultar contraseña con iconos Lucide.
  - Optimización de prefetch en navegación sin comprometer la seguridad ni las validaciones del servidor.
- **Identidad visual propia y autoría**:
  - Logo SVG propio (`CabelabLogo.tsx`) con icono de arco eléctrico y variante compacta
  - Autoría explícita de **Br. Gersson Ortiz** en login, navbar y metadata de aplicación
  - Favicon dinámico generado por código (`app/icon.tsx`)
  - Iconos Lucide profesionales en Sidebar (`Sidebar.tsx`) reemplazando emojis
  - Pie de Sidebar con Avatar, nombre y rol de usuario activo en tiempo real
- **Experiencia de Usuario (UX)**:
  - Títulos dinámicos de pestañas con formato `[Vista] | SYNAPSE` vía hook `usePageTitle.ts`
  - Componente reutilizable de estados vacíos `EmptyState.tsx` aplicado en tablas
  - Página 404 personalizada (`app/not-found.tsx`) con temática oscura y estética del sistema
- **Sistema de correos en hilo integrado con el workflow**:
  - Orquestación completa: validación Zod / permisos de rol ➔ actualización en BD ➔ disparo de trigger para `status_history` ➔ envío de correo de notificación en hilo vía Resend.
  - Eventos integrados: ingreso de equipo, informe técnico ODP (con PDF adjunto y enlace a Drive), aprobación de ventas (tabla de repuestos/servicios), entrega de repuestos por logística (con notas de repuestos compatibles) y servicio culminado (ODP).
  - Normalización RFC 2822: delimitación de `In-Reply-To` y `References` con `<...>` y formato `@dominio` para asegurar el agrupamiento de hilos en clientes SMTP.
  - Flujo simplificado: eliminación de CC en frontend y backend, envíos centralizados a `ENTRY_TO`.
  - Manejo de resiliencia: si el correo falla o la API Key no está configurada, **no se revierte el cambio de estado**, notificando una advertencia informativa (`toast.warning`) que permite al usuario reintentar sin inconsistencias.
- **Sistema de Ingreso Múltiple por Lote y Hilo Compartido — v2.5**:
  - Soporte en frontend (`EquipmentForm.tsx`) para registrar 1 o múltiples equipos de un mismo cliente en una sola operación sin saturación visual.
  - Bloque común de cliente y tipo de servicio general con tarjetas modulares dinámicas, botón de agregar otro equipo, duplicación de datos y detalles colapsables.
  - Generación de un único correo de ingreso con tabla consolidada de todos los equipos y asunto con el listado de FRs.
  - Persistencia de `batch_id` y `email_thread_subject` en base de datos (`018_batch_equipment_and_thread_subject.sql`).
  - Todos los equipos del lote comparten el mismo `email_thread_id` y su asunto base original, garantizando que cambios posteriores de estado (diagnóstico ODP con PDF, aprobación, repuestos, culminado) sigan respondiendo en el mismo hilo en Gmail/Outlook.
- **Sistema de Códigos QR y Documentación Técnica Pública — v2.5**:
  - Librería `qrcode.react` instalada y configurada
  - Modal `QRPrintModal` para generar e imprimir etiquetas físicas con datos del equipo
  - Encabezado de etiqueta con logo `cabelab_negro.png` en tamaño horizontal real (160×36px)
  - Logo CABELAB embebido en el centro del QR (con excavación, nivel de corrección H)
  - QR ampliado a 170px para mejor legibilidad en planta
  - **QR universal**: todos los equipos tienen botón QR, sin excepción
  - Equipos **con serie válida** → QR apunta a `/doc/[serial]` (historial completo)
  - Equipos **sin serie** (o N/S, S/N, N/A, etc.) → QR apunta a `/doc/fr/[fr]` (ficha de ese ingreso)
  - Página pública `/doc/[serial]` sin login — historial completo de intervenciones
  - Página pública `/doc/fr/[fr]` sin login — datos del ingreso único con aviso explicativo
  - API pública `/api/public/equipment/serial/[serial]` para consulta por serie
  - API pública `/api/public/equipment/fr/[fr]` para consulta por FR number
  - Soporte de campo `report_url` (enlace Google Drive) visible en ambas páginas públicas
- **Módulo de Auditoría y Pronóstico Predictivo por Modelo — v2.5**:
  - Motor de pronóstico en `lib/stats/model-forecast.ts` con cálculo de percentiles (p20, p80, medianas), días hábiles vs calendario y clasificador NLP de motivos de retraso en notas por rol
  - Endpoints REST de analítica: `GET /api/stats/models` y `GET /api/stats/models/[model]` con soporte de filtros por marca y tipo de servicio
  - Componentes modulares en `components/auditoria/`: `ModelSelectorHeader`, `ModelKpiCards`, `StageGanttTimeline`, `DeliveryForecastCalculator` y `DelayFactorsAudit`
  - Vista integrada interactiva `/auditoria-modelos` accesible desde el Sidebar para roles autorizados
  - Migración `017_audit_forecast_indexes.sql` para indexación de consultas de alto volumen

### 📋 Roadmap pendiente

| Prioridad | Feature | Descripción |
|---|---|---|
| 🔜 Alta | **Generación de PDF del sistema** | Informe técnico generado automáticamente por el sistema con membrete CABELAB. Usar `@react-pdf/renderer`. Endpoint `GET /api/equipment/[id]/pdf`. Botón en `EquipmentDetail.tsx` para roles superadmin/admin/recepcion |
| 🟡 Media | **Carga multimedia** | Subir fotos/videos del estado físico al ingresar (Supabase Storage) |
| 🟡 Media | **Inventario vinculado** | Descuento automático de stock de repuestos al finalizar servicio |
| 🟠 Baja | **Portal de cliente** | Vista restringida de solo lectura por empresa (nueva ruta pública) |
| 🟠 Baja | **API pública de seguimiento** | Endpoint público para que clientes consulten estado por FR |
| 🟠 Baja | **Roles granulares** | Permisos específicos para Finanzas, Almacén con más control |

---

## 13. MIGRACIONES SQL (orden cronológico)

| # | Archivo | Qué hace |
|---|---|---|
| 001 | `001_user_profiles.sql` | Tabla `user_profiles`, enum `user_role_enum` |
| 002 | `002_workflow.sql` | Tablas `workflow_states`, `workflow_transitions` |
| 003 | `003_equipment_records.sql` | Tabla `equipment_records`, enum `service_type_enum` |
| 004 | `004_status_history.sql` | Tabla `status_history` (audit log) |
| 005 | `005_rls_policies.sql` | Políticas RLS para todas las tablas |
| 006 | `006_seed_workflow.sql` | Datos iniciales de estados y transiciones |
| 007 | `007_technicians.sql` | Tabla `technicians` |
| 008 | `008_phase_tracking.sql` | Columnas de timestamps por fase en `equipment_records` |
| 009 | `009_priority_and_sorting.sql` | Columna `is_priority` (booleano legacy) |
| 010 | `010_parts_and_compatibility.sql` | Tablas de catálogo: `catalog_brands`, `catalog_models`, `parts_catalog`, `part_compatibilities` |
| 011 | `011_vip_priorities.sql` | Columna `priority_level` (0-3), recrea vista `equipment_with_status` |
| 012 | `012_seed_major_brands.sql` | Seed de marcas principales (ESAB, MILLER, LINCOLN, etc.) |
| 013 | `013_email_thread.sql` | Columnas `email_thread_id TEXT` y `email_cc TEXT[]` en `equipment_records` |
| 014 | `014_user_full_name.sql` | Columna `full_name TEXT` en `user_profiles` y actualización de trigger `handle_new_user` |
| 015 | `015_equipment_report_url.sql` | Columna `report_url TEXT` en `equipment_records` y recrea vista `equipment_with_status` |
| 016 | `016_status_history_role_and_comments.sql` | Columnas `changed_by_role` y `notes` en `status_history`, actualiza trigger para auditoría de roles y comentarios opcionales |
| 017 | `017_audit_forecast_indexes.sql` | Índices en `equipment_records(model)`, `equipment_records(brand, model)` y `status_history(equipment_id, timestamp)` para optimización de auditoría y pronóstico |
| 018 | `018_batch_equipment_and_thread_subject.sql` | Columnas `batch_id UUID` y `email_thread_subject TEXT` para soporte de ingreso múltiple y asunto de hilo exacto en replies |
| 019 | `019_service_and_parts_status_separation.sql` | Desacoplamiento de Servicio de Taller vs Repuestos: columnas `parts_status`, `approved_parts`, `parts_deliveries`, recrea vista `equipment_with_status` y transiciones directas |
| 020 | `020_non_business_days.sql` | Tabla `non_business_days` con RLS para gestión de feriados y días no hábiles considerados en la calculadora predictiva |

---

## 14. PLAN DE MEJORAS — CABELAB v2.5

> Última actualización: 20/09/2026. Ordenado por prioridad e impacto.

### 🎨 A. Identidad Visual

| # | Mejora | Archivo(s) afectado(s) | Estado |
|---|---|---|---|
| A1 | **Logo SVG propio** — Reemplazado cuadro `CL` por `<CabelabLogo />` con arco eléctrico en neon-blue | `components/ui/CabelabLogo.tsx`, `app/(auth)/login/page.tsx`, `components/layout/Navbar.tsx` | ✅ Completado |
| A2 | **Íconos Lucide en Sidebar** — Emojis unicode reemplazados por íconos de `lucide-react` tipados con `LucideIcon` | `components/layout/Sidebar.tsx` | ✅ Completado |
| A3 | **Favicon personalizado** — Generado dinámicamente con `app/icon.tsx` (`next/og` ImageResponse) | `app/icon.tsx` | ✅ Completado |

### 🏗️ B. UX / Experiencia de Usuario

| # | Mejora | Archivo(s) afectado(s) | Estado |
|---|---|---|---|
| B1 | **Avatar de usuario en Sidebar** — Reemplazado widget de zona horaria por avatar, nombre y rol del usuario logueado | `components/layout/Sidebar.tsx` | ✅ Completado |
| B2 | **Metadata y títulos dinámicos** — Template `%s \| CABELAB` y hook `usePageTitle.ts` para títulos dinámicos en cada vista | `app/layout.tsx`, `hooks/usePageTitle.ts`, todas las vistas | ✅ Completado |
| B3 | **Empty states visuales** — Componente reutilizable `EmptyState.tsx` con icono, título, descripción y acción | `components/ui/EmptyState.tsx`, `components/equipment/EquipmentTable.tsx` | ✅ Completado |
| B4 | **Página 404 personalizada** — `app/not-found.tsx` estilizada con estética oscura, neon-blue y links de retorno | `app/not-found.tsx` | ✅ Completado |
| B5 | **Identidad y autoría en login** — Autoría **Br. Gersson Ortiz**, versión `v2.4` y subtítulo de Arequipa, Perú | `app/(auth)/login/page.tsx`, `components/layout/Navbar.tsx` | ✅ Completado |

### ⚡ C. Mejoras Técnicas

| # | Mejora | Archivo(s) afectado(s) | Esfuerzo |
|---|---|---|---|
| C1 | **Activar sistema de correos** — El código está 100% listo. Solo requiere: (1) ejecutar migración 013 y 015 en Supabase, (2) agregar `RESEND_API_KEY` al `.env.local`. Sin escribir código. | `.env.local`, Supabase SQL Editor | 20 min |
| C2 | **Variables de entorno tipadas con Zod** — Completar `lib/env.ts` (actualmente vacío) con un schema Zod que valide todas las env vars al iniciar el servidor. Previene errores silenciosos en producción. | `lib/env.ts` | 30 min |
| C3 | **Error Boundary global** — Agregar `app/(dashboard)/error.tsx` para capturar errores de componentes cliente y mostrar un fallback con estilo del sistema + botón de reintento | `app/(dashboard)/error.tsx` | 1 h |
| C4 | **Rate limiting en API pública** — La ruta `/api/public/equipment/serial/[serial]` no tiene autenticación ni rate limit. Implementar con `@upstash/ratelimit` para evitar scraping. | `app/api/public/equipment/serial/[serial]/route.ts` | 2 h |

### 📊 D. Funcionalidades Nuevas

| # | Mejora | Descripción | Esfuerzo |
|---|---|---|---|
| D1 | **Widget "Actividad reciente"** | Mostrar los últimos 5-10 cambios de `status_history` del día en el Dashboard. La tabla ya existe, solo falta el componente. | 2 h |
| D2 | **Notificaciones in-app** | Ícono de campana en el Navbar con badge numérico de equipos atrasados (+5 días) o pendientes de acción para el rol actual. Query a `equipment_with_status WHERE days_elapsed > 5`. | 3 h |
| D3 | **Generación de PDF del sistema** | Informe técnico generado automáticamente con membrete CABELAB usando `@react-pdf/renderer`. Endpoint `GET /api/equipment/[id]/pdf`. Botón en `EquipmentDetail.tsx`. — *ya en roadmap sección 12* | 1-2 días |
| D4 | **Página 404 de rutas privadas** | Si un usuario intenta acceder a `/equipos/id-inexistente`, mostrar un 404 dentro del layout del dashboard (con sidebar) en lugar del 404 global | `app/(dashboard)/[...not-found]/page.tsx` | 1 h |

### 🎯 Orden de implementación sugerido

```
Sprint 1 (impacto visual inmediato, < 2h total):
  A2 → Íconos Lucide en Sidebar
  B4 → Página 404 personalizada
  B1 → Avatar de usuario en Sidebar
  B5 → Mensaje identidad en login

Sprint 2 (calidad técnica, < 2h total):
  C1 → Activar correos (0 código)
  C2 → Variables de entorno tipadas
  B2 → Metadata dinámica por página

Sprint 3 (funcionalidades nuevas, estimado 1-2 días):
  A1 → Logo SVG propio
  C3 → Error Boundary global
  D1 → Widget actividad reciente

Sprint 4 (largo plazo):
  D3 → Generación de PDF del sistema
  D2 → Notificaciones in-app
  C4 → Rate limiting API pública
```

---

## 15. SISTEMA DE CÓDIGOS QR — INSTRUCTIVO COMPLETO

> Última actualización: 24/09/2026. Guía para modificar cualquier aspecto del sistema QR, tanto en la plataforma como en la impresión física de etiquetas.

### 15.1 Mapa de archivos del sistema QR

```
Sistema QR CABELAB
│
├── ETIQUETA IMPRIMIBLE (modal en plataforma)
│   └── components/equipment/QRPrintModal.tsx
│       ├── Lógica de URL del QR (con serie / sin serie)
│       ├── Previsualización en pantalla (JSX)
│       └── HTML del iframe de impresión (string dentro de handlePrint)
│
├── BOTÓN QR EN TABLA DE EQUIPOS
│   └── components/equipment/EquipmentTable.tsx (línea ~147)
│
├── BOTÓN QR EN FICHA DETALLADA
│   └── components/equipment/EquipmentDetail.tsx (línea ~230)
│
├── PÁGINAS PÚBLICAS (destino del QR al escanearlo)
│   ├── app/doc/[serial]/page.tsx       → Historial completo por número de serie
│   └── app/doc/fr/[fr]/page.tsx        → Ficha de ingreso único por FR number
│
├── APIs PÚBLICAS (datos que consumen las páginas)
│   ├── app/api/public/equipment/serial/[serial]/route.ts  → Busca por serie
│   └── app/api/public/equipment/fr/[fr]/route.ts          → Busca por FR
│
├── AUTENTICACIÓN / ACCESO
│   └── middleware.ts (línea 18)
│       → if (pathname.startsWith('/doc') || pathname.startsWith('/api/public'))
│       → Estas rutas son públicas. No requieren sesión. NO MODIFICAR sin revisar implicaciones.
│
└── ASSETS (imágenes en /public/)
    ├── cabelab_negro.png   → Logo negro con fondo transparente. Usado en etiqueta impresa y QR embebido.
    └── cabelab.png         → Logo blanco. Usado en páginas públicas (fondo oscuro).
```

---

### 15.2 Cómo funciona la URL del QR

La lógica de decisión de URL está centralizada en `QRPrintModal.tsx`:

```typescript
// Valores de serie que se consideran "sin serie"
const GENERIC_SERIALS = ['N/S', 'S/N', 'N/A', 'SIN SERIE', 'SIN N/S', '-', '.']

const hasValidSerial =
  Boolean(serialNumber?.trim()) &&
  !GENERIC_SERIALS.includes(serialNumber.trim().toUpperCase())

// Resultado:
const qrUrl = hasValidSerial
  ? `${origin}/doc/${encodeURIComponent(serialNumber.trim())}`   // historial completo
  : `${origin}/doc/fr/${encodeURIComponent(frNumber.trim())}`    // solo este ingreso
```

**Para agregar más valores a la lista negra de series:** editar el array `GENERIC_SERIALS` en `QRPrintModal.tsx`.

---

### 15.3 Modificar la etiqueta impresa (tamaño, diseño, datos)

**Archivo:** `components/equipment/QRPrintModal.tsx`

El archivo tiene **dos secciones de diseño independientes** que deben mantenerse sincronizadas:

#### A) Previsualización en pantalla (JSX — línea ~250)
Es el JSX dentro de `<div ref={printAreaRef}>`. Lo que renderiza Next.js con clases Tailwind.
- **Cambiar logo:** modificar `src`, `width`, `height` del `<Image>` dentro del header.
- **Cambiar tamaño del QR en pantalla:** modificar el prop `size` del `<QRCodeSVG>`.
- **Logo embebido en el QR:** modificar el objeto `imageSettings` del `<QRCodeSVG>`:
  ```tsx
  imageSettings={{
    src: '/cabelab_negro.png',  // ruta en /public/
    width: 36,                   // ancho en px dentro del QR
    height: 36,                  // alto en px dentro del QR
    excavate: true,              // excava módulos para no tapar el QR
  }}
  ```
  > ⚠️ El nivel de corrección `level="H"` es obligatorio para usar logo embebido. No bajarlo a "M" o "L".
- **Añadir/quitar campos de datos:** editar el bloque `.info-box` dentro del JSX.

#### B) HTML del iframe de impresión (string dentro de `handlePrint` — línea ~67)
Es el `doc.write(...)` que genera el documento que va a la impresora. Usa CSS inline, no Tailwind.
- **Cambiar logo impreso:** modificar `src` del `<img class="logo-img">`.
- **Cambiar tamaño del logo impreso:** modificar `.logo-img { width: ...; height: ...; }` en el CSS interno.
- **Cambiar tamaño de la tarjeta impresa:** modificar `.label-card { width: ...; }`.
- **Cambiar el QR en impresión:** el QR se inyecta como SVG inline:
  ```javascript
  ${printAreaRef.current.querySelector('.qr-box-inner')?.innerHTML || ''}
  ```
  El QR impreso hereda el tamaño del QR en pantalla (el del prop `size` de `<QRCodeSVG>`). Para cambiarlo, modificar el `size` en la sección A.

---

### 15.4 Modificar las páginas públicas (destino del QR)

#### Página para equipos CON número de serie
**Archivo:** `app/doc/[serial]/page.tsx`

| Sección | Qué modifica |
|---|---|
| Interface `MachineData` | Campos que se esperan de la API |
| `useEffect` / `fetchDoc` | Llama a `/api/public/equipment/serial/${serial}` |
| Tarjeta de identidad (JSX ~línea 170) | Datos del equipo: marca, modelo, serie, cliente |
| Sección de informe (JSX ~línea 231) | Bloque con botón PDF |
| Historial de intervenciones (JSX ~línea 277) | Lista de todos los servicios anteriores |
| Header y Footer | Logo, nombre, badge "Trazabilidad Verificada" |

#### Página para equipos SIN número de serie
**Archivo:** `app/doc/fr/[fr]/page.tsx`

| Sección | Qué modifica |
|---|---|
| Interface `EntryData` | Campos que se esperan de la API |
| `useEffect` / `fetchDoc` | Llama a `/api/public/equipment/fr/${fr}` |
| Aviso amarillo | Texto explicativo de que el QR identifica solo ese ingreso |
| Tarjeta de identidad (JSX) | Datos: FR, marca, modelo, cliente, estado actual |
| Sección de informe (JSX) | Botón PDF si existe `report_url` |

---

### 15.5 Modificar las APIs públicas (datos devueltos)

#### API por número de serie
**Archivo:** `app/api/public/equipment/serial/[serial]/route.ts`

- Modifica los campos del `SELECT` de Supabase para añadir/quitar datos.
- La lista `genericValues` define qué series se consideran inválidas → devuelve `found: false`.
- Devuelve `machineInfo` (resumen del equipo) + `interventions[]` (historial).

#### API por FR number
**Archivo:** `app/api/public/equipment/fr/[fr]/route.ts`

- Busca con `.ilike('fr_number', cleanFr)` → búsqueda case-insensitive.
- Devuelve `entry` (objeto con todos los datos del ingreso) o `found: false`.
- Modifica el `SELECT` para añadir más campos si la página pública los necesita.

---

### 15.6 Agregar el botón QR en otros lugares

El botón QR puede colocarse en cualquier componente que tenga acceso al objeto `equipment` (de tipo `EquipmentWithStatus`). Patrón estándar:

```tsx
// 1. Importar el modal
import QRPrintModal from '@/components/equipment/QRPrintModal'

// 2. State para controlar apertura
const [isQrOpen, setIsQrOpen] = useState(false)

// 3. Botón
<button onClick={() => setIsQrOpen(true)}>
  Etiqueta QR
</button>

// 4. Modal (fuera del return principal, al final del JSX)
<QRPrintModal
  isOpen={isQrOpen}
  onClose={() => setIsQrOpen(false)}
  serialNumber={equipment.serial_number || ''}
  frNumber={equipment.fr_number || ''}
  brand={equipment.brand || ''}
  model={equipment.model || ''}
  clientName={equipment.client_name || ''}
/>
```

> El modal maneja internamente la lógica de URL (serie vs FR). No hay que pasar la URL manualmente.

---

### 15.7 Configuración del proxy para rutas públicas

**Archivo:** `proxy.ts` — línea 19:

```typescript
if (pathname.startsWith('/doc') || pathname.startsWith('/api/public')) {
  return supabaseResponse  // ← pasa sin verificar sesión
}
```

Si se crean nuevas rutas públicas relacionadas al QR (ej. `/doc/id/[id]`), deben seguir el patrón `/doc/...` para ser automáticamente permitidas. Las nuevas APIs públicas deben estar bajo `/api/public/...`.

---

### 15.8 Assets de imagen usados en el QR

| Archivo | Uso | Fondo | Cuándo usar |
|---|---|---|---|
| `public/cabelab_negro.png` | Etiqueta impresa, logo embebido en QR | Transparente (negro) | Sobre fondos **blancos** (etiqueta impresa) |
| `public/cabelab.png` | Header y footer de páginas públicas | Transparente (blanco) | Sobre fondos **oscuros** (UI del sistema) |

> ⚠️ No intercambiar los logos. `cabelab.png` (blanco) es invisible en la etiqueta impresa. `cabelab_negro.png` (negro) es invisible en la UI oscura del sistema.

---

## 16. SISTEMA DE DESACOPLAMIENTO DE SERVICIO Y REPUESTOS (ESPECIFICACIÓN IMPLEMENTADA)

> Estado: **100% Implementado y funcional** (Migración 019).  
> Reemplaza y consolida `ESPECIFICACION_REFACTORIZACION_REPUESTOS_SERVICIO.md`.

### 16.1 Principio fundamental y reglas de negocio
Anteriormente, el flujo trataba `En espera de repuesto` como un estado del workflow general, generando bloqueos mutuos entre Operaciones (taller físico) y Logística (almacén). Con la arquitectura actual existen **dos líneas de control totalmente independientes**:

1. **Estado del Servicio (Taller Operativo)**:
   - Controla exclusivamente el ciclo de trabajo físico:
     `Pendiente de aprobación` ➔ `Aprobado` ➔ `En mantenimiento` ➔ `Control de calidad` ➔ `Listo para entrega` ➔ `Entregado`.
   - Operaciones puede iniciar el mantenimiento y avanzar el servicio técnico sin que la falta de entrega física de repuestos congele el sistema.

2. **Estado de Repuestos (Logística / Almacén)**:
   - Controla la entrega de componentes aprobados por Ventas:
     - `SIN_REPUESTOS`: No se ha entregado ninguna pieza aprobada.
     - `PARCIAL`: Se ha entregado al menos un repuesto o fracción de la cantidad requerida.
     - `COMPLETO`: El 100% de los repuestos aprobados ha sido entregado a taller.
   - **Regla estricta:** Registrar entregas no altera el estado del servicio, y el avance del servicio no impide que Logística registre entregas en cualquier momento.

### 16.2 Estructura de datos en `equipment_records`
- `parts_status`: `TEXT` (`'SIN_REPUESTOS'`, `'PARCIAL'`, `'COMPLETO'`).
- `approved_parts`: `JSONB` — lista estructurada de repuestos aprobados:
  ```json
  [
    {
      "id": "part-1",
      "descripcion": "Carbones de repuesto",
      "cantidad_solicitada": 2,
      "cantidad_entregada": 1,
      "precio": "150.00"
    }
  ]
  ```
- `parts_deliveries`: `JSONB` — registro inmutable de cada entrega realizada:
  ```json
  [
    {
      "id": "del-123",
      "fecha": "2026-10-07T15:30:00Z",
      "entregado_por": "almacen_user",
      "items": [{ "descripcion": "Carbones de repuesto", "cantidad": 1, "nota": "Entrega parcial" }],
      "observaciones": "Llega el saldo mañana"
    }
  ]
  ```

### 16.3 Endpoints y componentes vinculados
- `POST /api/equipment/[id]/update-status`: Inicializa `approved_parts` y `parts_status = 'SIN_REPUESTOS'` tanto cuando pasa a `Aprobado` (por Ventas con precios) como cuando pasa a `En espera de repuesto` desde diagnóstico (por Taller/Operaciones con componentes requeridos y envío del correo en hilo `sendSolicitudRepuestos`).
- `POST /api/equipment/[id]/deliver-parts`: Procesa entregas parciales/totales de ítems solicitados o adicionales, actualiza cantidades entregadas, recalcula `parts_status`, genera entrada en `status_history` y envía correo `sendEntregaLogistica` en el hilo sin interferir con el avance operativo del taller.
- `components/equipment/modals/ModalEntregaRepuestos.tsx`: Modal interactivo dedicado para Logística/Almacén con listado de piezas solicitadas con casillas de verificación (checkboxes), cantidades editables a entregar y sección dinámica de ítems adicionales para piezas no previstas originalmente.
- `components/equipment/EquipmentDetail.tsx`: Badges duales en cabecera + tabla comparativa "Control de Repuestos" y botón "Registrar Entrega de Repuestos" para roles autorizados (`almacen`, `admin`, `superadmin`).
- `components/equipment/EquipmentTable.tsx`: Indicadores visuales de repuestos (`📦 Sin repuestos`, `📦 Parcial`, `📦 Listo`) y botón directo de acción "Repuestos" para Logística/Almacén sin necesidad de abrir primero la ficha detallada.
- `components/pizarra/PizarraCard.tsx`: Chips compactos de estado de repuestos en tiempo real (`📦 Sin rep.`, `📦 Parcial`, `📦 Listo`).

---

## 17. MÓDULO DE AUDITORÍA Y PRONÓSTICO PREDICTIVO POR MODELO (ESPECIFICACIÓN IMPLEMENTADA)

> Estado: **100% Implementado y funcional** (Migración 017).  
> Reemplaza y consolida `ESPECIFICACION_AUDITORIA_PRONOSTICO_MODELOS.md`.

### 17.1 Objetivo y alcance
Convierte el histórico de intervenciones y notas en un motor predictivo que permite a Taller, Recepción y Administración:
1. Conocer de antemano el tiempo proyectado por etapa (diagnóstico, cotización/aprobación, espera de piezas, mantenimiento y entrega) según la marca y modelo.
2. Identificar cuellos de botella y factores reales de retraso a través de minería de texto (NLP) sobre el campo `notes` de `status_history`.

### 17.2 Motor estadístico (`lib/stats/model-forecast.ts`)
- **Métricas robustas:** Medianas y percentiles (p20 optimista, p80 pesimista) para amortiguar valores atípicos.
- **Nivel de confianza estadístico:** Basado en el tamaño de la muestra (`ALTA` ≥ 15 equipos, `MEDIA` 5-14, `BAJA` < 5).
- **Cálculo de Lead Time:**
  $$\text{Fecha}_{\text{culm}} = \text{Fecha}_{\text{ingreso}} + \text{Mediana}(\text{diagnóstico}) + \text{Mediana}(\text{aprobación}) + \text{RiesgoRepuestos} + \text{Mediana}(\text{mantenimiento})$$
- **Clasificador NLP de retrasos por palabras clave:**
  - *Logística/Repuestos:* `STOCK`, `PROVEEDOR`, `LIMA`, `IMPORTACION`, `REPUESTO`, `TARJETA`, `IGBT`, `MODULO`, `PEDIDO`.
  - *Técnica/Falla Compleja:* `SULFATADO`, `QUEMADO`, `CORTO`, `REBOBINADO`, `MINA`, `POLVO`, `INTERMITENTE`, `HUMEDAD`.
  - *Cliente/Aprobación:* `CLIENTE`, `COTIZACION`, `APROBACION`, `COSTO`, `PRESUPUESTO`, `SIN RESPUESTA`.
  - *Control de Calidad:* `PRUEBA`, `SOLDADURA`, `VOLTAJE`, `AMPERAJE`, `FALLA EN CARGA`, `CALIDAD`.
  - Cruza el término detectado con `changed_by_role` para atribuir la causa raíz al área correspondiente.

### 17.3 Endpoints y UI
- `GET /api/stats/models`: Listado con métricas agregadas por modelo (`sample_size`, `avg_total_days`, `delayed_rate`).
- `GET /api/stats/models/[model]`: Análisis profundo por modelo con percentiles por fase y lista de factores de retraso.
- **Vista `/auditoria-modelos` (`app/(dashboard)/auditoria-modelos/page.tsx`)**:
  - `ModelSelectorHeader.tsx`: Selección Marca ➔ Modelo con badge de nivel de confianza.
  - `ModelKpiCards.tsx`: Métricas clave y porcentaje de retraso (> 5 días).
  - `StageGanttTimeline.tsx`: Barra Gantt segmentada con tiempos típicos por etapa.
  - `DeliveryForecastCalculator.tsx`: Calculadora interactiva que proyecta fechas de hito según fecha de ingreso.
  - `DelayFactorsAudit.tsx`: Análisis de causas frecuentes por rol.


---

## 18. SISTEMA VISUAL: CYBER GLASSMORPHISM & APPLE VISION PRO (ESPECIFICACIÓN CONSOLIDADA)

> Estado: **100% Implementado y Funcional** (Consolida y reemplaza a `UI_UX_REDESIGN_PLAN.md`).  
> Arquitectura estética: Premium Dark Cyber Glassmorphism con ergonomía flotante estilo Apple VisionOS y atmósfera de arco de soldadura eléctrica.

### 18.1 Filosofía de Diseño y Principios Fundamentales
1. **Lógica e integridad intocables:** El rediseño opera exclusivamente sobre capas visuales y de presentación (CSS / Tailwind / JSX). Los endpoints REST, esquemas de BD, transiciones del WorkflowEngine, RLS y permisos por rol se mantuvieron 100% intactos.
2. **Cero dependencias pesadas innecesarias:** No se instalaron librerías invasivas como framer-motion o animadores externos. Toda la reactividad y fluidez se construyó con Tailwind CSS nativo, variables de capa `@layer components` y aceleración por GPU.
3. **Legibilidad y Contraste WCAG AA:** Para evitar el defecto clásico del glassmorphism (fondos transparentes ilegibles), se calibraron fondos opacos con alto índice de refracción (`rgba(12, 17, 32, 0.78)` a `0.88`), desenfoque `blur(28px)` y saturación `saturate(190%-220%)`.

### 18.2 Tokens de Diseño y Paleta Cyber Glass (`tailwind.config.ts` & `globals.css`)
- **Fondos Raíz:** `bg-forge` (`#050811`), `bg-forge-mid` (`#090D1A`), `bg-forge-high` (`#0E1424`).
- **Acentos Plasma / Cyber Cyan:** `amber-core` (`#00D2FF`), `amber-glow` (`#38BDF8`), `amber-deep` (`#0284C7`), `amber-ghost` (`rgba(0, 210, 255, 0.08)`).
- **Acentos Eléctricos de Profundidad:** `forge-orange` (`#6366F1` cobalto índigo), `forge-bright` (`#818CF8`).
- **Superficies Glass Reutilizables:**
  - `.glass-card`: Tarjeta de vidrio con borde especular superior (`border-t: rgba(255,255,255,0.18)`) y sombra de profundidad.
  - `.vision-sidebar-capsule`: Cápsula de navegación flotante con esquinas curvas (`rounded-3xl`), sombra envolvente y filtro óptico.
  - `.vision-item-bubble`: Burbujas individuales para cada ítem de navegación con micro-elevación interactiva (`scale(1.02)`).
  - `.linux-grid-bg`: Micro-retícula cibernética técnica de fondo.
  - `animate-float-1`, `animate-float-2`, `animate-float-3`: Orbes de luz líquida orgánica respirando en bucle continuo.

### 18.3 Componentes Clave Rediseñados
1. **Sidebar Flotante Apple Vision Pro (`components/layout/Sidebar.tsx`):**
   - Centrado verticalmente (`my-auto`, `max-h-[88vh]`), desvinculado de bordes rígidos.
   - Estado reposo compacto (`76px`) que solo expone íconos en cápsulas de vidrio.
   - Despliegue interactivo en hover (`onMouseEnter` / `onMouseLeave`) que expande horizontalmente los títulos de forma fluida (`w-max`) **desplazando el contenido de forma no invasiva** (`md:static`).
   - Prefetching nativo de Next.js (`prefetch={true}`) en los enlaces para transiciones instantáneas entre páginas.
2. **Navbar Cápsula Flotante (`components/layout/Navbar.tsx`):**
   - Separada del borde superior con márgenes de respiración (`px-4 pt-3 md:px-6 md:pt-4`).
   - Burbuja de estado en tiempo real para el usuario conectado (indicador esmeralda pulsante, nombre y rol) y botón de cierre de sesión integrado.
3. **Pantalla de Login Cibernética (`app/(auth)/login/page.tsx`):**
   - 3 orbes flotantes de alta visibilidad (Cian, Cobalto y Violeta) y micro-malla técnica.
   - Tarjeta central con animación de entrada (`animate-slide-in`), bisel luminoso superior y campos redondeados con iconos Lucide (`User`, `Lock`).
   - Botón interactivo para revelar/ocultar contraseña (`Eye` / `EyeOff`).
4. **Pizarra, Tablas y Formularios Glassmorphism:**
   - Eliminación total de fondos negros planos/sólidos (`bg-bg-surface`, `bg-bg-base`) en Pizarra, Equipos y Búsqueda, integrándolos en paneles de vidrio translúcido real con micro-bordes.

### 18.4 Registro de Decisiones de Arquitectura UI (ADR)
- **ADR-UI-01 (Estrategia de Adición de Tokens):** No se eliminaron los tokens de Tailwind existentes para asegurar retrocompatibilidad con los colores de badges de estado y roles de Supabase.
- **ADR-UI-02 (Cápsula Flotante y Desplazamiento):** El Sidebar no utiliza posicionamiento `fixed` invasivo en escritorio, sino que se ubica en el flujo natural del layout para empujar el contenido continuo sin tapar tablas ni formularios.
- **ADR-UI-03 (Seguridad en Prefetching):** La optimización de navegación instantánea se logró mediante `prefetch` en el cliente; las validaciones server-side de `proxy.ts` y `app/(dashboard)/layout.tsx` se preservaron intactas, garantizando máxima seguridad contra accesos no autorizados.
