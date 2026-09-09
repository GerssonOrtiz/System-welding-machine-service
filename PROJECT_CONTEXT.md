# PROJECT_CONTEXT.md — CABELAB v2.3
> Documento de contexto técnico optimizado para lectura por IA. Contiene arquitectura, estructura, flujos y convenciones. Leer antes de tocar cualquier archivo.

---

## 1. IDENTIDAD DEL PROYECTO

**CABELAB** es un sistema de gestión operativa para un taller de mantenimiento de motosoldadoras en Arequipa, Perú. Digitaliza el ciclo completo: ingreso → diagnóstico → cotización/aprobación → mantenimiento → entrega, con una **Pizarra Virtual** sincronizada en tiempo real como pieza central.

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
| Email | Resend | ^6.12.4 (pendiente config) |
| Export | xlsx | ^0.18.5 |
| UI Primitives | Radix UI (Dialog, Select, Dropdown) | — |

---

## 3. ARQUITECTURA GENERAL

```
Next.js App Router
├── app/                   → Páginas y API Routes (server-side por defecto)
│   ├── (auth)/            → Rutas públicas: /login, /register
│   ├── (dashboard)/       → Rutas protegidas con layout compartido
│   ├── admin/             → Páginas de administración (fuera del layout dashboard)
│   └── api/               → API Routes (REST, server-side)
├── components/            → Componentes React reutilizables (client-side)
├── lib/                   → Lógica de servidor: Supabase, workflow, validaciones, mail
├── hooks/                 → Custom hooks SWR (client-side data fetching)
├── types/                 → Tipos TypeScript derivados del esquema de BD
└── supabase/migrations/   → Historial SQL del esquema (001–012)
```

**Patrón de renderizado:** Server Components por defecto en `app/`. Directiva `'use client'` solo donde se necesita estado/interactividad. Las API Routes actúan como capa de acceso a Supabase desde el cliente.

---

## 4. ESTRUCTURA DETALLADA

### `/app/(auth)/`
- `login/page.tsx` — Formulario de login. Autenticación por nombre de usuario → email virtual `usuario@cabelab.local`.
- `register/page.tsx` — Auto-registro. El usuario queda `is_active = false` hasta aprobación del superadmin.

### `/app/(dashboard)/`
Layout en `layout.tsx` incluye `Sidebar` y `Navbar`. Rutas hijas:
| Ruta | Descripción | Roles con acceso |
|---|---|---|
| `/dashboard` | Métricas globales + tabla paginada de todos los equipos | superadmin, admin |
| `/pizarra` | Tablero kanban realtime con columnas por estado | todos |
| `/equipos` | CRUD de equipos con filtros y paginación | superadmin, admin, recepcion, almacen |
| `/taller` | Vista operativa para técnicos (equipos asignados) | operaciones |
| `/estadisticas` | Analytics: por empresa, marca, modelo, tiempos | superadmin, admin, visualizador |
| `/dna` | Historial clínico completo por número de serie | todos |
| `/buscar` | Buscador instantáneo por FR, cliente, serie | operaciones, recepcion, almacen |
| `/historial` | Log de cambios de estado (status_history) | admin |
| `/perfil` | Edición de perfil propio | todos |
| `/admin/usuarios` | Aprobar/bloquear usuarios, asignar roles | superadmin |
| `/admin/workflow` | Editor visual del flujo de estados/transiciones | superadmin |

### `/app/admin/`
- `catalog/page.tsx` — Gestión de catálogo (marcas, modelos, repuestos). Fuera del layout dashboard para diseño full-screen.

### `/app/api/`
Todas las API Routes usan `createServerClient()` de `lib/supabase/server.ts`.
| Endpoint | Método | Función |
|---|---|---|
| `/api/equipment` | GET | Listado paginado con filtros y permisos por rol |
| `/api/equipment` | POST | Crear equipo (valida con Zod, auto-registra marca) |
| `/api/equipment/[id]` | GET | Detalle + historial + next_states disponibles |
| `/api/equipment/[id]` | PATCH | Actualizar campos (superadmin puede editar timestamps) |
| `/api/equipment/[id]` | DELETE | Eliminar (solo superadmin/admin) |
| `/api/equipment/search` | GET | Búsqueda por FR, cliente, serie |
| `/api/equipment/serial/[serial]` | GET | DNA: historial completo por número de serie |
| `/api/equipment/export` | GET | Exportar a Excel (.xlsx) |
| `/api/equipment/import` | POST | Importar desde Excel |
| `/api/equipment/create` | POST | Alias de creación (legacy) |
| `/api/workflow/states` | GET/POST | CRUD de estados del workflow |
| `/api/workflow/transitions` | GET/POST | CRUD de transiciones del workflow |
| `/api/users/list` | GET | Lista de usuarios con email (solo superadmin) |
| `/api/users/[id]` | PATCH | Aprobar/bloquear/cambiar rol |
| `/api/users/technicians` | GET | Técnicos para asignación |
| `/api/clients` | GET | Nombres únicos de clientes (para ClientSelector) |
| `/api/catalog/brands` | GET/POST | CRUD de marcas del catálogo |
| `/api/catalog/models` | GET/POST | CRUD de modelos por marca |
| `/api/admin/technicians` | GET/POST/PATCH | Gestión de técnicos |
| `/api/stats` | GET | Métricas del dashboard (totales, atrasados, promedios) |

