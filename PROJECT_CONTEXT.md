# PROJECT_CONTEXT.md — CABELAB v2.4
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
| Email | Resend | ^6.12.4 — **pendiente configurar RESEND_API_KEY** |
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
│   └── equipment/modals/  → Sub-modales de correo por evento de estado
├── lib/                   → Lógica de servidor: Supabase, workflow, validaciones, mail
├── hooks/                 → Custom hooks SWR (client-side data fetching)
├── types/                 → Tipos TypeScript derivados del esquema de BD
└── supabase/migrations/   → Historial SQL del esquema (001–013)
```

**Patrón de renderizado:** Server Components por defecto en `app/`. Directiva `'use client'` solo donde se necesita estado/interactividad. Las API Routes actúan como capa de acceso a Supabase desde el cliente.

---

## 4. ESTRUCTURA DETALLADA

### `/app/(auth)/`
- `login/page.tsx` — Formulario de login. Autenticación por nombre de usuario → email virtual `usuario@cabelab.local`. Registro público deshabilitado (solo superadmin crea cuentas).

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
| `/api/equipment/create` | POST | Creación de equipo. Guarda `email_thread_id` y `email_cc` |
| `/api/equipment/[id]/update-status` | POST | Cambio de estado. Detecta estado destino y dispara correo-reply específico. Acepta JSON o FormData (informe ODP con PDF) |
| `/api/equipment/[id]/force-status` | POST | Override de estado (solo superadmin). Notificación por correo opcional |
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
| `equipment/EquipmentForm.tsx` | Formulario de creación/edición. Incluye selector de CC para el correo de ingreso |
| `equipment/EquipmentDetail.tsx` | Ficha completa del equipo. Historial, cambio de estado, edición de timestamps (superadmin) |
| `equipment/EquipmentTable.tsx` | Tabla paginada con indicadores VIP y filtros |
| `equipment/StatusChangeModal.tsx` | Modal principal de cambio de estado. Renderiza sub-modales de correo según estado destino |
| `equipment/StatusBadge.tsx` | Badge de color dinámico según `status_color` de la vista |
| `equipment/ClientSelector.tsx` | Búsqueda predictiva de clientes existentes + registro de nuevos |
| `equipment/BrandSelector.tsx` | Búsqueda predictiva de marcas del catálogo. Auto-registra marcas nuevas |
| `equipment/ModelSelector.tsx` | Selector de modelos filtrado por marca seleccionada |
| `equipment/modals/ModalInformeODP.tsx` | Sub-modal: diagnóstico técnico + upload PDF (estado "Pendiente de aprobación") |
| `equipment/modals/ModalAprobacionVentas.tsx` | Sub-modal: tabla dinámica repuestos/servicios aprobados + observaciones (estado "Aprobado") |
| `equipment/modals/ModalEntregaLogistica.tsx` | Sub-modal: tabla de repuestos entregados con nota de compatibles (estado "En espera de repuesto") |
| `equipment/modals/ModalCulminadoODP.tsx` | Sub-modal: texto predefinido + observaciones finales (estado "Listo para entrega") |
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
| `workflow/engine.ts` | `WorkflowEngine` — clase estática: `validateTransition`, `getNextStates`, `isTerminal` |
| `validations/equipment.schema.ts` | Schemas Zod: `createEquipmentSchema` (con `cc_extra`), `updateStatusSchema`, `forceStatusSchema`, + 4 schemas de eventos de correo |
| `validations/user.schema.ts` | Schema Zod para validar inputs de usuarios |
| `mail/mailer.ts` | Sistema de correos en hilo con Resend. Ver sección 11 para detalle completo |
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

### Columnas de correo en `equipment_records` (migración 013)
| Columna | Tipo | Descripción |
|---|---|---|
| `email_thread_id` | `TEXT` | Message-ID devuelto por Resend al enviar el correo de ingreso. Se usa como `In-Reply-To` en todos los replies del hilo |
| `email_cc` | `TEXT[]` | Correos CC elegidos al ingresar el equipo. Se reutilizan en todos los correos del hilo |

### Vista central: `equipment_with_status`
JOIN de `equipment_records` + `workflow_states`. Agrega `status_name`, `status_color`, `is_terminal`, `days_elapsed`, `phase_1/2/3_days`, `assigned_technicians[]`, `priority_level`.

### Flujo de estados (workflow por defecto)
```
En espera de diagnóstico
  → En diagnóstico
    → Pendiente de aprobación   ← correo: Informe ODP (con PDF adjunto)
      → Aprobado                ← correo: Aprobación Ventas (tabla repuestos)
        → En mantenimiento
          → En espera de repuesto ← correo: Entrega Logística (tabla repuestos entregados)
            → En espera de repuesto adicional
          → Control de calidad
            → Listo para entrega  ← correo: Culminado ODP (texto predefinido)
              → Entregado (terminal)
