# CONTEXTO GENERAL — CABELAB v2.3
> Sistema de gestión y seguimiento operativo en tiempo real para mantenimiento de motosoldadoras.

## 1. Visión y Propósito
CABELAB v2.3 es una plataforma integral diseñada para digitalizar y automatizar el flujo de trabajo del taller. Su objetivo principal es eliminar la recarga manual de datos y proporcionar visibilidad total mediante una **Pizarra Virtual** sincronizada en tiempo real.

## 2. Stack Tecnológico (Core)
*   **Framework:** Next.js 16.2.7 (App Router).
*   **Lenguaje:** TypeScript (Tipado estricto para modelos de Equipos y Roles).
*   **Base de Datos:** PostgreSQL (vía Supabase).
*   **Autenticación:** Supabase Auth optimizado para **Login por Nombre de Usuario**.
*   **Seguridad:** Row Level Security (RLS) a nivel de base de datos.
*   **Estado y Realtime:** SWR + Supabase Realtime (WebSockets).
*   **Estilos:** Tailwind CSS (Arquitectura industrial/neón).
*   **Iconografía:** Lucide React (vía `lucide-react`).

## 3. Arquitectura del Workflow Engine
*   **Motor Dinámico:** Los estados y transiciones se definen en tablas (`workflow_states`, `workflow_transitions`).
*   **Workflow Simplificado (v2.3):** Se han eliminado estados intermedios redundantes como "Repuesto Entregado". El flujo ahora permite transiciones directas desde espera de repuestos hacia diagnóstico o mantenimiento según la fase del equipo, agilizando la operación.
*   **Control Total (Superadmin):** Capacidad de editar manualmente cualquier timestamp operativo (ingreso, diagnóstico, mantenimiento, fases) para corregir desviaciones en KPIs.

## 4. Catálogo Técnico e Inteligencia
*   **Catálogo Maestro de Repuestos:** Base de datos centralizada de piezas con códigos únicos y especificaciones técnicas.
*   **Motor de Compatibilidad:** Relación inteligente entre repuestos y modelos de máquinas.
*   **Normalización de Activos:** Registro controlado de Marcas y Modelos para evitar errores de escritura y duplicidad.

## 5. Gestión de Clientes, Marcas y UI (v2.3)
*   **Selectores Inteligentes:** Implementación de componentes `ClientSelector` y `BrandSelector` con búsqueda predictiva.
*   **Auto-Registro de Catálogo:** Al registrar un equipo con una marca nueva, el sistema la inserta automáticamente en el catálogo maestro.
*   **UI Sólida (Anti-Transparencia):** Interfaz optimizada con fondos sólidos (`bg-bg-elevated`) en todos los desplegables, filtros, buscadores y modales para garantizar máxima legibilidad y contraste.
*   **Pizarra Limpia:** Sección de coordinación con fondos opacos y eliminación de alertas redundantes.

## 6. Roles y Autenticación
*   **Login Transparente:** Los usuarios entran con su nombre de usuario. Internamente se gestiona un correo virtual (`usuario@cabelab.local`).
*   **Superadmin (Venllas):** Gestión total de usuarios, workflow y catálogo.

## 7. Reglas de Negocio Críticas
1.  **DNA del Equipo (Lifecycle History):** Trazabilidad completa por **Número de Serie** para ver todas las intervenciones históricas.
2.  **Sistema de Prioridad VIP (Niveles 1-3):** Tres niveles de urgencia (⭐, ⭐⭐, ⭐⭐⭐) con efecto **Glow Pulsante** y ordenamiento superior absoluto en la pizarra.
3.  **Análisis por Empresa:** Dashboard estadístico profundo que desglosa marcas preferentes y modelos recurrentes por cliente.
4.  **Buscador Inteligente:** Sistema de búsqueda optimizado para localización instantánea por FR, Cliente o Serie.
5.  **Audit Log:** Registro inmutable de cada cambio de estado en `status_history`.
6.  **Timestamps Operativos:** Seguimiento automático de tiempos por fase (Ingreso, Evaluación, Aprobación, Entrega).
