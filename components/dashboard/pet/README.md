# Sparky — actualización de comportamiento

## Archivos incluidos

- `types.ts`: añade los estados `look`, `sit` y `fly`.
- `useDragonAI.ts`: locomoción autónoma con recorridos de duración variable, pausas, cambios de dirección espontáneos y selección aleatoria de acciones.
- `PixelToothlessDragon.tsx`: animaciones SVG/CSS de respiración, cola, alas, reposo y vuelo.

## Instalación

Reemplaza los tres archivos existentes en:

`components/dashboard/pet/`

No es necesario modificar `DragonPetOverlay`, `DragonSpeechBubble`, `DashboardShell` ni `Navbar`: se conserva la API pública del hook (`action`, `direction`, `coords`, `frameStep`, `isBlinking`, `isDragging`, `handleDragStart`, `triggerPoke`, `preference`, `updatePreference`).

## Comportamiento

- Camina en trayectos de aproximadamente 3.2 a 7.6 segundos.
- Puede cambiar de dirección a mitad del trayecto, además de girar al llegar a los límites.
- Intercala pausas, observación, descanso sentado, chispas, snack, volteretas y aleteos.
- Los intervalos y duraciones son variables para evitar un patrón repetitivo.
- Conserva las preferencias `active`, `sleep` y `hidden`, y la clave `synapse_dragon_pet`.

## Verificación recomendada

1. Ejecuta `npm run lint` o el comando equivalente del proyecto.
2. Ejecuta `npm run build`.
3. En el dashboard, observa a Sparky durante 1–2 minutos para comprobar la variedad de acciones.
4. Prueba arrastrarlo, soltarlo desde cierta altura y cambiar entre Activo / Siesta / Cueva.
5. Comprueba que los botones y formularios del dashboard siguen recibiendo clics.

La actualización está preparada a partir de los tres archivos proporcionados. No he podido ejecutar el build de tu proyecto porque no se proporcionó el repositorio ni su entorno de dependencias.