### `/components/`
| Componente | Responsabilidad |
|---|---|
| `layout/Sidebar.tsx` | Navegación lateral. Items visibles según `SIDEBAR_ITEMS_BY_ROLE` del tipo `user.ts` |
| `layout/Navbar.tsx` | Barra superior con usuario activo y logout |
| `equipment/EquipmentForm.tsx` | Formulario de creación/edición. Usa `ClientSelector`, `BrandSelector`, VIP selector |
| `equipment/EquipmentDetail.tsx` | Ficha completa del equipo. Historial, cambio de estado, edición de timestamps (superadmin) |
| `equipment/EquipmentTable.tsx` | Tabla paginada con indicadores VIP y filtros |
| `equipment/StatusChangeModal.tsx` | Modal para transicionar estado. Consulta `next_states` via API |
| `equipment/StatusBadge.tsx` | Badge de color dinámico según `status_color` de la vista |
| `equipment/ClientSelector.tsx` | Búsqueda predictiva de clientes existentes + registro de nuevos |
| `equipment/BrandSelector.tsx` | Búsqueda predictiva de marcas del catálogo. Auto-registra marcas nuevas |
| `equipment/ModelSelector.tsx` | Selector de modelos filtrado por marca seleccionada |
| `pizarra/PizarraBoard.tsx` | Tablero kanban realtime. Columnas = estados activos. Usa `useRealtimePizarra` |
| `pizarra/PizarraCard.tsx` | Tarjeta de equipo con estrellas VIP ⭐ y efecto glow pulsante según `priority_level` |
| `admin/BrandModelManager.tsx` | CRUD de marcas y modelos del catálogo |
| `admin/PartManager.tsx` | CRUD de repuestos con asignación de compatibilidad por modelo |
| `admin/TechnicianManager.tsx` | CRUD de técnicos del taller |
| `ui/ToasterProvider.tsx` | Wrapper de Sonner para notificaciones globales |

### `/lib/`
| Archivo | Responsabilidad |
|---|---|
| `supabase/client.ts` | Cliente Supabase para browser (`createBrowserClient`) |
| `supabase/server.ts` | Cliente Supabase para Server Components y API Routes (`createServerClient`) |
| `supabase/middleware.ts` | `updateSession()` — refresca cookies de sesión en cada request |
| `workflow/engine.ts` | `WorkflowEngine` — clase estática con métodos: `validateTransition`, `getNextStates`, `isTerminal`. Consulta la BD directamente |
| `validations/equipment.schema.ts` | Schema Zod para validar inputs de equipos |
| `validations/user.schema.ts` | Schema Zod para validar inputs de usuarios |
| `mail/mailer.ts` | Envío de emails con Resend. Falla silenciosamente si `RESEND_API_KEY` no está configurada |
| `env.ts` | Validación de variables de entorno al arrancar |
| `permissions.ts` | (vacío — lógica de permisos está en `types/user.ts`) |

### `/hooks/`
| Hook | Responsabilidad |
|---|---|
| `useRealtimePizarra.ts` | Suscripción a cambios en `equipment_records` vía WebSocket. Agrupa equipos por estado. Ordena por `priority_level` DESC, luego por `date_in` ASC |
| `useEquipmentList.ts` | SWR fetch paginado de `/api/equipment` + `/api/stats` para el dashboard |
| `useUser.ts` | SWR fetch del perfil del usuario autenticado actual |

