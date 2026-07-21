# Estado del Proyecto — CABELAB v2.0
> Notas para continuar el desarrollo tras la sesión del 16 de junio de 2026.

## 1. Contexto Actual
El proyecto se encuentra en un estado funcional avanzado de la v2.3, enfocado en la mejora de la experiencia de usuario (UI), la automatización del catálogo y la implementación de un sistema de prioridades VIP multinivel.

## 2. Últimos Cambios Implementados
- **UI Pulida:** Eliminación de transparencias en todos los selectores, filtros y formularios (fondos sólidos `bg-bg-elevated`).
- **Sistema VIP (3 niveles):**
    - Implementación de prioridades 1, 2 y 3 (visualizadas con estrellas ⭐).
    - Lógica de ordenamiento prioritario (VIP 3 > VIP 2 > VIP 1 > Regular).
- **Catálogo de Marcas Automatizado:**
    - Nuevo componente `BrandSelector`.
    - Auto-registro de marcas: Si una marca es nueva, se guarda automáticamente en `catalog_brands` al crear un equipo.
- **Limpieza de Interfaz:** Remoción de avisos de "ATRASADO" en las tarjetas de la pizarra para reducir ruido visual.
- **Corrección de Build:** Refactorización de `lib/mail/mailer.ts` para evitar fallos de compilación si `RESEND_API_KEY` está ausente durante el build.

## 3. Acción Pendiente Inmediata
- **Ejecución de Migración SQL:** Para que los equipos aparezcan correctamente en la pizarra (y el sistema reconozca la columna `priority_level`), es necesario ejecutar el script `supabase/migrations/011_vip_priorities.sql` en el SQL Editor de Supabase.

## 4. Próximos Pasos (Hoja de Ruta)
- Verificar el despliegue tras la migración.
- Monitorear el comportamiento de `useRealtimePizarra` para asegurar que el ordenamiento en el cliente sea correcto.
- [ ] Implementar notificaciones automáticas (Resend) una vez configurada la clave de API.
- [ ] API Pública de Seguimiento (según el ROADMAP).
- [ ] Portal de Cliente (Vista restringida).
