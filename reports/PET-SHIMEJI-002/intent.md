# INTENT MANIFEST
**Execution ID:** `PET-SHIMEJI-002`  
**Fecha:** 2026-10-31  
**Autorización:** Aprobado por el usuario (`implementalo`)  
**Riesgo Inicial:** BAJO  

## 1. Objetivo Central
Implementar una mascota interactiva autónoma (Desktop Pet / Shimeji virtual) de un dragón negro (tipo Chimuelo / Toothless) en Pixel Art SVG puro para el Dashboard de SYNAPSE, con paseos autónomos, físicas ligeras de arrastre (drag & drop), máquina de travesuras de taller (chispas de soldadura, pescadito asado, tropezón, siesta, avisos de máquinas retrasadas), protección de clicks en UI (`pointer-events-none`), y un toggle en la Navbar con persistencia en `localStorage`.

## 2. Criterios de Aceptación
1. Renderizado pixel-art en SVG vectorial nativo sin dependencias pesadas.
2. Movimiento autónomo horizontal con rebote en bordes y volteo de sprite según dirección.
3. Arrastre con el ratón (`drag & drop`) y caída suave hasta el suelo.
4. Travesuras aleatorias: chispita y susto, pescadito tostado, voltereta, siesta Zzz y globos de texto contextuales con estadísticas del taller.
5. `pointer-events-none` en el contenedor para no bloquear clicks en la interfaz de trabajo.
6. Toggle en Navbar (`Activo` / `Dormido` / `Desactivado`) con persistencia en `localStorage`.
7. `npm run build` y `npx tsc --noEmit` completados exitosamente.