### `/types/`
| Archivo | Contenido |
|---|---|
| `database.types.ts` | Tipos auto-generados del esquema de Supabase (fuente de verdad de tipos de BD) |
| `equipment.ts` | `EquipmentRecord`, `EquipmentWithStatus`, `WorkflowState`, helpers de negocio (`isEquipmentOverdue`, `ROLE_RELEVANT_STATES`) |
| `user.ts` | `UserProfile`, `UserRole`, helpers de permisos (`canCreateEquipment`, etc.), `SIDEBAR_ITEMS_BY_ROLE`, `ROLE_HOME_ROUTE` |
| `catalog.ts` | Tipos para `CatalogBrand`, `CatalogModel`, `Part` |

---

## 5. BASE DE DATOS — ESQUEMA

### Tablas principales
| Tabla | Descripción clave |
|---|---|
| `user_profiles` | `id` (FK auth.users), `username`, `role` (enum), `is_active`, `is_superadmin` |
| `equipment_records` | Tabla central. `fr_number` (ID operativo), `serial_number` (ID histórico/DNA), `current_status_id` (FK workflow_states), `priority_level` (0=normal, 1-3=VIP), timestamps por fase |
| `workflow_states` | `id`, `name`, `color`, `is_initial`, `is_terminal`, `order_index` |
| `workflow_transitions` | `from_state_id`, `to_state_id`, `allowed_roles[]` |
| `status_history` | Audit log inmutable. `equipment_id`, `new_status`, `previous_status`, `changed_by_username`, `is_override` |
| `technicians` | `id` (integer), `name`, `is_active` |
| `catalog_brands` | `id` (UUID), `name` UNIQUE |
| `catalog_models` | `id`, `brand_id` (FK), `name`. UNIQUE(brand_id, name) |
| `parts_catalog` | `part_number` UNIQUE, `name`, `specifications` |
| `part_compatibilities` | JOIN table parts ↔ models |

### Vista central: `equipment_with_status`
JOIN de `equipment_records` + `workflow_states`. Agrega:
- `status_name`, `status_color`, `is_terminal`
- `days_elapsed` — días desde `date_in`
- `phase_1_days` — ingreso → pending_approval
- `phase_2_days` — pending_approval → approval
- `phase_3_days` — approval → finalized
- `assigned_technicians[]` — nombres via subquery a `technicians`
- `priority_level` (desde migración 011)

### Flujo de estados (workflow por defecto)
```
En espera de diagnóstico
  → En diagnóstico
    → Pendiente de aprobación
      → Aprobado / Rechazado
        → En mantenimiento
          → En espera de repuesto → (vuelve a En diagnóstico o En mantenimiento)
            → En espera de repuesto adicional
          → Control de calidad
            → Listo para entrega
              → Entregado (terminal)
```
El superadmin puede editar estados y transiciones en caliente desde `/admin/workflow`.

---

## 6. AUTENTICACIÓN Y AUTORIZACIÓN

**Login:** Usuario ingresa su `username` → el sistema construye `username@cabelab.local` → Supabase Auth.

**Middleware (`middleware.ts`):**
1. Rutas públicas (`/login`, `/register`) → redirige al dashboard si ya tiene sesión.
2. Sin sesión → redirect a `/login`.
3. `is_active = false` → redirect a `/login?error=no-aprobado` + borra cookies.
4. Rutas de superadmin → verifica `is_superadmin = true`.

**RLS (Row Level Security):** Activo en todas las tablas. Políticas en migración `005_rls_policies.sql`.

**Roles y permisos** (definidos en `types/user.ts`):
| Rol | Acceso principal |
|---|---|
| `superadmin` | Todo + edición de timestamps, workflow, usuarios |
| `admin` | Dashboard, equipos, estadísticas, historial |
| `operaciones` | Taller (equipos asignados), pizarra, búsqueda, DNA |
| `recepcion` | Equipos (crear/ver), pizarra, búsqueda |
| `almacen` | Equipos (en espera repuesto), pizarra, búsqueda |
| `visualizador` | Solo lectura: pizarra, estadísticas, equipos, DNA |

---

## 7. FLUJO DE DATOS

```
Usuario → Componente (client) → fetch /api/... → API Route (server)
                                                      ↓
                                              createServerClient()
                                                      ↓
                                              Supabase PostgreSQL
                                              (con RLS activo)
                                                      ↓
                                              Respuesta JSON → SWR cache → Re-render

Realtime (Pizarra):
Supabase Realtime → useRealtimePizarra (WebSocket) → setState → Re-render PizarraBoard
```

