# Plan Tecnico - Mascota Caminante Autonoma Cyber Dragon (Shimeji SYNAPSE)
- Execution ID: PET-SHIMEJI-002
- Iteracion: 2
- Estado: READY_FOR_APPROVAL
- Proyecto / stack: Next.js 16 (App Router), TypeScript, Tailwind CSS, SWR, Lucide React
- Rama y HEAD observados: develop/setup-dev-envorinment
- Riesgo: BAJO

## 1. Objetivo y criterios de aceptacion
- **Objetivo**: Transformar el concepto de widget estatico en una mascota caminante autonoma interactiva (estilo Shimeji / Desktop Pet virtual) inspirada en un Dragon Negro tipo Chimuelo (Toothless) en Pixel Art, que recorre la pantalla del Dashboard de SYNAPSE realizando travesuras de taller mecanico/soldadura sin interferir con la operacion del usuario.
- **Criterios medibles**:
  1. **Concepto & Estetica Visual**:
     - Sprite Pixel Art puro (renderizado con SVG crispEdges / pixelated o matriz pixel CSS 32x32) con paleta Chimuelo (cuerpo negro obsidiana/grafito #12141a, ojos esmeralda/neon #10b981, destellos de arco electrico #00D2FF).
     - Orientacion dinamica: el dragon gira (flip horizontal) segun la direccion en la que camina.
  2. **Movimiento Autonomo y Fisicas Ligeras**:
     - Deambula libremente por el margen inferior de la pantalla o saltitos entre zonas libres.
     - Deteccion de limites de pantalla (rebote o cambio de direccion al llegar a los bordes laterales del viewport).
     - Comportamiento de gravedad simulada: si el usuario lo arrastra y lo suelta en el aire, cae con animacion de planeo/pataleo hasta el suelo.
  3. **Travesuras y Estados Aleatorios (Behavior State Machine)**:
     - **Caminar (Walking)**: Ciclo de pasos pausados con movimiento de colita y alas plegadas.
     - **Curioso / Alerta (Curious)**: Se detiene, ladea la cabeza o mira hacia el cursor si pasa cerca.
     - **Chispita de Plasma (Welding Spark)**: Escupe una chispita de arco electrico, se asusta y da un brinco hacia atras.
     - **Pescadito Tostado (Roasted Snack)**: Saca un pescadito en pixel art y le da un toque con una llamarada de soldadura.
     - **Tropezar / Rodar (Tumble Roll)**: Da una voltereta traviesa en el suelo y se sacude el polvo.
     - **Siesta (Sleeping / Zzz)**: Entra en sueno tras inactividad prolongada con particulas 'Zzz' ascendentes.
     - **Dialogos espontaneos**: Burbujitas flotantes micro-dialogo con tips y estado del taller ("¡Esa maquina lleva mas de 5 dias en espera!", "¿Donde deje mis electrodos 7018?", "¡Huele a plasma fresco!").
  4. **Interaccion Directa del Usuario**:
     - **Click / Tap**: Brinca emocionado, emite destellos de chispas o reacciona con un dialogo jugueton.
     - **Drag & Drop**: Puede ser agarrado con el cursor (cambio a cursor-grab / cursor-grabbing) y soltado en cualquier posicion horizontal.
  5. **Controles de Usuario y Persistencia**:
     - Toggle rapido y discreto en Navbar.tsx con icono de dragon/mascota para alternar visibilidad (ON / OFF / Cueva).
     - Menu contextual sutil o boton rapido al hacer click secundario / click en mascota: opcion de Poner a dormir o Enviar a su cueva.
     - Persistencia del estado (activo/inactivo, dormido) en localStorage con clave synapse_dragon_pet.
  6. **Aislamiento, Rendimiento y Seguridad**:
     - Lienzo en pointer-events-none con pointer-events-auto exclusivo para la capsula del dragon (garantiza cero obstruccion de clicks en botones, tablas, selects o modales del dashboard).
     - Animaciones y bucle de fisicas optimizados con requestAnimationFrame o temporizadores con pausas automaticas cuando la pestana esta oculta (document.visibilityState).
     - Cero dependencias binarias externas pesadas (sprites generados en SVG nativo reactivo).
     - Cero cambios en BD ni en la logica de inventario o equipos.

## 2. Contexto verificado
- **Hechos observados**:
  - components/layout/DashboardShell.tsx envuelve todo el Dashboard con un contenedor relative overflow-hidden y ya contiene capas graficas de fondo flotantes en pointer-events-none.
  - components/layout/Navbar.tsx tiene un contenedor superior tipo capsula (vision-sidebar-capsule) con espacio en la seccion derecha junto al indicador de usuario y boton salir, ideal para alojar el boton toggle de la mascota.
  - hooks/useEquipmentList.ts provee useDashboardStats() (SWR), que permite que la mascota conozca equipos activos y retrasados sin generar trafico adicional.
- **Convenciones**:
  - React 19 / Next.js 16 con directiva 'use client' en componentes interactivos.
  - Paleta de diseno: Tailwind tokens amber-core (#00D2FF), bg-forge, slate-800, con efectos glassmorphism.
- **Supuestos e incertidumbres**:
  - El dragon se mantendra prioritariamente patrullando la franja inferior sobre el borde de la pantalla (y por encima de cualquier scroll), pero su posicion x e y pueden variar mediante arrastre del usuario.

## 3. Enfoque recomendado
- **Solucion**:
  - Estructurar el modulo completo bajo components/dashboard/pet/:
    1. types.ts: Tipos de estado (DragonAction: 'idle' | 'walk' | 'spark' | 'snack' | 'tumble' | 'sleep' | 'drag' | 'fall', coordenadas, direccion, preferencias).
    2. PixelToothlessDragon.tsx: Renderizador SVG pixel-art de Chimuelo con frames de animacion (ojos verdes reactivos, alas, patitas, chispas de soldadura y accesorios temporales como el pescadito).
    3. useDragonAI.ts: Hook que gestiona el bucle de comportamiento, fisicas (gravedad al soltar), temporizadores de travesuras, deteccion de bordes de pantalla y drag-and-drop.
    4. DragonSpeechBubble.tsx: Burbuja de dialogo en pixel-cyber que emerge sobre la mascota para travesuras, avisos del taller o clicks.
    5. DragonPetOverlay.tsx: Contenedor principal que se renderiza en DashboardShell.tsx, gestionando pointer-events-none global, el estado de persistencia (localStorage) y la lectura no intrusiva de useDashboardStats().
    6. DragonToggleNavbar.tsx: Boton compacto de control en Navbar.tsx con tooltip y selector rapido (Activo / Dormir / Cueva).
  - Justificacion:
    - Este diseno Shimeji desacoplado es completamente seguro: la aplicacion de taller continua funcionando al 100% sin ningun bloqueo de eventos de mouse en el resto de la interfaz.
    - SVG en codigo puro no tiene riesgo de fallos por carga de imagenes externas, ofrece nitidez infinita en pantallas Retina/4K y pesa menos de 8 KB.

## 4. Alcance
### Incluido
- Modulo integral components/dashboard/pet/ con animacion pixel-art de Chimuelo, sistema de travesuras, fisica de arrastre y caida, y globos de dialogo contextuales.
- Integracion no bloqueante en DashboardShell.tsx.
- Boton de control en Navbar.tsx con persistencia en localStorage.
- Reacciones a estadisticas del taller (alertas simpaticas sobre maquinas retrasadas y activas).
### Excluido
- Modificaciones en esquemas de PostgreSQL o Supabase.
- Modificaciones en endpoints de backend o APIs.
- Librerias pesadas de videojuegos (como Phaser o Three.js); se utiliza React + SVG + CSS.

## 5. Plan paso a paso
| ID | Accion | Archivos esperados | Dependencias | Verificacion | Riesgo |
|---|---|---|---|---|---|
| 1 | Definir tipos y constantes de estados y travesuras de la mascota | components/dashboard/pet/types.ts | Ninguna | Typescript compila sin errores | BAJO |
| 2 | Crear generador de sprites SVG pixel-art de Dragon Negro (Toothless) con estados | components/dashboard/pet/PixelToothlessDragon.tsx | Paso 1 | Renderizado nitido pixel-art de caminar, idle, dormir, chispas, pescadito | BAJO |
| 3 | Desarrollar motor de movimiento, travesuras y fisica drag & drop (Hook AI) | components/dashboard/pet/useDragonAI.ts | Pasos 1, 2 | Movimiento horizontal suave, rebote en bordes, gravedad al soltar | BAJO |
| 4 | Crear componente de globos de dialogo y chispas flotantes | components/dashboard/pet/DragonSpeechBubble.tsx | Paso 1 | Burbuja pixel estilizada con animacion de aparicion y autocierre | BAJO |
| 5 | Crear contenedor interactivo Shimeji con proteccion de puntero | components/dashboard/pet/DragonPetOverlay.tsx | Pasos 1, 2, 3, 4 | Canvas pointer-events-none, interaccion solo en mascota, persistencia localStorage | BAJO |
| 6 | Integrar control de estado en Navbar y montaje en DashboardShell | components/layout/DashboardShell.tsx, components/layout/Navbar.tsx, components/dashboard/pet/DragonToggleNavbar.tsx | Paso 5 | Dragon deambula en el dashboard, boton en Navbar permite apagarlo o mandarlo a dormir | BAJO |
| 7 | Verificacion de rendimiento, responsiveness y compilacion | Todo el workspace | Pasos 1-6 | npm run build exitoso, cero impacto en uso de CPU y modales del sistema | BAJO |

## 6. Pruebas y validacion
- **Prueba de No Obstruccion UX**: Hacer click en botones de la tabla, cards y modales directamente a traves del area de paseo de la mascota; verificar que ningun clic sea interceptado salvo cuando se interactua directamente con el cuerpo del dragon.
- **Fisica y Drag & Drop**: Arrastrar al dragon a la parte superior de la pantalla y soltarlo; verificar caida con gravedad y restablecimiento a estado caminando/idle al llegar a la base.
- **Travesuras**: Verificar transiciones aleatorias entre chispitas de soldadura, tostar pescadito, voltereta y siesta al dejarlo inactivo por 15-20 segundos.
- **Persistencia**: Desactivar la mascota desde el Navbar, recargar la pagina (F5) y comprobar que permanece oculta hasta volver a activarla.
- **Compilacion & Lint**: Ejecutar npm run build para garantizar cero advertencias de TypeScript o Next.js 16.

## 7. Riesgos y mitigaciones
| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Obstruccion accidental de clicks en botones o formularios del taller | Baja | Alto | Contenedor principal con pointer-events-none estricto. Solo el elemento de colision del dragon tiene pointer-events-auto. |
| Alto uso de CPU por bucle continuo de movimiento | Media | Medio | Usar delta-time en requestAnimationFrame con velocidad moderada (30-60 px/s), pausar cuando la pestana este en segundo plano (visibilitychange) o cuando este durmiendo. |
| Incompatibilidad SSR con coordenadas o localStorage | Media | Bajo | Montar el ciclo tras useEffect con bandera isMounted y limites calculados a partir de window.innerWidth. |
| Comportamiento extrano en pantallas moviles estrechas | Baja | Bajo | Ocultar automaticamente o restringir a una esquina reducida en pantallas menores a 768px (md breakpoint). |

## 8. Permisos y puntos de aprobacion
- **Dependencias**: Ninguna nueva dependencia requerida (Tailwind CSS, React, Lucide-react nativos).
- **Migraciones**: Ninguna.
- **Operaciones destructivas**: Ninguna.
- **Cambios de seguridad**: Ninguno.

## 9. Reversion / recuperacion
- Retirar la llamada <DragonPetOverlay /> en DashboardShell.tsx y el boton <DragonToggleNavbar /> en Navbar.tsx.
- La remocion es completamente limpia, aislada y reversible en menos de 1 minuto sin afectar el funcionamiento del sistema.

## 10. Manifiesto breve
- **Pasos**: 7 pasos modulares.
- **Archivos clave**:
  - components/dashboard/pet/types.ts
  - components/dashboard/pet/PixelToothlessDragon.tsx
  - components/dashboard/pet/useDragonAI.ts
  - components/dashboard/pet/DragonSpeechBubble.tsx
  - components/dashboard/pet/DragonPetOverlay.tsx
  - components/dashboard/pet/DragonToggleNavbar.tsx
  - components/layout/DashboardShell.tsx
  - components/layout/Navbar.tsx
- **Riesgo**: BAJO.
- **Bloqueos**: Ninguno. Plan listo para revision y aprobacion.
