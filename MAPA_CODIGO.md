# MAPA DEL CÓDIGO — CABELAB v2.0
> Guía de navegación técnica actualizada tras la implementación de DNA, estadísticas por empresa, controles de Superadmin y el nuevo Selector de Clientes.
## 1. Directorio Raíz y API
*   `/app/(auth)`: Gestión de login con correos virtuales `@cabelab.local`.
*   `/app/api/clients`: Endpoint para obtener nombres únicos de clientes.
*   `/app/api/catalog/brands`: **[NUEVO]** Endpoint para obtener marcas del catálogo maestro.
*   `/app/api/equipment/[id]/update`: Endpoint maestro de actualización. Permite a Superadmins editar todos los campos, incluyendo timestamps operativos y niveles VIP.
*   `/app/api/equipment/serial/[serial]`: API para el módulo DNA. Recupera el historial clínico completo de una máquina por su número de serie único.

## 2. Componentes de UI (`/components`)
*   `admin/BrandModelManager.tsx`: Gestión normalizada de Marcas y Modelos.
*   `admin/PartManager.tsx`: Editor de repuestos con selector de compatibilidad múltiple.
*   `equipment/ClientSelector.tsx`: Componente de búsqueda y registro de clientes con UI sólida.
*   `equipment/BrandSelector.tsx`: **[NUEVO]** Componente para selección y registro automático de marcas en el catálogo.
*   `equipment/EquipmentDetail.tsx`: Ficha detallada con selector de **Niveles VIP (1-3)** y edición de timestamps.
*   `equipment/EquipmentForm.tsx`: Formulario de registro (integra `ClientSelector`, `BrandSelector` y Selector VIP).
*   `equipment/EquipmentTable.tsx`: Lista general optimizada con indicadores de prioridad multinivel.
*   `pizarra/PizarraBoard.tsx`: Tablero Realtime con ordenamiento dinámico por nivel de prioridad.
*   `pizarra/PizarraCard.tsx`: Tarjetas compactas con estrellas VIP y efectos visuales de urgencia.

## 3. Lógica y Validación (`/lib`)
...
## 5. Base de Datos y Vistas
*   `supabase/migrations`: Historial de cambios en el esquema de la base de datos (001 al 012).
*   `011_vip_priorities.sql`: Migración que implementa la columna `priority_level` y actualiza la vista `equipment_with_status`.
*   `012_seed_major_brands.sql`: **[NUEVO]** Seed de marcas principales (ESAB, MILLER, LINCOLN, etc.) para el catálogo automático.
*   `equipment_with_status`: Vista central que expone todos los metadatos operativos, incluyendo el nuevo `priority_level`.

## 4. Hooks y Estado (`/hooks`)
*   `useRealtimePizarra.ts`: Hook central para sincronización vía WebSockets y agrupamiento por estados.
*   `useEquipmentList.ts`: Hooks personalizados para fetching de equipos y estadísticas del dashboard.

## 5. Base de Datos y Vistas
*   `supabase/migrations`: Historial de cambios en el esquema de la base de datos (001 al 010).
*   `equipment_with_status`: Vista central que expone todos los metadatos operativos, calculando:
    *   `days_elapsed`: Tiempo total en taller.
    *   `phase_1_days`, `phase_2_days`, `phase_3_days`: Hitos operativos automáticos.
    *   `assigned_technicians`: Personal asignado vía tabla `technicians`.

## 6. Dependencias Clave
*   `lucide-react`: Sistema de iconos para la interfaz neón.
*   `react-hook-form` + `@hookform/resolvers`: Manejo avanzado de formularios.
*   `sonner`: Sistema de notificaciones (Toasts).
*   `swr`: Mutación y re-validación de datos en el cliente.