**Mutación de estado después de una acción:**
1. API Route ejecuta UPDATE en Supabase.
2. Inserta registro en `status_history`.
3. Responde `{ success: true, data: ... }`.
4. Cliente llama `mutate()` de SWR para revalidar.
5. Pizarra se actualiza sola vía WebSocket sin intervención.

---

## 8. PATRONES DE DISEÑO

- **Server/Client split:** Server Components para fetching inicial, `'use client'` para interactividad. API Routes como capa de acceso a BD.
- **Repository pattern vía API Routes:** Toda la lógica de BD está en `/app/api/`, los componentes nunca tocan Supabase directamente.
- **Schema-first typing:** `database.types.ts` es la fuente de verdad. Los tipos de `types/` son derivaciones de este.
- **Workflow Engine dinámico:** `WorkflowEngine` (lib/workflow/engine.ts) consulta la BD en runtime, no hay estados hardcodeados en el código.
- **Zod validation en boundary:** Validación en la API Route, no en el componente. Los schemas están en `lib/validations/`.
- **SWR para cache + revalidación:** `mutate()` manual tras mutaciones. No se usa React Query ni Context global.
- **Audit Log obligatorio:** Todo cambio de estado escribe en `status_history` (inmutable).

---

## 9. CONVENCIONES DE CÓDIGO

- **Imports:** Alias `@/` apunta a la raíz del proyecto (configurado en `tsconfig.json`).
- **Supabase cliente:** Usar `createServerClient()` (de `lib/supabase/server.ts`) en API Routes/Server Components. Usar `createBrowserClient()` (de `lib/supabase/client.ts`) solo en hooks o componentes client-side.
- **Respuestas API:** Formato uniforme `{ success: boolean, data?: any, error?: string }`.
- **Estilos:** Solo Tailwind CSS. Tema personalizado en `tailwind.config.ts`. Colores clave: `neon-blue`, `neon-purple`, `bg-base`, `bg-surface`, `bg-elevated`, `text-primary`, `text-secondary`, `border-subtle`.
- **Fondos sólidos:** SIEMPRE usar `bg-bg-elevated` en dropdowns, modales, filtros y selectores. No usar transparencias (`bg-opacity`, `backdrop-blur`) en elementos interactivos.
- **Iconos:** Solo `lucide-react`. No instalar otras librerías de iconos.

---

## 10. VARIABLES DE ENTORNO REQUERIDAS

```env
NEXT_PUBLIC_SUPABASE_URL=...        # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Anon key pública
SUPABASE_SERVICE_ROLE_KEY=...       # Service role key (solo servidor, para admin ops)
RESEND_API_KEY=...                  # Opcional: para emails automáticos (Resend)
```

---

## 11. ESTADO ACTUAL Y PENDIENTES

> Última sesión: 09/09/2026

### ✅ Implementado y funcional
- Sistema de roles y autenticación por username completo
- Workflow dinámico configurable por superadmin
- Pizarra realtime con agrupación por estados
- Sistema de prioridad VIP (3 niveles, estrellas ⭐⭐⭐, glow pulsante)
- CRUD completo de equipos con validación Zod
- `ClientSelector` y `BrandSelector` con auto-registro
- Catálogo de marcas/modelos/repuestos con compatibilidad
- DNA del equipo (historial por número de serie)
- Dashboard analítico con estadísticas por empresa
- Export/Import Excel
- Audit log inmutable (`status_history`)
- Timestamps operativos por fase + edición superadmin
- Buscador instantáneo (FR, cliente, serie)
- **Sistema de notificaciones internas por email** — completo y funcional (pendiente solo `RESEND_API_KEY`)

---

### 📧 Sistema de Notificaciones por Email (COMPLETO)

**Archivos involucrados:**
- `lib/mail/mailer.ts` — lógica central
- `app/api/equipment/create/route.ts` — disparo en ingreso
- `app/api/equipment/[id]/update-status/route.ts` — disparo en cambio de estado normal
- `app/api/equipment/[id]/force-status/route.ts` — disparo condicional en override de superadmin
- `lib/validations/equipment.schema.ts` — campo `notify_by_email` en `forceStatusSchema`
- `components/equipment/StatusChangeModal.tsx` — checkbox UI para el override

**Puntos de disparo:**

| Evento | Archivo | Comportamiento |
|---|---|---|
| Equipo ingresado | `create/route.ts` | `mailer.sendEquipmentEntry()` — tabla horizontal oficial, siempre |
| Cambio de estado (workflow normal) | `update-status/route.ts` | `mailer.sendStatusChange()` — fire-and-forget, en **todo** cambio de estado |
| Cambio forzado (superadmin override) | `force-status/route.ts` | `mailer.sendStatusChange(isOverride=true)` — solo si superadmin marca el checkbox en el modal |

