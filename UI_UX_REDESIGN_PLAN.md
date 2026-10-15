# UI_UX_REDESIGN_PLAN.md — SYNAPSE v2.5 · CABELAB
> **Guía maestra del proceso de rediseño Premium Dark Glassmorphism con iluminación ambiental ámbar/naranja.**  
> Antigravity debe leer este documento completo antes de tocar cualquier archivo del proyecto.  
> Actualizar el estado `[ ]` / `[x]` de cada tarea conforme se complete.

---

## ÍNDICE

1. [Estado global del proyecto](#1-estado-global-del-proyecto)
2. [Principios fundamentales e intocables](#2-principios-fundamentales-e-intocables)
3. [Tecnologías y stack actual de CABELAB](#3-tecnologías-y-stack-actual-de-cabelab)
4. [Sistema visual objetivo — Premium Dark Glassmorphism](#4-sistema-visual-objetivo--premium-dark-glassmorphism)
5. [Mapa de componentes a rediseñar](#5-mapa-de-componentes-a-rediseñar)
6. [FASE 0 — Preparación y seguridad del repositorio](#fase-0--preparación-y-seguridad-del-repositorio)
7. [FASE 1 — Análisis de referencia Glassmorphism Admin Panel UI](#fase-1--análisis-de-referencia-glassmorphism-admin-panel-ui)
8. [FASE 2 — Sistema de tokens visuales (Design Tokens)](#fase-2--sistema-de-tokens-visuales-design-tokens)
9. [FASE 3 — Rediseño de navegación (Sidebar + Navbar)](#fase-3--rediseño-de-navegación-sidebar--navbar)
10. [FASE 4 — Rediseño de tarjetas y contenedores](#fase-4--rediseño-de-tarjetas-y-contenedores)
11. [FASE 5 — Rediseño de tablas](#fase-5--rediseño-de-tablas)
12. [FASE 6 — Rediseño de formularios y modales](#fase-6--rediseño-de-formularios-y-modales)
13. [FASE 7 — Rediseño de la Pizarra (Kanban)](#fase-7--rediseño-de-la-pizarra-kanban)
14. [FASE 8 — Rediseño de páginas públicas (QR)](#fase-8--rediseño-de-páginas-públicas-qr)
15. [FASE 9 — Optimización responsive y accesibilidad](#fase-9--optimización-responsive-y-accesibilidad)
16. [FASE 10 — Pruebas funcionales y validación integral](#fase-10--pruebas-funcionales-y-validación-integral)
17. [FASE 11 — Build de producción y rendimiento](#fase-11--build-de-producción-y-rendimiento)
18. [FASE 12 — Revisión visual final y corrección de errores](#fase-12--revisión-visual-final-y-corrección-de-errores)
19. [FASE 13 — Merge a main y criterios de aceptación final](#fase-13--merge-a-main-y-criterios-de-aceptación-final)
20. [Registro de decisiones (ADR)](#20-registro-de-decisiones-adr)
21. [Registro de incidencias](#21-registro-de-incidencias)
22. [Referencias y enlaces oficiales](#22-referencias-y-enlaces-oficiales)

---

## 1. Estado global del proyecto

| Fase | Nombre | Estado | Aprobación |
|------|--------|--------|-----------|
| 0 | Preparación y seguridad del repositorio | ⏳ Pendiente | — |
| 1 | Análisis de referencia Glassmorphism | ⏳ Pendiente | — |
| 2 | Sistema de tokens visuales | ⏳ Pendiente | — |
| 3 | Navegación (Sidebar + Navbar) | ⏳ Pendiente | — |
| 4 | Tarjetas y contenedores | ⏳ Pendiente | — |
| 5 | Tablas | ⏳ Pendiente | — |
| 6 | Formularios y modales | ⏳ Pendiente | — |
| 7 | Pizarra Kanban | ⏳ Pendiente | — |
| 8 | Páginas públicas QR | ⏳ Pendiente | — |
| 9 | Responsive y accesibilidad | ⏳ Pendiente | — |
| 10 | Pruebas funcionales | ⏳ Pendiente | — |
| 11 | Build de producción y rendimiento | ⏳ Pendiente | — |
| 12 | Revisión visual final | ⏳ Pendiente | — |
| 13 | Merge a main + criterios de aceptación | ⏳ Pendiente | — |

**Leyenda:** ⏳ Pendiente · 🔄 En progreso · ✅ Completado · 🔴 Bloqueado · ⚠️ Con advertencias

> **REGLA DE ORO:** Ninguna fase puede comenzar sin que la anterior haya sido marcada ✅ y aprobada explícitamente por el usuario. Antigravity debe solicitar aprobación al final de cada fase.

---

## 2. Principios fundamentales e intocables

> **NUNCA modificar nada de esta lista. El rediseño es SOLO visual/estético.**

### 2.1 Lógica de negocio protegida
- Workflow de estados (WorkflowEngine) y todas sus transiciones
- Sistema de roles y permisos (`types/user.ts` — `SIDEBAR_ITEMS_BY_ROLE`, `ROLE_HOME_ROUTE`)
- Autenticación por username → `username@cabelab.local` → Supabase Auth
- Proxy de Next.js 16 (`proxy.ts`) — protección de rutas, cookies, redirects
- Server Component en `app/(dashboard)/layout.tsx` — validación server-side de sesión
- RLS (Row Level Security) activo en todas las tablas de Supabase
- Sistema de correos en hilo (Resend + RFC 2822 headers)
- Audit log inmutable (`status_history`)
- Realtime WebSocket de la Pizarra (`useRealtimePizarra`)
- Desacoplamiento Servicio/Repuestos (Migración 019)

### 2.2 APIs protegidas
- Ningún endpoint de `/app/api/` puede ser modificado en su lógica
- Las rutas públicas `/doc/` y `/api/public/` deben permanecer sin autenticación
- Los schemas Zod en `lib/validations/` no se tocan

### 2.3 Base de datos protegida
- Ninguna migración SQL nueva durante el rediseño
- La vista `equipment_with_status` no se modifica
- Los tipos en `types/database.types.ts` son solo lectura

### 2.4 Funcionalidades protegidas
- Sistema QR (`QRPrintModal.tsx`) — lógica de URL (serie vs FR), impresión
- Export/Import Excel
- DNA del equipo (historial por serie)
- Módulo de auditoría y pronóstico predictivo
- Sistema de ingreso por lotes

---

## 3. Tecnologías y stack actual de CABELAB

> Información extraída directamente del proyecto. Usarla como referencia definitiva.

### 3.1 Stack técnico verificado

| Capa | Tecnología | Versión exacta |
|------|-----------|---------------|
| Framework | Next.js App Router | **16.2.7** |
| Lenguaje | TypeScript strict | `^5` |
| Estilos | Tailwind CSS | **^3.4.19** |
| Iconos | Lucide React | **^1.18.0** |
| Estado cliente | SWR | `^2.4.1` |
| Formularios | react-hook-form + Zod | `^7` + `^4` |
| Notificaciones | Sonner (Toasts) | `^2.0.7` |
| UI Primitives | Radix UI (Dialog, Select, Dropdown) | instalado |
| Auth | Supabase Auth (`@supabase/ssr`) | `^0.10.3` |
| Realtime | Supabase Realtime | — |
| QR | qrcode.react | `^4.2.0` |
| Utilidades CSS | clsx + tailwind-merge | instalados |
| React | React 19 | `19.2.4` |

> **IMPORTANTE:** Next.js 16.2.7 es una versión con cambios breaking respecto a versiones anteriores. Leer `node_modules/next/dist/docs/` antes de cualquier cambio en `app/` o `proxy.ts`.

### 3.2 Sistema de colores actual (tailwind.config.ts)

```typescript
// Fondos actuales
'bg-base':     '#070A12'   // fondo raíz — azul noche muy oscuro
'bg-surface':  '#0B0F1A'   // superficie (sidebar, cards) 
'bg-elevated': '#111827'   // elementos elevados (dropdowns, modales)

// Neón actual
'neon-blue':   '#00E5FF'   // acento principal — cian eléctrico
'electric':    '#0052FF'   // azul eléctrico
'neon-purple': '#9D4EDD'   // acento secundario

// Texto actual
'text-primary':   '#F1F5F9'
'text-secondary': '#94A3B8'
'text-muted':     '#475569'

// Semánticos actuales
'success': '#10B981'
'warning': '#F59E0B'
'error':   '#EF4444'
```

### 3.3 Animaciones existentes (globals.css + tailwind.config.ts)

| Clase | Keyframe | Uso actual |
|-------|----------|-----------|
| `animate-glow-pulse` | `glowPulse 2s ease-in-out infinite` | Equipos atrasados >5 días |
| `animate-fade-in` | `fadeIn 150ms ease-out` | Aparición de elementos |
| `animate-slide-in` | `slideIn 200ms ease-out` | Modales / drawers |
| `animate-slide-out` | `slideOut 200ms ease-in` | Cierre de modales |

### 3.4 Fuentes actuales

- **Sans:** Inter (Google Fonts)
- **Mono:** JetBrains Mono (para FRs y números de serie)

### 3.5 Assets públicos relevantes

| Archivo | Uso | Restricción |
|---------|-----|------------|
| `/public/cabelab_negro.png` | Logo negro — etiqueta QR impresa, logo embebido en QR | Solo sobre fondos blancos |
| `/public/cabelab.png` | Logo blanco — páginas públicas | Solo sobre fondos oscuros |
| `/public/synapse_logo.png` | Ícono compacto Synapse | Sidebar colapsado |
| `/public/synapse_horizontal.png` | Logo horizontal Synapse | Sidebar expandido |
| `/public/synapse_completo.png` | Logo completo | Uso general |
| `/public/synapse_texto.png` | Solo texto "SYNAPSE" | Variante texto |

---

## 4. Sistema visual objetivo — Premium Dark Glassmorphism

### 4.1 Concepto de diseño

**"Forge Ambience"** — Atmósfera de fragua industrial de alta precisión. El sistema evoca la calidez del metal caliente (ámbar/naranja) sobre la frialdad del acero nocturno (azul oscuro profundo), creando una identidad visual que honra el contexto industrial de taller de motosoldadoras.

```
ANTES (actual):            DESPUÉS (objetivo):
─────────────────          ─────────────────────────────────────
Neón azul cian puro   →   Glassmorphism + iluminación ámbar/naranja
Fondos sólidos planos →   Capas translúcidas con blur y gradientes
Bordes blancos tenues →   Bordes luminosos amber con glow sutil
Sin profundidad       →   Jerarquía visual Z-axis con sombras cálidas
```

### 4.2 Paleta de colores objetivo

```
── FONDOS (mantener oscuros profundos) ──────────────────────────────
bg-forge:        #06080F   // fondo raíz — negro acero
bg-forge-mid:    #0A0C17   // superficie base
bg-forge-high:   #0E1120   // tarjetas y paneles
bg-glass:        rgba(14, 17, 32, 0.60)  // superficies glass

── ACENTO PRIMARIO (ámbar — calor del metal) ─────────────────────────
amber-core:      #F59E0B   // ámbar puro — acento principal
amber-glow:      #FBBF24   // ámbar claro — hover / activo
amber-deep:      #D97706   // ámbar profundo — bordes
amber-ghost:     rgba(245, 158, 11, 0.08)  // fondo sutil en hover
amber-border:    rgba(245, 158, 11, 0.20)  // borde glass
amber-shine:     rgba(245, 158, 11, 0.40)  // borde activo

── ACENTO SECUNDARIO (naranja — arco de soldadura) ───────────────────
forge-orange:    #EA580C   // naranja forja — énfasis
forge-bright:    #F97316   // naranja brillante — CTAs
forge-ghost:     rgba(234, 88, 12, 0.08)

── CIAN (conservar para compatibilidad con badges de estado) ─────────
neon-blue:       #00E5FF   // MANTENER — usado en status badges
electric:        #0052FF   // MANTENER — status badges
neon-purple:     #9D4EDD   // MANTENER — status badges

── TEXTO ──────────────────────────────────────────────────────────────
text-forge:      #F5F0E8   // blanco cálido — texto principal
text-forge-mid:  #A89880   // beige apagado — texto secundario
text-forge-dim:  #5C4F3D   // marrón oscuro — texto muted

── SEMÁNTICOS (mantener para lógica de estados) ──────────────────────
success:         #10B981   // MANTENER
warning:         #F59E0B   // MANTENER (coincide con amber-core)
error:           #EF4444   // MANTENER
info:            #00E5FF   // MANTENER
```

> **Regla de migración de colores:** Los colores `status-*` y semánticos (`success`, `warning`, `error`) NO se cambian. Solo se agregan los nuevos tokens amber/forge y se reemplazan gradualmente los usos de `neon-blue` en UI estructural (no en badges de estado).

### 4.3 Efectos glassmorphism

```css
/* Tarjeta glass estándar */
.glass-card {
  background: rgba(14, 17, 32, 0.60);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(245, 158, 11, 0.20);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.40),
    0 0 0 1px rgba(245, 158, 11, 0.08),
    inset 0 1px 0 rgba(245, 158, 11, 0.08);
}

/* Tarjeta glass con glow ámbar activa */
.glass-card-active {
  border-color: rgba(245, 158, 11, 0.40);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.40),
    0 0 20px rgba(245, 158, 11, 0.12),
    0 0 0 1px rgba(245, 158, 11, 0.20),
    inset 0 1px 0 rgba(245, 158, 11, 0.15);
}

/* Iluminación ambiental — usado en sidebar y modales */
.ambient-amber {
  background: radial-gradient(
    ellipse at 20% 50%,
    rgba(245, 158, 11, 0.06) 0%,
    transparent 60%
  );
}

/* Barra lateral con gradiente de forja */
.sidebar-forge {
  background: linear-gradient(
    180deg,
    rgba(10, 12, 23, 0.95) 0%,
    rgba(15, 10, 5, 0.92) 100%
  );
}
```

### 4.4 Sombras y glow

```
shadow-amber-sm:   0 0 8px rgba(245, 158, 11, 0.25)
shadow-amber-md:   0 0 16px rgba(245, 158, 11, 0.35), 0 0 32px rgba(245, 158, 11, 0.10)
shadow-amber-lg:   0 0 24px rgba(245, 158, 11, 0.45), 0 0 48px rgba(245, 158, 11, 0.15)
shadow-forge:      0 0 12px rgba(234, 88, 12, 0.35), 0 0 24px rgba(234, 88, 12, 0.10)
shadow-glass:      0 8px 32px rgba(0, 0, 0, 0.60), inset 0 1px 0 rgba(255,255,255,0.04)
shadow-vip:        0 0 20px rgba(245, 158, 11, 0.60), 0 0 40px rgba(245, 158, 11, 0.20)  (VIP ⭐)
```

### 4.5 Transiciones y animaciones nuevas

```
transition-forge:   all 200ms cubic-bezier(0.4, 0, 0.2, 1)
transition-glow:    box-shadow 300ms ease, border-color 300ms ease
animate-amber-pulse: amberPulse 2.5s ease-in-out infinite  (reemplaza glow-pulse en VIP)
animate-glass-in:   glassIn 250ms cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 5. Mapa de componentes a rediseñar

> Lista exhaustiva de todos los archivos que recibirán cambios de estilo. **Solo clases CSS/Tailwind.**

### 5.1 Layouts y navegación

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`tailwind.config.ts`](tailwind.config.ts) | Agregar tokens amber/forge, sombras glass, animaciones | Bajo |
| [`app/globals.css`](app/globals.css) | Agregar CSS glass, ambient glow, scrollbar ámbar | Bajo |
| [`components/layout/Sidebar.tsx`](components/layout/Sidebar.tsx) | Glass sidebar con gradiente forge, ítem activo ámbar | Medio |
| [`components/layout/Navbar.tsx`](components/layout/Navbar.tsx) | Glass navbar con borde inferior ámbar sutil | Medio |
| [`components/layout/DashboardShell.tsx`](components/layout/DashboardShell.tsx) | Solo clases de layout/fondo | Bajo |

### 5.2 Equipos (componentes principales)

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`components/equipment/EquipmentTable.tsx`](components/equipment/EquipmentTable.tsx) | Filas glass, hover ámbar, cabecera sticky glass | Medio |
| [`components/equipment/EquipmentDetail.tsx`](components/equipment/EquipmentDetail.tsx) | Panel glass, secciones colapsables glass, badges duales | Medio |
| [`components/equipment/EquipmentForm.tsx`](components/equipment/EquipmentForm.tsx) | Inputs glass, labels ámbar, tarjetas de lote glass | Medio |
| [`components/equipment/StatusBadge.tsx`](components/equipment/StatusBadge.tsx) | Solo estética badge — colores de estado se conservan | Bajo |
| [`components/equipment/QRPrintModal.tsx`](components/equipment/QRPrintModal.tsx) | Solo el modal wrapper — NO tocar lógica QR ni iframe de impresión | Alto |
| [`components/equipment/StatusChangeModal.tsx`](components/equipment/StatusChangeModal.tsx) | Modal glass — NO tocar lógica de cambio de estado | Alto |
| [`components/equipment/ClientSelector.tsx`](components/equipment/ClientSelector.tsx) | Dropdown glass, input ámbar | Medio |
| [`components/equipment/BrandSelector.tsx`](components/equipment/BrandSelector.tsx) | Dropdown glass, input ámbar | Medio |
| [`components/equipment/ModelSelector.tsx`](components/equipment/ModelSelector.tsx) | Select glass | Medio |

### 5.3 Modales de flujo (riesgo Alto — solo CSS externo)

| Archivo | Alcance del cambio | Restricción |
|---------|-------------------|------------|
| [`components/equipment/modals/ModalInformeODP.tsx`](components/equipment/modals/ModalInformeODP.tsx) | Wrapper glass | NO tocar lógica PDF |
| [`components/equipment/modals/ModalAprobacionVentas.tsx`](components/equipment/modals/ModalAprobacionVentas.tsx) | Tabla glass, inputs ámbar | NO tocar lógica repuestos |
| [`components/equipment/modals/ModalEntregaLogistica.tsx`](components/equipment/modals/ModalEntregaLogistica.tsx) | Glass | NO tocar lógica logística |
| [`components/equipment/modals/ModalEntregaRepuestos.tsx`](components/equipment/modals/ModalEntregaRepuestos.tsx) | Glass | NO tocar deliver-parts |
| [`components/equipment/modals/ModalCulminadoODP.tsx`](components/equipment/modals/ModalCulminadoODP.tsx) | Glass | NO tocar lógica culminado |
| [`components/equipment/modals/ModalCoordinacionCliente.tsx`](components/equipment/modals/ModalCoordinacionCliente.tsx) | Glass | NO tocar lógica correo |

### 5.4 Pizarra

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`components/pizarra/PizarraBoard.tsx`](components/pizarra/PizarraBoard.tsx) | Columnas glass, encabezados ámbar | Alto |
| [`components/pizarra/PizarraCard.tsx`](components/pizarra/PizarraCard.tsx) | Tarjeta glass, glow VIP ámbar, chips repuestos | Alto |

### 5.5 Administración

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`components/admin/BrandModelManager.tsx`](components/admin/BrandModelManager.tsx) | Tablas y forms glass | Medio |
| [`components/admin/PartManager.tsx`](components/admin/PartManager.tsx) | Tablas y forms glass | Medio |
| [`components/admin/TechnicianManager.tsx`](components/admin/TechnicianManager.tsx) | Tablas y forms glass | Medio |
| [`components/admin/HolidayCalendarManager.tsx`](components/admin/HolidayCalendarManager.tsx) | Tablas y forms glass | Medio |

### 5.6 Auditoría

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`components/auditoria/ModelSelectorHeader.tsx`](components/auditoria/ModelSelectorHeader.tsx) | Selector glass, badge confianza ámbar | Medio |
| [`components/auditoria/ModelKpiCards.tsx`](components/auditoria/ModelKpiCards.tsx) | KPI cards glass con glow | Medio |
| [`components/auditoria/StageGanttTimeline.tsx`](components/auditoria/StageGanttTimeline.tsx) | Barras Gantt con colores forge | Medio |
| [`components/auditoria/DeliveryForecastCalculator.tsx`](components/auditoria/DeliveryForecastCalculator.tsx) | Calculadora glass | Medio |
| [`components/auditoria/DelayFactorsAudit.tsx`](components/auditoria/DelayFactorsAudit.tsx) | Matriz glass | Medio |

### 5.7 UI Primitivos

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`components/ui/CabelabLogo.tsx`](components/ui/CabelabLogo.tsx) | Ajuste de colores SVG a paleta forge | Bajo |
| [`components/ui/EmptyState.tsx`](components/ui/EmptyState.tsx) | Ícono y texto con paleta forge | Bajo |
| [`components/ui/ToasterProvider.tsx`](components/ui/ToasterProvider.tsx) | Tema Sonner dark con ámbar | Bajo |

### 5.8 Páginas de app (solo clases de layout)

| Archivo | Alcance del cambio | Riesgo |
|---------|-------------------|--------|
| [`app/(auth)/login/page.tsx`](app/%28auth%29/login/page.tsx) | Fondo forge, form glass, glow ámbar | Medio |
| [`app/(dashboard)/dashboard/page.tsx`](app/%28dashboard%29/dashboard/page.tsx) | Layout glass, métricas glass | Medio |
| [`app/(dashboard)/equipos/page.tsx`](app/%28dashboard%29/equipos/page.tsx) | Filtros glass | Bajo |
| [`app/(dashboard)/pizarra/page.tsx`](app/%28dashboard%29/pizarra/page.tsx) | Layout pizarra | Bajo |
| [`app/(dashboard)/estadisticas/page.tsx`](app/%28dashboard%29/estadisticas/page.tsx) | Cards glass | Medio |
| [`app/(dashboard)/auditoria-modelos/page.tsx`](app/%28dashboard%29/auditoria-modelos/page.tsx) | Layout glass | Bajo |
| [`app/(dashboard)/dna/page.tsx`](app/%28dashboard%29/dna/page.tsx) | Timeline glass | Medio |
| [`app/(dashboard)/historial/page.tsx`](app/%28dashboard%29/historial/page.tsx) | Tabla glass | Medio |
| [`app/(dashboard)/buscar/page.tsx`](app/%28dashboard%29/buscar/page.tsx) | Input glass, resultados glass | Bajo |
| [`app/(dashboard)/perfil/page.tsx`](app/%28dashboard%29/perfil/page.tsx) | Form glass | Bajo |
| [`app/doc/[serial]/page.tsx`](app/doc/%5Bserial%5D/page.tsx) | Página pública — glass responsivo | Medio |
| [`app/doc/fr/[fr]/page.tsx`](app/doc/fr/%5Bfr%5D/page.tsx) | Página pública — glass responsivo | Medio |
| [`app/not-found.tsx`](app/not-found.tsx) | Estética 404 forge | Bajo |
| [`app/admin/catalog/page.tsx`](app/admin/catalog/page.tsx) | Catálogo glass full-screen | Medio |
| [`app/admin/usuarios/page.tsx`](app/admin/usuarios/page.tsx) | Gestión usuarios glass | Medio |
| [`app/admin/workflow/page.tsx`](app/admin/workflow/page.tsx) | Editor workflow glass | Medio |

---

## FASE 0 — Preparación y seguridad del repositorio

**Objetivo:** Garantizar que el código actual esté completamente respaldado y que el rediseño ocurra en una rama aislada. Ningún cambio en `main` hasta aprobación final.

**Estado:** ⏳ Pendiente

### Tareas

- [ ] **0.1** Verificar estado limpio del repositorio
- [ ] **0.2** Confirmar que `main` está al día (sin cambios no commiteados)
- [ ] **0.3** Crear rama `feature/ui-redesign-glassmorphism` desde `main`
- [ ] **0.4** Verificar que la rama fue creada correctamente
- [ ] **0.5** Documentar el commit de base (hash del último commit en main)
- [ ] **0.6** Crear tag de respaldo `v2.5-before-redesign`
- [ ] **0.7** Verificar que la aplicación funciona en la nueva rama (build local)

### Comandos de terminal

```powershell
# 0.1 — Ver estado actual
git status
git log --oneline -5

# 0.2 — Si hay cambios sin commitear, commitear o stashear primero
git stash  # solo si hay cambios que no quieres perder

# 0.3 — Crear rama de rediseño
git checkout -b feature/ui-redesign-glassmorphism

# 0.4 — Verificar
git branch  # debe mostrar * feature/ui-redesign-glassmorphism

# 0.5 — Documentar hash de commit base
git log --oneline -1  # copiar hash aquí abajo

# 0.6 — Tag de respaldo
git tag v2.5-before-redesign main
git tag  # verificar que el tag existe

# 0.7 — Build de verificación
npm run build
```

**Hash de commit base (rellenar al ejecutar):** `_______`  
**Tag creado:** `v2.5-before-redesign`  
**Rama activa:** `feature/ui-redesign-glassmorphism`

### Archivos involucrados
- `.git/` (sin modificar archivos de proyecto)

### Riesgos
- ⚠️ Si hay archivos sin commitear, se perderían al crear la rama sin stash/commit previo.
- ⚠️ El build puede fallar si hay errores TypeScript previos al rediseño — documentarlos en [Registro de incidencias](#21-registro-de-incidencias).

### Criterio para avanzar a Fase 1
- Rama `feature/ui-redesign-glassmorphism` existe y está activa
- `git status` muestra "nothing to commit, working tree clean"
- `npm run build` completó sin errores (o los errores previos están documentados)
- **Aprobación explícita del usuario requerida**

---

## FASE 1 — Análisis de referencia Glassmorphism Admin Panel UI

**Objetivo:** Analizar el repositorio de referencia para identificar patrones de glassmorphism aplicables a CABELAB, seleccionar componentes reutilizables y tomar decisiones de adaptación.

**Estado:** ⏳ Pendiente

> **Repositorio de referencia:** [Glassmorphism Admin Panel UI](https://github.com/safak/youtube2022/tree/glassmorphism-dashboard) — o el repositorio específico que el usuario indique.

### Tareas

- [ ] **1.1** El usuario proporciona la URL exacta del repositorio Glassmorphism a analizar
- [ ] **1.2** Clonar o descargar el repositorio de referencia en una carpeta **fuera** del proyecto CABELAB
- [ ] **1.3** Analizar la estructura de colores y variables CSS del repositorio de referencia
- [ ] **1.4** Identificar patrones de `backdrop-filter`, `background: rgba()` y bordes glass usados
- [ ] **1.5** Identificar componentes de navegación adaptables (sidebar, navbar)
- [ ] **1.6** Identificar patrones de cards, tablas y formularios glass
- [ ] **1.7** Evaluar compatibilidad con Tailwind CSS v3 (el repo de referencia puede usar CSS puro o Tailwind v4)
- [ ] **1.8** Documentar decisiones de adaptación en [Registro de decisiones (ADR)](#20-registro-de-decisiones-adr)
- [ ] **1.9** Listar dependencias adicionales necesarias (si las hay)

### Comandos de terminal

```powershell
# 1.2 — Clonar referencia FUERA del proyecto CABELAB
# Ejecutar desde el Escritorio o una carpeta temporal, NO desde el proyecto
cd C:\Users\gorti\Desktop
git clone <URL_DEL_REPOSITORIO_REFERENCIA> glassmorphism-reference

# 1.3 — Ver estructura de estilos del repo de referencia
Get-ChildItem "C:\Users\gorti\Desktop\glassmorphism-reference" -Recurse -Include "*.css","*.scss","*.ts","*.js" | Where-Object { $_.Name -match "tailwind|style|theme|color|variable" }
```

### Directorio de análisis (rellenar durante la fase)

```
Repositorio analizado: ___________________________________________
Tecnología de estilos: [ ] CSS puro [ ] Tailwind v3 [ ] Tailwind v4 [ ] SCSS [ ] otro: ___
Backdrop-filter usado: [ ] Sí [ ] No — valor: ___________________
Variables CSS usadas:   [ ] Sí [ ] No
Compatibilidad directa con Tailwind v3: [ ] Total [ ] Parcial [ ] Ninguna

Componentes reutilizables identificados:
- Sidebar: [ ] Sí [ ] No
- Navbar: [ ] Sí [ ] No
- Cards: [ ] Sí [ ] No
- Tablas: [ ] Sí [ ] No
- Formularios: [ ] Sí [ ] No
- Modales: [ ] Sí [ ] No

Dependencias adicionales necesarias: ____________________________
(Si son necesarias, documentar en ADR antes de instalar)
```

### Riesgos
- ⚠️ Si el repo de referencia usa Tailwind v4, los patrones no son directamente compatibles con la v3 de CABELAB. Adaptar manualmente.
- ⚠️ `backdrop-filter: blur()` puede tener rendimiento bajo en dispositivos con GPU limitada. Evaluar `@media (prefers-reduced-motion)`.

### Criterio para avanzar a Fase 2
- Análisis documentado completamente
- Decisiones de adaptación registradas en ADR
- Lista de dependencias adicionales confirmada (ninguna nueva preferiblemente)
- **Aprobación explícita del usuario requerida**

---

## FASE 2 — Sistema de tokens visuales (Design Tokens)

**Objetivo:** Implementar la nueva paleta forge/amber en `tailwind.config.ts` y `globals.css` sin romper ninguna clase existente. Estrategia de adición, no de sustitución.

**Estado:** ⏳ Pendiente

### Archivos a modificar

| Archivo | Tipo de cambio |
|---------|---------------|
| [`tailwind.config.ts`](tailwind.config.ts) | Agregar colores amber/forge, sombras glass, animaciones nuevas |
| [`app/globals.css`](app/globals.css) | Agregar layer `@layer components` con clases glass reutilizables |

### Tareas

- [ ] **2.1** Agregar tokens de color `amber-*` y `forge-*` en `tailwind.config.ts` (NO eliminar tokens existentes)
- [ ] **2.2** Agregar tokens `bg-forge`, `bg-forge-mid`, `bg-forge-high`, `bg-glass` (NO eliminar `bg-base`, `bg-surface`, `bg-elevated`)
- [ ] **2.3** Agregar tokens de texto `text-forge`, `text-forge-mid`, `text-forge-dim`
- [ ] **2.4** Agregar sombras `shadow-amber-sm`, `shadow-amber-md`, `shadow-amber-lg`, `shadow-forge`, `shadow-glass`, `shadow-vip`
- [ ] **2.5** Agregar keyframes `amberPulse`, `glassIn` sin eliminar los existentes
- [ ] **2.6** Agregar animaciones `amber-pulse`, `glass-in` en el bloque `animation`
- [ ] **2.7** En `globals.css`, agregar `@layer components` con clases CSS reutilizables: `.glass-card`, `.glass-card-active`, `.glass-input`, `.glass-modal`, `.ambient-amber`, `.sidebar-forge`
- [ ] **2.8** Agregar scrollbar con tono ámbar sutil (conservar la estructura CSS existente)
- [ ] **2.9** Ejecutar `npm run build` y verificar que TypeScript no reporta errores por los nuevos tokens
- [ ] **2.10** Verificar visualmente que las clases existentes no se rompieron (página de login, pizarra)

### Tokens que se agregan (NUNCA eliminar los existentes)

```typescript
// En tailwind.config.ts → theme.extend.colors
// NUEVO — Fondos forge
'bg-forge':      '#06080F',
'bg-forge-mid':  '#0A0C17',
'bg-forge-high': '#0E1120',
'bg-glass':      'rgba(14, 17, 32, 0.60)',  // nota: Tailwind 3 acepta rgba en config

// NUEVO — Acento ámbar
'amber-core':    '#F59E0B',
'amber-glow':    '#FBBF24',
'amber-deep':    '#D97706',
'amber-ghost':   'rgba(245, 158, 11, 0.08)',
'amber-border':  'rgba(245, 158, 11, 0.20)',
'amber-shine':   'rgba(245, 158, 11, 0.40)',

// NUEVO — Naranja forja
'forge-orange':  '#EA580C',
'forge-bright':  '#F97316',
'forge-ghost':   'rgba(234, 88, 12, 0.08)',

// NUEVO — Texto forge
'text-forge':     '#F5F0E8',
'text-forge-mid': '#A89880',
'text-forge-dim': '#5C4F3D',
```

```typescript
// En tailwind.config.ts → theme.extend.boxShadow — AGREGAR (no reemplazar)
'amber-sm':   '0 0 8px rgba(245, 158, 11, 0.25)',
'amber-md':   '0 0 16px rgba(245, 158, 11, 0.35), 0 0 32px rgba(245, 158, 11, 0.10)',
'amber-lg':   '0 0 24px rgba(245, 158, 11, 0.45), 0 0 48px rgba(245, 158, 11, 0.15)',
'forge':      '0 0 12px rgba(234, 88, 12, 0.35), 0 0 24px rgba(234, 88, 12, 0.10)',
'glass':      '0 8px 32px rgba(0, 0, 0, 0.60), inset 0 1px 0 rgba(255,255,255,0.04)',
'vip-amber':  '0 0 20px rgba(245, 158, 11, 0.60), 0 0 40px rgba(245, 158, 11, 0.20)',
```

### Clases CSS en globals.css

```css
/* AGREGAR en globals.css dentro de @layer components */
@layer components {
  .glass-card {
    background: rgba(14, 17, 32, 0.60);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(245, 158, 11, 0.20);
    box-shadow: 0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(245,158,11,0.08);
  }
  .glass-card-hover {
    border-color: rgba(245, 158, 11, 0.40);
    box-shadow: 0 4px 24px rgba(0,0,0,0.40), 0 0 20px rgba(245,158,11,0.12), inset 0 1px 0 rgba(245,158,11,0.15);
  }
  .glass-input {
    background: rgba(14, 17, 32, 0.50);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(245, 158, 11, 0.15);
  }
  .glass-modal {
    background: rgba(10, 12, 23, 0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(245, 158, 11, 0.20);
  }
  .glass-sidebar {
    background: linear-gradient(180deg, rgba(10,12,23,0.97) 0%, rgba(15,10,5,0.95) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .ambient-amber {
    position: relative;
  }
  .ambient-amber::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.05) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }
}
```

### Riesgos
- ⚠️ Tailwind v3 puede tener limitaciones con valores `rgba()` directos en el config — verificar en build.
- ⚠️ `backdrop-filter` requiere que el elemento padre NO tenga `overflow: hidden` sin gestionar la herencia. Verificar en Sidebar y Modales.
- ⚠️ `backdrop-filter` no funciona sin un contexto de stacking adecuado (z-index). Verificar en overlays móviles.

### Criterio para avanzar a Fase 3
- `npm run build` sin errores TypeScript
- Clases glass disponibles en DevTools del navegador
- Clases existentes (`bg-bg-surface`, `neon-blue`, etc.) siguen funcionando
- Scrollbar actualizada visible
- **Aprobación explícita del usuario requerida**

---

## FASE 3 — Rediseño de navegación (Sidebar + Navbar)

**Objetivo:** Aplicar glassmorphism con iluminación forge/amber al Sidebar y Navbar. Son los componentes de mayor impacto visual y los primeros que el usuario ve.

**Estado:** ⏳ Pendiente

### Archivos a modificar

| Archivo | Cambio principal |
|---------|----------------|
| [`components/layout/Sidebar.tsx`](components/layout/Sidebar.tsx) | Glass sidebar + ítem activo ámbar + pie usuario |
| [`components/layout/Navbar.tsx`](components/layout/Navbar.tsx) | Glass navbar + borde inferior ámbar |
| [`components/layout/DashboardShell.tsx`](components/layout/DashboardShell.tsx) | Fondo principal con gradiente forge sutil |

### Tareas

#### Sidebar.tsx
- [ ] **3.1** Reemplazar `bg-bg-surface` del `<aside>` por clase `glass-sidebar` (del globals.css)
- [ ] **3.2** Reemplazar `border-r border-white/6` por `border-r border-amber-border` (nuevo token)
- [ ] **3.3** Ítem activo: reemplazar `bg-neon-blue/8 border-neon-blue/20 text-neon-blue` por `bg-amber-ghost border-amber-border text-amber-glow shadow-amber-sm`
- [ ] **3.4** Ítem hover: reemplazar `hover:bg-white/3` por `hover:bg-amber-ghost/50 hover:text-text-forge`
- [ ] **3.5** Avatar en pie: reemplazar `bg-neon-blue/15 border-neon-blue/25 text-neon-blue` por `bg-amber-ghost border-amber-border text-amber-glow`
- [ ] **3.6** Botón colapsar: reemplazar `hover:text-neon-blue hover:border-neon-blue` por `hover:text-amber-glow hover:border-amber-deep`
- [ ] **3.7** Overlay móvil: conservar `bg-black/60 backdrop-blur-sm` (no cambiar)
- [ ] **3.8** Logo section: agregar borde inferior ámbar sutil `border-b border-amber-border/50`
- [ ] **3.9** Etiqueta "Navegación": cambiar `text-text-muted` por `text-text-forge-dim`
- [ ] **3.10** Agregar efecto ambient ámbar sutil como `::before` pseudo-elemento mediante clase CSS

#### Navbar.tsx
- [ ] **3.11** Leer el archivo actual y documentar clases existentes antes de modificar
- [ ] **3.12** Agregar `glass-sidebar` o `glass-card` como fondo del navbar
- [ ] **3.13** Borde inferior: cambiar `border-b border-white/6` por `border-b border-amber-border/30`
- [ ] **3.14** Nombre de usuario/logout: usar `text-text-forge` y `hover:text-amber-glow`

#### DashboardShell.tsx
- [ ] **3.15** Fondo del área de contenido principal: agregar gradiente forge muy sutil
- [ ] **3.16** Verificar que el layout mobile (drawer) sigue funcionando

### Verificaciones específicas post-Fase 3

```
[ ] Sidebar colapsa y expande correctamente en escritorio
[ ] Sidebar se abre como drawer en móvil (< 768px)
[ ] Overlay cierra el sidebar en móvil al hacer clic
[ ] Ítem activo tiene highlight ámbar visible
[ ] Hover de ítems tiene transición suave
[ ] Avatar muestra inicial del usuario correctamente
[ ] Logo Synapse visible en modo expandido y colapsado
[ ] Navbar muestra nombre de usuario y botón de logout
[ ] Backdrop-filter glass no se rompe en el sidebar colapsado
[ ] No hay regresiones en la lógica de roles (mismo menú por rol)
```

### Riesgos
- 🔴 **Alto:** El Sidebar tiene lógica de roles crítica (`SIDEBAR_ITEMS_BY_ROLE`). Solo modificar clases CSS, NUNCA la lógica de items.
- ⚠️ `backdrop-filter` en el sidebar puede crear artifacts visuales en Safari. Verificar con `-webkit-backdrop-filter`.

### Criterio para avanzar a Fase 4
- Sidebar y Navbar con estética glass/amber visualmente correcta
- Todas las verificaciones anteriores marcadas ✅
- `npm run build` sin errores
- **Aprobación explícita del usuario requerida**

---

## FASE 4 — Rediseño de tarjetas y contenedores

**Objetivo:** Aplicar glassmorphism a todas las tarjetas, paneles y contenedores del dashboard y vistas de detalle.

**Estado:** ⏳ Pendiente

### Componentes a intervenir
- `EquipmentDetail.tsx` — Ficha principal de equipo
- `components/auditoria/ModelKpiCards.tsx` — KPI cards
- `components/auditoria/StageGanttTimeline.tsx` — Gantt cards
- `app/(dashboard)/dashboard/page.tsx` — Métricas del dashboard
- `app/(dashboard)/estadisticas/page.tsx` — Cards de estadísticas

### Tareas

- [ ] **4.1** Aplicar clase `glass-card` a todas las tarjetas de sección en `EquipmentDetail.tsx`
- [ ] **4.2** Secciones colapsables de `EquipmentDetail`: usar `glass-card` en contenedor + borde ámbar en header
- [ ] **4.3** Badges de estado (servicio + repuestos) en cabecera de `EquipmentDetail`: conservar colores de estado, solo ajustar borde/fondo del badge container
- [ ] **4.4** Cards de métricas del dashboard: aplicar `glass-card` + valor numérico con `text-amber-glow` en metros relevantes (atrasados, urgentes)
- [ ] **4.5** KPI cards de auditoría (`ModelKpiCards`): `glass-card` + percentiles con colores semánticos conservados
- [ ] **4.6** Diagrama Gantt: fondo glass, barras con colores forge según etapa
- [ ] **4.7** Calculadora de pronóstico: `glass-card` + fecha proyectada con `text-amber-glow`
- [ ] **4.8** `DelayFactorsAudit`: tabla glass con filas hover amber
- [ ] **4.9** Cards de estadísticas (`estadisticas/page.tsx`): `glass-card` con hover `glass-card-hover`
- [ ] **4.10** Verificar que ningún contenedor con `overflow: hidden` rompe el `backdrop-filter`

### Patrón estándar de tarjeta glass

```tsx
// ANTES (patrón típico actual)
<div className="bg-bg-surface border border-white/10 rounded-xl p-4">

// DESPUÉS (patrón glass)
<div className="glass-card rounded-xl p-4 transition-standard hover:glass-card-hover">
```

> **Nota:** Si `glass-card` en globals.css no es suficiente para un caso específico, agregar las clases Tailwind inline equivalentes. No crear variantes CSS adicionales sin documentarlo en ADR.

### Riesgos
- ⚠️ `backdrop-filter` en tarjetas anidadas puede crear layering visual incorrecto. Verificar jerarquía de z-index.
- ⚠️ El contraste de texto sobre fondos glass debe verificarse — mínimo 4.5:1 WCAG AA.

### Criterio para avanzar a Fase 5
- Todas las tarjetas y paneles con estética glass consistente
- `npm run build` sin errores
- Contraste de texto verificado visualmente
- **Aprobación explícita del usuario requerida**

---

## FASE 5 — Rediseño de tablas

**Objetivo:** Transformar las tablas de datos a un estilo glass con filas translúcidas, hover ámbar y cabeceras sticky glass.

**Estado:** ⏳ Pendiente

### Archivos a modificar

| Archivo | Elemento |
|---------|----------|
| [`components/equipment/EquipmentTable.tsx`](components/equipment/EquipmentTable.tsx) | Tabla principal de equipos |
| [`components/admin/BrandModelManager.tsx`](components/admin/BrandModelManager.tsx) | Tabla marcas/modelos |
| [`components/admin/PartManager.tsx`](components/admin/PartManager.tsx) | Tabla repuestos |
| [`components/admin/TechnicianManager.tsx`](components/admin/TechnicianManager.tsx) | Tabla técnicos |
| [`components/admin/HolidayCalendarManager.tsx`](components/admin/HolidayCalendarManager.tsx) | Tabla feriados |
| [`components/auditoria/DelayFactorsAudit.tsx`](components/auditoria/DelayFactorsAudit.tsx) | Tabla factores retraso |
| [`app/(dashboard)/historial/page.tsx`](app/%28dashboard%29/historial/page.tsx) | Tabla historial de estados |

### Tareas

- [ ] **5.1** Definir patrón de tabla glass estándar
- [ ] **5.2** `EquipmentTable`: contenedor glass, `<thead>` sticky con `glass-sidebar`, filas con hover ámbar sutil
- [ ] **5.3** `EquipmentTable`: badge `parts_status` — conservar colores (`📦 Sin rep.`, `📦 Parcial`, `📦 Listo`), solo ajustar fondo del badge
- [ ] **5.4** `EquipmentTable`: badge VIP (⭐⭐⭐) — añadir `shadow-vip-amber` en nivel 3
- [ ] **5.5** `EquipmentTable`: botón QR — estilo `glass-card` pequeño con hover ámbar
- [ ] **5.6** Tablas de admin: patrón `glass-card` + filas alternadas con opacidad sutil
- [ ] **5.7** Paginación de `EquipmentTable`: botones glass con hover ámbar
- [ ] **5.8** Filtros de `EquipmentTable`: inputs `glass-input` con borde ámbar
- [ ] **5.9** Estado vacío (`EmptyState`): ícono con `text-amber-core/40`, texto `text-text-forge-mid`
- [ ] **5.10** Verificar que la paginación SWR sigue funcionando tras el rediseño

### Patrón estándar de tabla glass

```tsx
// Contenedor
<div className="glass-card rounded-xl overflow-hidden">
  <table className="w-full">
    {/* Cabecera */}
    <thead className="glass-sidebar border-b border-amber-border/30 sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-bold text-text-forge-mid uppercase tracking-widest">
          Columna
        </th>
      </tr>
    </thead>
    {/* Filas */}
    <tbody>
      <tr className="border-b border-white/5 hover:bg-amber-ghost/30 transition-standard cursor-pointer">
        <td className="px-4 py-3 text-sm text-text-forge">dato</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Riesgos
- ⚠️ La cabecera sticky con `backdrop-filter` requiere `isolation: isolate` en el contenedor padre para no crear artifacts.
- ⚠️ Las filas con hover deben mantener contraste suficiente para texto sobre ámbar ghost.

### Criterio para avanzar a Fase 6
- Todas las tablas con estética glass consistente
- Paginación funcional
- Filtros funcionales
- `npm run build` sin errores
- **Aprobación explícita del usuario requerida**

---

## FASE 6 — Rediseño de formularios y modales

**Objetivo:** Aplicar glassmorphism a todos los formularios, inputs, selects y modales del sistema. Es la fase de mayor riesgo porque los modales contienen lógica crítica de negocio.

**Estado:** ⏳ Pendiente

> **ADVERTENCIA:** Los modales de flujo (`Modal*.tsx`) solo pueden recibir cambios en clases CSS del wrapper exterior. La lógica interna de submit, validación Zod, fetch a API y manejo de estado es INTOCABLE.

### Tareas

#### Formularios e inputs
- [ ] **6.1** `EquipmentForm.tsx`: contenedor `glass-modal`, inputs `glass-input`, labels `text-amber-glow`, botones CTA con gradiente ámbar/forge
- [ ] **6.2** `EquipmentForm.tsx` (modo lote): tarjetas de equipo individual con `glass-card`, borde activo ámbar cuando están expandidas
- [ ] **6.3** `ClientSelector.tsx`: input `glass-input`, dropdown con `glass-modal` y filas hover ámbar
- [ ] **6.4** `BrandSelector.tsx`: mismo patrón que `ClientSelector`
- [ ] **6.5** `ModelSelector.tsx`: Radix Select con `glass-modal` en el popup
- [ ] **6.6** Inputs de perfil (`perfil/page.tsx`): `glass-input` con focus `border-amber-shine`
- [ ] **6.7** Todos los `<input>`, `<textarea>`, `<select>` nativos: aplicar `glass-input` o clases equivalentes

#### Modales de flujo (SOLO wrapper CSS)
- [ ] **6.8** `StatusChangeModal.tsx`: Radix Dialog `<DialogContent>` → aplicar `glass-modal` en el content wrapper. NO tocar lógica de `handleSubmit`, `onStatusChange`, estados.
- [ ] **6.9** `ModalInformeODP.tsx`: wrapper glass. NO tocar lógica de upload PDF ni Zod.
- [ ] **6.10** `ModalAprobacionVentas.tsx`: wrapper glass, tabla de repuestos con filas hover ámbar. NO tocar lógica de `approved_parts`.
- [ ] **6.11** `ModalEntregaLogistica.tsx`: wrapper glass. NO tocar lógica de solicitud de repuestos.
- [ ] **6.12** `ModalEntregaRepuestos.tsx`: wrapper glass, checkboxes con tono ámbar. NO tocar `deliver-parts`.
- [ ] **6.13** `ModalCulminadoODP.tsx`: wrapper glass. NO tocar lógica de correo culminado.
- [ ] **6.14** `ModalCoordinacionCliente.tsx`: wrapper glass, textarea `glass-input`. NO tocar lógica de correo.
- [ ] **6.15** `QRPrintModal.tsx`: SOLO el wrapper de Radix Dialog → `glass-modal`. NO tocar la previsualización QR ni el HTML del iframe de impresión.

#### Botones y acciones
- [ ] **6.16** Definir jerarquía de botones:
  - **Primario:** `bg-amber-core hover:bg-amber-glow text-bg-forge border border-amber-deep`
  - **Secundario:** `glass-input hover:border-amber-shine text-text-forge`
  - **Destructivo:** conservar rojo (`bg-error/10 border-error/30 text-error hover:bg-error/20`)
  - **Ghost:** `hover:bg-amber-ghost text-text-forge-mid hover:text-text-forge`
- [ ] **6.17** Aplicar jerarquía de botones consistentemente en todos los modales y formularios

### Verificaciones específicas post-Fase 6

```
[ ] Login funciona correctamente (username → Supabase Auth)
[ ] Crear equipo individual funciona (API POST /api/equipment/create)
[ ] Crear equipo en lote funciona (batch_id asignado)
[ ] Cambio de estado funciona en TODOS los estados del workflow
[ ] Upload de PDF (ModalInformeODP) funciona
[ ] Tabla de repuestos aprobados (ModalAprobacionVentas) funciona
[ ] Entrega de repuestos (ModalEntregaRepuestos) actualiza parts_status
[ ] Coordinación cliente envía correo (si RESEND_API_KEY está configurado)
[ ] Modal QR muestra previsualización y permite imprimir
[ ] Sonner toasts aparecen correctamente (posición, estilo)
```

### Riesgos
- 🔴 **Alto:** Radix UI Dialog aplica sus propias clases de fondo/overlay. Verificar que `glass-modal` se aplica al elemento correcto (`DialogContent`) y no al `DialogOverlay`.
- 🔴 **Alto:** El `glass-input` con `backdrop-filter` dentro de un modal (que ya tiene `backdrop-filter`) puede no funcionar si el stacking context no está correcto. Alternativa: usar `background: rgba()` sin `backdrop-filter` en inputs dentro de modales.
- ⚠️ Los inputs de Radix Select no son `<input>` nativos — requieren targeting con su API de className.

### Criterio para avanzar a Fase 7
- Todos los formularios y modales con estética glass consistente
- **TODAS** las verificaciones funcionales de la lista anterior marcadas ✅
- `npm run build` sin errores TypeScript
- **Aprobación explícita del usuario requerida**

---

## FASE 7 — Rediseño de la Pizarra (Kanban)

**Objetivo:** Transformar el tablero kanban en un espacio visual glassmorphism con columnas translúcidas y tarjetas de equipo con glow VIP ámbar.

**Estado:** ⏳ Pendiente

> **Componentes críticos:** `PizarraBoard.tsx` y `PizarraCard.tsx` tienen conexión directa con `useRealtimePizarra` (WebSocket). Solo modificar clases CSS, nunca el hook ni su lógica de suscripción.

### Archivos a modificar

| Archivo | Cambio principal |
|---------|----------------|
| [`components/pizarra/PizarraBoard.tsx`](components/pizarra/PizarraBoard.tsx) | Columnas glass con header ámbar |
| [`components/pizarra/PizarraCard.tsx`](components/pizarra/PizarraCard.tsx) | Tarjeta glass, glow VIP ámbar, chips repuestos |

### Tareas

#### PizarraBoard.tsx
- [ ] **7.1** Fondo del board: gradiente forge muy sutil como fondo de la página completa
- [ ] **7.2** Columnas: `glass-card` con header `glass-sidebar` y título con `text-amber-glow`
- [ ] **7.3** Contador de equipos por columna: badge `bg-amber-ghost border-amber-border text-amber-glow`
- [ ] **7.4** Scroll horizontal del board: scrollbar con tono ámbar
- [ ] **7.5** Estado vacío de columna: `EmptyState` con tono forge

#### PizarraCard.tsx
- [ ] **7.6** Tarjeta base: `glass-card` con `hover:glass-card-hover transition-standard`
- [ ] **7.7** Glow VIP nivel 1 (⭐): `shadow-amber-sm`
- [ ] **7.8** Glow VIP nivel 2 (⭐⭐): `shadow-amber-md`
- [ ] **7.9** Glow VIP nivel 3 (⭐⭐⭐): `shadow-vip-amber animate-amber-pulse`
- [ ] **7.10** FR number: `font-mono text-amber-glow`
- [ ] **7.11** Cliente: `text-text-forge`
- [ ] **7.12** Marca/modelo: `text-text-forge-mid`
- [ ] **7.13** Chip de repuestos (`📦 Parcial`, `📦 Listo`): conservar colores semánticos, solo ajustar borde/fondo del chip `glass-input`
- [ ] **7.14** Badge de días transcurridos: usar color semántico (`error` si atrasado, `warning` si próximo, `text-forge-mid` si normal)
- [ ] **7.15** Chip de técnico asignado: `bg-amber-ghost/30 text-text-forge-mid`

### Verificaciones específicas post-Fase 7

```
[ ] Pizarra carga correctamente en /pizarra
[ ] WebSocket Realtime conecta (sin errores en consola)
[ ] Cambios de estado se reflejan en tiempo real sin recargar
[ ] Equipos VIP tienen glow visible y proporcional a su nivel
[ ] Columnas muestran equipos agrupados correctamente por estado
[ ] Scroll horizontal funciona en escritorio y móvil
[ ] Tarjetas son clickeables y abren el detalle del equipo
[ ] Equipos atrasados siguen pulsando (animate-glow-pulse o animate-amber-pulse)
```

### Riesgos
- 🔴 **Alto:** `useRealtimePizarra` actualiza el estado con `setState`. Si se modifica el componente incorrectamente y cambia la clave del render, puede causar desubscripción del WebSocket. Solo modificar clases.
- ⚠️ El glow pulsante (`animate-amber-pulse`) en múltiples tarjetas puede ser costoso en GPU. Limitar a nivel VIP 3 únicamente.

### Criterio para avanzar a Fase 8
- Pizarra visualmente correcta con glassmorphism
- Todas las verificaciones funcionales marcadas ✅
- `npm run build` sin errores
- **Aprobación explícita del usuario requerida**

---

## FASE 8 — Rediseño de páginas públicas (QR)

**Objetivo:** Aplicar el estilo glass/forge a las páginas públicas accesibles por QR, manteniendo la responsividad móvil y sin requerir autenticación.

**Estado:** ⏳ Pendiente

> Las páginas públicas son accesibles sin login. No tienen Supabase Auth ni RLS. No tocar las APIs que consumen.

### Archivos a modificar

| Archivo | Descripción |
|---------|-------------|
| [`app/doc/[serial]/page.tsx`](app/doc/%5Bserial%5D/page.tsx) | Historial completo por número de serie |
| [`app/doc/fr/[fr]/page.tsx`](app/doc/fr/%5Bfr%5D/page.tsx) | Ficha de ingreso único por FR |

### Tareas

- [ ] **8.1** Fondo de ambas páginas: `bg-forge` con gradiente forge sutil
- [ ] **8.2** Header (logo + badge "Trazabilidad Verificada"): `glass-card` con borde ámbar
- [ ] **8.3** Tarjeta de identidad del equipo: `glass-card` con datos en `text-text-forge`
- [ ] **8.4** Sección del informe (botón PDF): botón primario ámbar si existe `report_url`
- [ ] **8.5** Historial de intervenciones (`[serial]`): lista cronológica con items `glass-card` y línea temporal ámbar
- [ ] **8.6** Aviso amarillo en `[fr]` (QR identifica solo ese ingreso): conservar el aviso pero con estilo `glass-card` y borde `warning`
- [ ] **8.7** Footer: `glass-sidebar` con texto `text-text-forge-dim`
- [ ] **8.8** Verificar responsividad en viewport 375px (iPhone SE) y 390px (iPhone 14)
- [ ] **8.9** Verificar que las rutas siguen sin requerir autenticación (testear en modo incógnito)
- [ ] **8.10** Verificar que logos `cabelab.png` (blanco) siguen visibles sobre fondos oscuros

### Riesgos
- ⚠️ Las páginas públicas no usan el layout del dashboard. Verificar que los estilos globales se aplican (importación de `globals.css` vía `app/layout.tsx`).
- ⚠️ El `backdrop-filter` puede no funcionar en algunos navegadores móviles. Tener fallback de `background` sólido.

### Criterio para avanzar a Fase 9
- Páginas públicas visualmente correctas en escritorio y móvil
- Accesibles sin autenticación (verificar en incógnito)
- APIs públicas responden correctamente
- **Aprobación explícita del usuario requerida**

---

## FASE 9 — Optimización responsive y accesibilidad

**Objetivo:** Verificar y corregir el comportamiento responsive en todos los breakpoints y asegurar estándares básicos de accesibilidad WCAG AA.

**Estado:** ⏳ Pendiente

### Breakpoints a verificar

| Breakpoint | Ancho | Dispositivo típico |
|-----------|-------|-------------------|
| `sm` | 640px | Tablet pequeña |
| `md` | 768px | Tablet — punto de quiebre Sidebar |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop estándar |
| `2xl` | 1536px | Desktop grande |
| Móvil | 375–430px | iPhone / Android |

### Tareas

#### Responsive
- [ ] **9.1** Verificar Sidebar drawer en `< 768px` (todos los roles)
- [ ] **9.2** Verificar `EquipmentTable` en móvil (scroll horizontal vs. stacking de columnas)
- [ ] **9.3** Verificar modales en móvil (deben ser full-screen o near-full-screen)
- [ ] **9.4** Verificar Pizarra en móvil (scroll horizontal de columnas)
- [ ] **9.5** Verificar `EquipmentForm` en lote en móvil
- [ ] **9.6** Verificar páginas públicas en 375px

#### Accesibilidad
- [ ] **9.7** Contraste de texto sobre glass — verificar ratio WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
- [ ] **9.8** Focus rings: inputs, botones y links deben tener `:focus-visible` con outline ámbar visible
- [ ] **9.9** Botones con solo ícono deben tener `aria-label`
- [ ] **9.10** Modales Radix Dialog: verificar que `aria-labelledby` y `aria-describedby` no se eliminaron
- [ ] **9.11** `@media (prefers-reduced-motion: reduce)`: desactivar `animate-amber-pulse` y `animate-glow-pulse`
- [ ] **9.12** Scrollbar personalizada: verificar que no bloquea contenido en móvil (no aplica en iOS)

### Comando de verificación rápida de contraste

```powershell
# No hay herramienta CLI automática — usar DevTools > Lighthouse > Accessibility
# O extensión axe DevTools en Chrome
# Criterio: puntaje Lighthouse Accesibilidad >= 85
```

### Riesgos
- ⚠️ El glassmorphism reduce el contraste de texto por naturaleza. Usar `text-text-forge` (#F5F0E8) sobre fondos glass para garantizar contraste.
- ⚠️ iOS Safari no siempre soporta `backdrop-filter` en todos los contextos. Verificar fallback.

### Criterio para avanzar a Fase 10
- Todos los breakpoints verificados sin regresiones de layout
- Contraste WCAG AA verificado en todos los textos principales
- Focus rings visibles en modo teclado
- `prefers-reduced-motion` implementado
- **Aprobación explícita del usuario requerida**

---

## FASE 10 — Pruebas funcionales y validación integral

**Objetivo:** Ejecutar un ciclo completo de pruebas funcionales cubriendo autenticación, permisos, workflow completo, APIs, Supabase Realtime y todos los flujos de negocio.

**Estado:** ⏳ Pendiente

> Esta fase no toca código. Es 100% pruebas manuales de regresión funcional.

### 10.1 Autenticación y middleware

```
[ ] Login con username válido → redirige a ROLE_HOME_ROUTE correcto
[ ] Login con username inválido → muestra error
[ ] Acceso a ruta protegida sin sesión → redirige a /login
[ ] Usuario con is_active=false → redirige a /login?error=no-aprobado
[ ] Refresh de página en dashboard → no aparece "Autenticando sesión..."
[ ] Logout → sesión borrada y redirige a /login
[ ] Cookies de sesión persisten en redirecciones (proxy.ts)
```

### 10.2 Permisos por rol

```
[ ] superadmin: accede a todas las rutas (incluye /admin/usuarios, /admin/workflow)
[ ] admin: accede a /dashboard, /pizarra, /equipos, /historial, /estadisticas, /auditoria-modelos, /dna
[ ] operaciones: accede a /equipos, /pizarra, /auditoria-modelos, /dna, /perfil
[ ] recepcion: accede a /equipos (crear/editar en estado inicial), /pizarra, /buscar, /auditoria-modelos, /dna
[ ] almacen: accede a /equipos (gestión repuestos), /pizarra, /buscar, /dna
[ ] visualizador: accede a /pizarra, /estadisticas, /auditoria-modelos, /equipos, /dna (solo lectura)
[ ] Sidebar muestra exactamente las rutas permitidas por rol (no más, no menos)
```

### 10.3 Flujo completo de workflow

```
[ ] Crear equipo individual → FR generado, correo de ingreso enviado (o warning si no hay RESEND)
[ ] Crear equipo en lote (2+ equipos) → batch_id asignado, correo consolidado
[ ] En espera de diagnóstico → En diagnóstico (sin correo)
[ ] En diagnóstico → Pendiente de aprobación (ModalInformeODP con PDF)
[ ] Pendiente de aprobación → Aprobado (ModalAprobacionVentas, approved_parts inicializado, parts_status=SIN_REPUESTOS)
[ ] Aprobado → En mantenimiento (sin bloqueo de repuestos)
[ ] En mantenimiento → Control de calidad
[ ] Control de calidad → Listo para entrega (ModalCulminadoODP)
[ ] Listo para entrega → Entregado (terminal)
[ ] Registrar entrega de repuestos (ModalEntregaRepuestos) → parts_status actualizado (PARCIAL/COMPLETO)
[ ] Override de estado (superadmin) con notificación opcional
[ ] Verificar status_history tiene entrada en cada cambio
```

### 10.4 APIs y base de datos

```
[ ] GET /api/equipment → lista paginada correcta
[ ] POST /api/equipment/create → equipo creado en BD
[ ] GET /api/equipment/[id] → detalle con next_states disponibles según rol
[ ] PATCH /api/equipment/[id] → actualización de campos
[ ] POST /api/equipment/[id]/update-status → cambio con validación de transición
[ ] POST /api/equipment/[id]/deliver-parts → actualización de parts_status
[ ] GET /api/equipment/export → descarga de Excel
[ ] GET /api/stats → métricas del dashboard
[ ] GET /api/stats/models → listado de modelos con métricas
[ ] GET /api/public/equipment/serial/[serial] → sin autenticación, datos correctos
[ ] GET /api/public/equipment/fr/[fr] → sin autenticación, datos correctos
[ ] GET /api/clients → lista de nombres únicos
[ ] GET /api/catalog/brands → listado de marcas
[ ] GET /api/users/technicians → lista de técnicos activos
```

### 10.5 Supabase Realtime (Pizarra)

```
[ ] Pizarra carga equipos al abrir /pizarra
[ ] Cambiar estado de un equipo en otra pestaña → Pizarra actualiza en tiempo real
[ ] Sin errores en consola relacionados con WebSocket
[ ] Reconexión automática si se pierde la conexión
```

### 10.6 Sistema QR

```
[ ] Equipo con serie válida → botón QR → modal con URL /doc/[serial]
[ ] Equipo sin serie (N/S, S/N, etc.) → botón QR → modal con URL /doc/fr/[fr]
[ ] Previsualización del QR visible con logo embebido
[ ] Impresión: abre diálogo del sistema, logo correcto
[ ] Página /doc/[serial] accesible sin login con datos correctos
[ ] Página /doc/fr/[fr] accesible sin login con datos correctos
[ ] report_url muestra botón de descarga PDF si existe
```

### 10.7 Módulo de auditoría y pronóstico

```
[ ] /auditoria-modelos carga lista de marcas
[ ] Selección de marca → carga modelos de esa marca
[ ] Selección de modelo → carga KPIs y Gantt
[ ] Calculadora proyecta fecha correctamente
[ ] Factores de retraso aparecen si hay datos históricos
```

### Criterio para avanzar a Fase 11
- **TODAS** las verificaciones funcionales marcadas ✅
- Cero errores críticos o bloqueantes
- Los errores menores están documentados en [Registro de incidencias](#21-registro-de-incidencias)
- **Aprobación explícita del usuario requerida**

---

## FASE 11 — Build de producción y rendimiento

**Objetivo:** Verificar que el proyecto compila correctamente para producción, que TypeScript no tiene errores, que el lint está limpio y que el rendimiento es aceptable.

**Estado:** ⏳ Pendiente

### Tareas

- [ ] **11.1** Ejecutar `npx tsc --noEmit` y resolver todos los errores TypeScript
- [ ] **11.2** Ejecutar `npm run build` y resolver todos los errores de compilación
- [ ] **11.3** Revisar warnings de build (especialmente `Image` de Next.js, `useEffect` deps, etc.)
- [ ] **11.4** Verificar que ningún componente rediseñado rompió el tree-shaking (sin imports innecesarios)
- [ ] **11.5** Medir rendimiento con Lighthouse en Chrome DevTools (modo incógnito, sin extensiones)
- [ ] **11.6** Verificar Core Web Vitals post-rediseño

### Comandos

```powershell
# 11.1 — TypeScript check
npx tsc --noEmit 2>&1

# 11.2 — Build completo
npm run build 2>&1

# 11.3 — Iniciar build de producción local
npm run start
# Luego abrir http://localhost:3000 y ejecutar Lighthouse
```

### Umbrales de rendimiento mínimos (Lighthouse)

| Métrica | Mínimo aceptable | Objetivo |
|---------|----------------|---------|
| Performance | ≥ 70 | ≥ 85 |
| Accessibility | ≥ 85 | ≥ 90 |
| Best Practices | ≥ 90 | ≥ 95 |
| LCP (Largest Contentful Paint) | < 3.0s | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.05 |
| FID / INP | < 200ms | < 100ms |

> **Nota sobre `backdrop-filter`:** El glassmorphism puede reducir el Performance score de Lighthouse en 5–15 puntos respecto al diseño anterior. Es esperado y aceptable si se mantiene sobre 70.

### Riesgos
- ⚠️ Si `backdrop-filter` se usa excesivamente (>20 elementos simultáneos), puede causar jank en dispositivos de gama baja. Limitar a componentes clave.
- ⚠️ Imágenes en `/public/` deben usar siempre el componente `<Image>` de Next.js para optimización automática.

### Criterio para avanzar a Fase 12
- `npx tsc --noEmit` sin errores
- `npm run build` exitoso sin errores
- Lighthouse Performance ≥ 70 en página principal del dashboard
- **Aprobación explícita del usuario requerida**

---

## FASE 12 — Revisión visual final y corrección de errores

**Objetivo:** Revisión holística de toda la interfaz en escritorio y móvil para detectar inconsistencias visuales, corregirlas y documentar el estado final.

**Estado:** ⏳ Pendiente

### Checklist de revisión visual por vista

```
/login
[ ] Fondo forge con gradiente
[ ] Formulario glass centrado
[ ] Logo Synapse/CABELAB visible
[ ] Input con borde ámbar en focus
[ ] Botón primario con color ámbar
[ ] Texto de autoría visible

/dashboard (admin+)
[ ] Métricas glass con valores legibles
[ ] Tabla paginada con estética glass
[ ] Sidebar glass con ítem activo ámbar

/pizarra (todos los roles)
[ ] Columnas glass con scroll horizontal
[ ] Tarjetas VIP con glow correcto
[ ] Chips de repuestos visibles
[ ] Realtime funcional

/equipos (roles permitidos)
[ ] Filtros glass funcionales
[ ] Tabla glass con hover ámbar
[ ] Badge VIP con estrellas
[ ] Badge parts_status correcto
[ ] Botón QR abre modal correcto

/equipos → detalle (EquipmentDetail)
[ ] Secciones colapsables glass
[ ] Badge dual (servicio + repuestos) en cabecera
[ ] Historial de estados glass
[ ] Botón edición para roles correctos
[ ] Botón de entrega de repuestos visible para almacen

/equipos → crear (EquipmentForm)
[ ] Formulario individual glass
[ ] Formulario lote con tarjetas glass
[ ] Selectors (brand, model, client) glass

/auditoria-modelos
[ ] Selector Marca→Modelo glass
[ ] KPI cards glass con percentiles
[ ] Gantt con colores forge
[ ] Calculadora glass funcional
[ ] Factores de retraso glass

/estadisticas
[ ] Cards glass con datos correctos

/dna
[ ] Timeline glass con historial

/historial
[ ] Tabla audit log glass

/buscar
[ ] Input glass, resultados glass

/admin/usuarios (superadmin)
[ ] Lista usuarios glass
[ ] Cambio de rol funcional

/admin/workflow (superadmin)
[ ] Editor visual glass

/admin/catalog (superadmin)
[ ] Gestión marcas/modelos glass

/perfil (todos)
[ ] Formulario perfil glass

/doc/[serial] (pública, móvil)
[ ] Responsiva en 375px
[ ] Sin autenticación requerida

/doc/fr/[fr] (pública, móvil)
[ ] Responsiva en 375px
[ ] Aviso amarillo visible

404 personalizado
[ ] Estética forge coherente
```

### Criterio para avanzar a Fase 13
- Todos los ítems del checklist revisados
- Errores encontrados documentados y corregidos
- Revisión en al menos 2 breakpoints (móvil + escritorio)
- **Aprobación explícita del usuario requerida**

---

## FASE 13 — Merge a main y criterios de aceptación final

**Objetivo:** Realizar el merge de la rama `feature/ui-redesign-glassmorphism` a `main` de forma segura, documentar el estado final y celebrar la entrega.

**Estado:** ⏳ Pendiente

### Tareas

- [ ] **13.1** Verificar que la rama está al día con `main` (sin conflictos)
- [ ] **13.2** Ejecutar build final en la rama `feature/ui-redesign-glassmorphism`
- [ ] **13.3** Ejecutar checklist funcional completo de Fase 10 (segunda pasada)
- [ ] **13.4** Crear PR (Pull Request) o merge directo según preferencia del usuario
- [ ] **13.5** Merge a `main`
- [ ] **13.6** Crear tag `v2.5-glassmorphism` en el commit de merge
- [ ] **13.7** Actualizar `PROJECT_CONTEXT.md` — sección "Estado actual" con el nuevo sistema visual
- [ ] **13.8** Actualizar número de versión en login y navbar si aplica (ej: `v2.5 → v3.0`)

### Comandos

```powershell
# 13.1 — Rebase sobre main para evitar conflictos
git fetch origin
git rebase origin/main

# 13.2 — Build final
npm run build

# 13.3 — Merge (una vez aprobado)
git checkout main
git merge feature/ui-redesign-glassmorphism --no-ff -m "feat: Premium Dark Glassmorphism UI redesign with Amber Forge ambience"

# 13.6 — Tag de release
git tag v2.5-glassmorphism
git push origin main --tags

# Limpiar rama
git branch -d feature/ui-redesign-glassmorphism
```

### Criterios finales de aceptación (TODOS deben cumplirse)

```
FUNCIONAL
[ ] Autenticación por username funciona para todos los roles
[ ] Workflow completo sin bloqueos (diagnóstico → entregado)
[ ] Desacoplamiento Servicio/Repuestos funcional
[ ] Realtime de Pizarra funciona
[ ] Sistema QR genera, previsualiza e imprime correctamente
[ ] Páginas públicas /doc/* accesibles sin login
[ ] Correos en hilo se envían si RESEND_API_KEY está configurado
[ ] Export Excel funcional
[ ] Módulo de auditoría y pronóstico funcional
[ ] Ingreso en lote funcional
[ ] DNA del equipo funcional
[ ] Roles y permisos aplicados correctamente en todas las vistas

TÉCNICO
[ ] npx tsc --noEmit → 0 errores
[ ] npm run build → exitoso sin errores
[ ] Lighthouse Performance ≥ 70
[ ] Lighthouse Accessibility ≥ 85

VISUAL
[ ] Glassmorphism consistente en todos los componentes rediseñados
[ ] Paleta amber/forge aplicada en navegación, tarjetas, tablas, formularios y modales
[ ] Glow VIP ámbar proporcional al nivel de prioridad
[ ] Responsividad correcta en móvil (375px+) y escritorio (1280px+)
[ ] No hay regresiones visuales en badges de estado (colors semánticos conservados)
[ ] Logos Synapse y CABELAB visibles y correctos
```

---

## 20. Registro de decisiones (ADR)

> Documentar aquí cada decisión arquitectónica o de diseño relevante tomada durante el proceso.

| ID | Fecha | Decisión | Alternativas consideradas | Razón |
|----|-------|----------|--------------------------|-------|
| ADR-001 | — | Estrategia de adición de tokens: AGREGAR nuevos tokens amber/forge sin eliminar los existentes para compatibilidad con badges de estado | Migración completa de paleta | Los colores `status-*` y semánticos están acoplados a la lógica de negocio (badges de equipos, estados de Supabase) y no deben cambiar |
| ADR-002 | — | `backdrop-filter` solo en elementos estructurales (sidebar, modales, columnas pizarra), NO en cada fila de tabla | Aplicar glass a todas las filas | Rendimiento: `backdrop-filter` en >50 elementos simultáneos puede causar jank en GPU |
| ADR-003 | — | Usar `@layer components` en `globals.css` para clases glass reutilizables en lugar de crear nuevos componentes React | Componentes React `GlassCard` | Menor footprint de código, aplicable directamente con Tailwind, sin cambiar la arquitectura de componentes |
| ADR-004 | — | — | — | — |
| ADR-005 | — | — | — | — |

---

## 21. Registro de incidencias

> Documentar errores, bugs y problemas encontrados durante el proceso de rediseño.

| ID | Fase | Descripción | Archivo | Estado | Solución aplicada |
|----|------|-------------|---------|--------|-------------------|
| INC-001 | — | — | — | — | — |

---

## 22. Referencias y enlaces oficiales

### Proyecto CABELAB / SYNAPSE
- **Repositorio:** `C:\Users\gorti\Desktop\System-welding-machine-service`
- **Contexto técnico completo:** [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- **Rama de trabajo:** `feature/ui-redesign-glassmorphism`

### Tecnologías del proyecto
- [Next.js 16 Docs](https://nextjs.org/docs) — leer siempre `node_modules/next/dist/docs/` para esta versión específica
- [Tailwind CSS v3 Docs](https://v3.tailwindcss.com/docs) — **v3, no v4**
- [Tailwind CSS — backdrop-filter](https://v3.tailwindcss.com/docs/backdrop-filter)
- [Radix UI — Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix UI — Select](https://www.radix-ui.com/primitives/docs/components/select)
- [Supabase JS — Auth](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Supabase — Realtime](https://supabase.com/docs/guides/realtime)
- [Lucide React v1](https://lucide.dev/guide/packages/lucide-react)
- [Sonner — Toasts](https://sonner.emilkowal.ski/)
- [SWR v2](https://swr.vercel.app/docs/getting-started)
- [React Hook Form v7](https://react-hook-form.com/docs)
- [Zod v4](https://zod.dev/)
- [qrcode.react v4](https://github.com/zpao/qrcode.react)
- [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge)

### Referencia de diseño
- **Repositorio de referencia Glassmorphism:** _(URL a completar por el usuario en Fase 1)_
- [CSS backdrop-filter — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Glassmorphism.com — Generador de referencia](https://glassmorphism.com/)
- [WCAG 2.1 — Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Herramientas de desarrollo
- [Lighthouse en Chrome DevTools](https://developer.chrome.com/docs/lighthouse/)
- [axe DevTools — Accessibility](https://www.deque.com/axe/devtools/)

---

*Documento generado el 2026-10-14 para SYNAPSE v2.5 — CABELAB.*  
*Mantenido por Antigravity durante todo el proceso de rediseño.*  
*Br. Gersson Ortiz — Arequipa, Perú.*
