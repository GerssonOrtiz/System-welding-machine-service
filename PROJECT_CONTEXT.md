# PROJECT_CONTEXT.md — CABELAB v2.5
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
| Códigos QR | qrcode.react (SVG / Canvas) | ^4.2.0 |
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
│   ├── doc/               → Rutas públicas para escaneo QR de motosoldadoras
│   │   ├── [serial]/      → /doc/[serial]  — historial completo por número de serie
│   │   └── fr/[fr]/       → /doc/fr/[fr]   — ficha de ingreso único por FR (equipos sin serie)
│   ├── admin/             → Páginas de administración (fuera del layout dashboard)
│   └── api/               → API Routes (REST, server-side)
│       └── public/        → API Routes públicas sin autenticación (/api/public/equipment/...)
├── components/            → Componentes React reutilizables (client-side)
│   └── equipment/modals/  → Sub-modales de correo por evento de estado
├── lib/                   → Lógica de servidor: Supabase, workflow, validaciones, mail
├── hooks/                 → Custom hooks SWR (client-side data fetching)
├── types/                 → Tipos TypeScript derivados del esquema de BD
└── supabase/migrations/   → Historial SQL del esquema (001–015)
```

**Patrón de renderizado:** Server Components por defecto en `app/`. Directiva `'use client'` solo donde se necesita estado/interactividad. Las API Routes actúan como capa de acceso a Supabase desde el cliente.

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
| `/api/equipment/create` | POST | Creación de equipo. Guarda `email_thread_id`, `email_cc` y `report_url` |
| `/api/equipment/[id]/update-status` | POST | Cambio de estado. Detecta estado destino y dispara correo-reply específico. Acepta JSON o FormData (informe ODP con PDF y `report_url`) |
| `/api/equipment/[id]/update` | PUT | Edición completa por superadmin (incluye `report_url`) |
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
| `equipment/EquipmentDetail.tsx` | Ficha completa del equipo. Historial, cambio de estado, edición de timestamps (superadmin), botón de QR y visualización de informe |
| `equipment/EquipmentTable.tsx` | Tabla paginada con indicadores VIP, filtros y botón directo de etiqueta QR |
| `equipment/QRPrintModal.tsx` | Modal con generación de código QR (qrcode.react) e impresión optimizada de etiqueta física |
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

### Columnas de correo y documentación en `equipment_records`
| Columna | Tipo | Migración | Descripción |
|---|---|---|---|
| `email_thread_id` | `TEXT` | 013 | Message-ID devuelto por Resend al enviar el correo de ingreso. Se usa como `In-Reply-To` en todos los replies del hilo |
| `email_cc` | `TEXT[]` | 013 | Correos CC elegidos al ingresar el equipo. Se reutilizan en todos los correos del hilo |
| `report_url` | `TEXT` | 015 | Enlace directo al PDF del informe técnico (Google Drive u otro). Se muestra en la página pública por QR `/doc/[serial]` |

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

> Última sesión: 24/09/2026

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
- **Identidad visual propia y autoría**:
  - Logo SVG propio (`CabelabLogo.tsx`) con icono de arco eléctrico y variante compacta
  - Autoría explícita de **Br. Gersson Ortiz** en login, navbar y metadata de aplicación
  - Favicon dinámico generado por código (`app/icon.tsx`)
  - Iconos Lucide profesionales en Sidebar (`Sidebar.tsx`) reemplazando emojis
  - Pie de Sidebar con Avatar, nombre y rol de usuario activo en tiempo real
- **Experiencia de Usuario (UX)**:
  - Títulos dinámicos de pestañas con formato `[Vista] | CABELAB` vía hook `usePageTitle.ts`
  - Componente reutilizable de estados vacíos `EmptyState.tsx` aplicado en tablas
  - Página 404 personalizada (`app/not-found.tsx`) con temática oscura y estética del sistema
- **Sistema de correos en hilo completo** (código listo, pendiente solo configuración)
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

### ⚠️ Listo en código pero pendiente de activar

| Pendiente | Qué hacer |
|---|---|
| Migración report_url | Ejecutar migración `015_equipment_report_url.sql` en el panel SQL de Supabase |
| Correos en producción | Ejecutar migración 013, configurar `RESEND_API_KEY`, verificar dominio en Resend |
| Remitente con dominio propio | Cambiar `FROM_ADDRESS` en `mailer.ts` a `notificaciones@cabelab.com` |

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

### 15.7 Configuración del middleware para rutas públicas

**Archivo:** `middleware.ts` — línea 18:

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