**Estructura de `mailer.ts`:**
- `RECIPIENTS[]` + `CC_RECIPIENTS[]` — arrays hardcodeados de destinatarios internos. Editar aquí para agregar/quitar.
- `STATE_CONFIGS` — objeto con config por estado: `subject`, `headerColor`, `icon`, `description`. Clave = nombre del estado en minúsculas. Agregar aquí para cubrir nuevos estados.
- `DEFAULT_STATE_CONFIG` — fallback genérico para estados sin config explícita.
- `sendEquipmentEntry(data)` — template tabla horizontal para ingresos.
- `sendStatusChange(data, isOverride?)` — template genérico para todos los cambios de estado. Incluye: banner de color, tabla con FR/Cliente/Equipo/Serie/Estado anterior/Nuevo estado/Usuario/Fecha. Si `isOverride=true`: banner amarillo de advertencia + fila de motivo.
- `buildSignature()` — firma institucional compartida (Diana Salazar + datos CABELAB).

**Checkbox en el modal de override (UI):**
- Estado local `notifyByEmail` en `StatusChangeModal.tsx`, desmarcado por defecto.
- Aparece debajo del textarea de motivo, solo cuando el modo override está activo.
- Se envía como `notify_by_email: boolean` en el body del POST a `force-status`.

**Para personalizar:**
- Cambiar asunto/color/ícono/descripción de un estado → editar su entrada en `STATE_CONFIGS`
- Agregar campo extra al cuerpo del correo → editar `buildStatusChangeHtml()` en `mailer.ts`
- Cambiar firma → editar `buildSignature()`
- Agregar destinatario → agregar email a `RECIPIENTS` o `CC_RECIPIENTS`

---

### ⚠️ Requiere configuración para activar emails
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```
Sin esta variable, todos los correos se omiten silenciosamente (el sistema sigue funcionando). Configurar en el panel de Vercel o en `.env.local` para desarrollo.

---

### 🔜 Próximo paso sugerido: Generación de PDF de Informe Técnico

**Por qué es el siguiente paso lógico:**
El sistema ya registra toda la información operativa del equipo (diagnóstico, técnico, timestamps, observaciones, número de informe). El PDF es la materialización de eso en un documento entregable al cliente y archivable para CABELAB.

**Qué implicaría:**
- Instalar una librería de generación de PDF. La opción recomendada para Next.js es `@react-pdf/renderer` (genera PDFs desde componentes React) o `puppeteer` (renderiza HTML a PDF). Para este proyecto se recomienda `@react-pdf/renderer` por ser más ligero y sin dependencias de Chromium.
- Crear un API Route `GET /api/equipment/[id]/pdf` que genere y devuelva el PDF como `application/pdf`.
- El PDF incluiría: membrete CABELAB, datos del equipo, diagnóstico, técnico asignado, timestamps de fases, observaciones y firma.
- En `EquipmentDetail.tsx` agregar un botón "Descargar PDF" visible para roles `superadmin`, `admin` y `recepcion`.

**Archivos a crear/modificar:**
- `app/api/equipment/[id]/pdf/route.ts` — nuevo endpoint
- `components/equipment/EquipmentPDF.tsx` — componente de diseño del PDF (con `@react-pdf/renderer`)
- `components/equipment/EquipmentDetail.tsx` — agregar botón de descarga

---

### 📋 Roadmap completo pendiente

| Prioridad | Feature | Descripción |
|---|---|---|
| 🔜 Alta | **Generación de PDF** | Informe técnico descargable con membrete CABELAB |
| 🔜 Alta | **Códigos QR** | Etiqueta imprimible por equipo que enlaza a su ficha |
| 🟡 Media | **Carga multimedia** | Subir fotos/videos del estado físico al ingresar (Supabase Storage) |
| 🟡 Media | **Inventario vinculado** | Descuento automático de stock de repuestos al finalizar servicio |
| 🟠 Baja | **Portal de cliente** | Vista restringida de solo lectura por empresa (nueva ruta pública) |
| 🟠 Baja | **API pública de seguimiento** | Endpoint público para que clientes consulten estado por FR |
| 🟠 Baja | **Roles granulares** | Permisos específicos para Finanzas, Almacén con más control |

---

## 12. MIGRACIONES SQL (orden cronológico)

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