```

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

> Última actualización: 11/09/2026

### Arquitectura general

- **Proveedor:** [Resend](https://resend.com) — infraestructura de email como servicio. No requiere cuentas de correo reales. Solo la `RESEND_API_KEY`.
- **Remitente actual:** `Ventas Cabelab <onboarding@resend.dev>` (dominio de prueba de Resend).
- **Remitente en producción:** Cambiar a `notificaciones@cabelab.com` una vez verificado el dominio `cabelab.com` en el panel de Resend.
- **Hilo de correo:** El correo de ingreso guarda su `message-id` en `equipment_records.email_thread_id`. Todos los correos posteriores del mismo equipo usan `In-Reply-To: <thread_id>` y asunto `RE:` idéntico → aparecen en el mismo hilo en Gmail y Outlook.
- **Los correos del workflow NO se almacenan en BD** — solo van al correo. Ahorra espacio en Supabase gratuito (500 MB límite).

### Destinatarios fijos del correo de ingreso (TO)
```
ventas@cabelab.com       → Recepción / Ventas
odp@cabelab.com          → Operaciones
heady.mamani@cabelab.com → Logística
daniel.rojas@cabelab.com → Fijo adicional
vivian.mamani@cabelab.com → Fijo adicional
```

### CC opcionales (selector en el formulario de ingreso)
```
mauricio.beltran@cabelab.com
gersson.ortiz@cabelab.com
```
Los CC se guardan en `equipment_records.email_cc[]` y se reutilizan automáticamente en todos los correos del hilo.

### Puntos de disparo de correo

| Estado destino | Quién lo hace | Correo que se envía | Datos requeridos en el modal |
|---|---|---|---|
| **Ingreso** (al crear equipo) | Recepción / Ventas | Tabla horizontal con datos del equipo | Selector CC opcional |
| **Pendiente de aprobación** | ODP | Informe técnico con PDF adjunto | Texto de diagnóstico + archivo PDF |
| **Aprobado** | Ventas | Tabla de repuestos/servicios aprobados | Filas: descripción / cantidad / precio + observaciones |
| **En espera de repuesto** | Logística | Lista de repuestos entregados | Filas: descripción / cantidad / nota-compatible + observaciones |
| **Listo para entrega** | ODP | Texto predefinido de culminado | Observaciones adicionales (opcional) |
| Otros estados | — | **Sin correo** | — |
| **Override superadmin** | Superadmin | Correo con banner amarillo de advertencia | Solo si activa el checkbox "notificar por correo" |

### Archivos del sistema de correos

```
lib/mail/mailer.ts                              → Lógica central. ENTRY_TO[], CC_OPTIONS[], 5 funciones de envío
lib/validations/equipment.schema.ts             → 4 schemas Zod para eventos de correo
app/api/equipment/create/route.ts               → Guarda email_thread_id y email_cc tras el envío
app/api/equipment/[id]/update-status/route.ts   → Detecta estado destino y dispara el correo correcto
app/api/equipment/[id]/force-status/route.ts    → Override con correo opcional
components/equipment/EquipmentForm.tsx          → Selector CC en el formulario de ingreso
components/equipment/StatusChangeModal.tsx      → Orquesta sub-modales según estado destino
components/equipment/modals/ModalInformeODP.tsx         → Diagnóstico + upload PDF
components/equipment/modals/ModalAprobacionVentas.tsx   → Tabla dinámica repuestos aprobados
components/equipment/modals/ModalEntregaLogistica.tsx   → Tabla repuestos entregados
components/equipment/modals/ModalCulminadoODP.tsx       → Texto predefinido + observaciones
supabase/migrations/013_email_thread.sql        → Columnas email_thread_id y email_cc
```

### Funciones del mailer

| Función | Descripción |
|---|---|
| `sendEquipmentEntry(data, cc_extra[])` | Correo de ingreso. **Devuelve** el `message-id` para guardarlo en BD |
| `sendInformeODP(data)` | Reply con diagnóstico + PDF adjunto (Buffer) |
| `sendAprobacionVentas(data)` | Reply con tabla de ítems aprobados |
| `sendEntregaLogistica(data)` | Reply con tabla de repuestos entregados |
| `sendCulminadoODP(data)` | Reply con texto predefinido + observaciones |

### `update-status/route.ts` — lógica de detección

El route acepta tanto **JSON** como **FormData** (`multipart/form-data`):
- `multipart/form-data` → estado "Pendiente de aprobación" (lleva PDF como `File`)
- `application/json` → todos los demás estados

Solo dispara correo si `equipment_records.email_thread_id` no es null (el equipo tiene correo de ingreso registrado).

### Para modificar destinatarios o CC opcionales

Editar directamente `lib/mail/mailer.ts`:
```typescript
// Destinatarios fijos de todos los correos:
const ENTRY_TO = [ ... ]

// CC opcionales que aparecen en el selector del frontend:
export const CC_OPTIONS: CcOption[] = [ ... ]
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

> Última sesión: 11/09/2026

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
- **Sistema de correos en hilo completo** (código listo, pendiente solo configuración)

### ⚠️ Listo en código pero pendiente de activar

| Pendiente | Qué hacer |
|---|---|
| Correos en producción | Ejecutar migración 013, configurar `RESEND_API_KEY`, verificar dominio en Resend |
| Remitente con dominio propio | Cambiar `FROM_ADDRESS` en `mailer.ts` a `notificaciones@cabelab.com` |

### 📋 Roadmap pendiente

| Prioridad | Feature | Descripción |
|---|---|---|
| 🔜 Alta | **Generación de PDF del sistema** | Informe técnico generado automáticamente por el sistema con membrete CABELAB. Usar `@react-pdf/renderer`. Endpoint `GET /api/equipment/[id]/pdf`. Botón en `EquipmentDetail.tsx` para roles superadmin/admin/recepcion |
| 🔜 Alta | **Códigos QR** | Etiqueta imprimible por equipo que enlaza a su ficha |
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
