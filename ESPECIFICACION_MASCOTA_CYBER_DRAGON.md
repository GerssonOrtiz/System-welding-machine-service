# ESPECIFICACIÓN TÉCNICA Y GUÍA DE EXTENSIÓN — MASCOTA SHIMEJI CYBER DRAGON (SYNAPSE)

> **Documento de Arquitectura y Roadmap:** Diseñado para entender, mantener y ampliar la mascota interactiva del Dashboard de SYNAPSE en futuras iteraciones.

---

## 1. IDENTIDAD Y CONCEPTO

- **Nombre:** Sparky / Chimuelo Cyber-Dragon.
- **Inspiración:** Furia Nocturna (Toothless / Chimuelo) adaptado al ecosistema de un taller mecánico de motosoldadoras electrónicas en Arequipa, Perú.
- **Estilo Gráfico:** Pixel Art puro vectorial (renderizado mediante SVG paramétrico con `shape-rendering="crispEdges"`).
- **Paleta de Color:**
  - Cuerpo: Grafito / Obsidiana (`#0d1117`, `#161b22`, `#21262d`).
  - Ojos: Verde esmeralda plasma (`#10b981`, `#34d399`) con destello reactivo.
  - Aleta Caudal Prótesis: Rojo carmesí (`#ef4444`) con calavera vikinga pixel art blanca.
  - Acentos de Arco Eléctrico: Cian plasma (`#00D2FF`, `#38BDF8`).

---

## 2. ARQUITECTURA DE ARCHIVOS

Todos los artefactos de la mascota se encuentran aislados bajo el módulo:
```
components/
└── dashboard/
    └── pet/
        ├── types.ts                   → Definición de estados, tipos de acción, coordenadas y storage
        ├── PixelToothlessDragon.tsx    → Motor de renderizado SVG Pixel Art con frames de animación
        ├── useDragonAI.ts             → Hook de locomoción, físicas (gravedad/drag) y máquina de travesuras
        ├── DragonSpeechBubble.tsx     → Burbuja de diálogo contextual y avisos de taller
        ├── DragonPetOverlay.tsx       → Capa flotante global con protección de eventos de mouse
        └── DragonToggleNavbar.tsx     → Control de activación (Activo / Siesta / Cueva) en el Navbar
```

### Integración en el Layout Principal
- **Contenedor Visual:** Montado en [`components/layout/DashboardShell.tsx`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/layout/DashboardShell.tsx) mediante `<DragonPetOverlay />`.
- **Botón de Control:** Montado en [`components/layout/Navbar.tsx`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/layout/Navbar.tsx) mediante `<DragonToggleNavbar />`.

---

## 3. MÁQUINA DE ESTADOS Y COMPORTAMIENTO (BEHAVIOR STATE MACHINE)

La mascota opera con un ciclo de vida autónomo controlado por [`components/dashboard/pet/useDragonAI.ts`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/dashboard/pet/useDragonAI.ts):

| Estado (`DragonAction`) | Duración Típica | Descripción Visual y Lógica |
|---|---|---|
| `'idle'` | 3 a 7 seg | Respiración pausada (bobbing), parpadeo periódico de ojos. |
| `'walk'` | 4 a 10 seg | Desplazamiento horizontal (velocidad ~1.5 px/frame), patitas alternadas, balanceo de cola. Rebota en bordes. |
| `'spark'` | 2.5 seg | Se detiene, exhala un destello de arco eléctrico cian (`#00D2FF`), se asusta y pega un salto hacia atrás. |
| `'snack'` | 4 seg | Saca un pescadito pixel art y lo cocina con una llamarada de soldadura antes de guardarlo. |
| `'tumble'` | 3 seg | Da una voltereta completa en el suelo (rotación CSS 360°) y se sacude el polvo. |
| `'sleep'` | Indefinido / ~20s | Ojos cerrados, partículas `Zzz` animadas flotando. Se activa por inactividad o vía Navbar. |
| `'drag'` | Mientras se arrastra | Ojos muy abiertos, alitas y patas batiendo al ser sostenido por el cursor del ratón. |
| `'fall'` | Hasta tocar suelo | Planeo con alas abiertas y gravedad simulada (`velocity.y += 0.8`). |

---

## 4. SISTEMA DE FÍSICAS Y PROTECCIÓN DE UX

### 1. Gravedad y Cinemática
- Cuando el usuario hace `mousedown` sobre el dragón, entra en modo `'drag'` permitiendo moverlo libremente en 2D.
- Al soltarlo (`mouseup`):
  $$\text{velocidad}_y = \text{velocidad}_y + \text{gravedad}$$
  $$\text{pos}_y = \text{pos}_y + \text{velocidad}_y$$
- Al alcanzar el suelo (`floorY = window.innerHeight - 80`), rebota con coeficiente de amortiguación `0.3` y regresa a `'idle'`.

### 2. Aislamiento Total de Eventos (`pointer-events`)
- **Problema habitual:** Una mascota flotante suele bloquear clics en tablas, formularios y botones.
- **Solución implementada:**
  - El lienzo contenedor [`DragonPetOverlay.tsx`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/dashboard/pet/DragonPetOverlay.tsx) tiene `pointer-events-none`.
  - Exclusivamente el contenedor del sprite del dragón y la burbuja de diálogo tienen `pointer-events-auto`.
  - **Resultado:** El usuario puede trabajar al 100% en el sistema sin clicks interceptados.

### 3. Ahorro de Recursos (Pestaña en Segundo Plano)
- Utiliza el evento `document.visibilitychange`. Si el usuario cambia de pestaña, el bucle de animación se detiene automáticamente, reduciendo el consumo de CPU a 0%.

---

## 5. PERSISTENCIA Y SINCRONIZACIÓN

- **Clave en LocalStorage:** `'synapse_dragon_pet'`
- **Modos Admitidos (`DragonPreference`):**
  - `'active'`: Deambula, juega e interactúa libremente.
  - `'sleep'`: Se queda durmiendo en una esquina sin caminar ni emitir ruidos/burbujas continuas.
  - `'hidden'`: Se esconde en su cueva (desmontado del DOM visual).
- **Sincronización Multiventana:** Utiliza el evento `'storage'` y un CustomEvent `'dragon_pet_toggle'` para que si el usuario lo desactiva en una pestaña, se replique instantáneamente sin recargar la página.

---

## 6. SISTEMA DE DIÁLOGOS Y CONEXIÓN CON EL TALLER

La burbuja [`DragonSpeechBubble.tsx`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/dashboard/pet/DragonSpeechBubble.tsx) consume el hook `useDashboardStats()` de SWR (sin peticiones adicionales al servidor):
- **Alertas de Retraso:** Si `stats.total_delayed > 0`, el dragón lanza advertencias: *"¡Atención! Hay X motosoldadoras con más de 5 días de demora"*.
- **Equipos en Taller:** Si hay equipos en mantenimiento: *"Taller a tope: X máquinas recibiendo chispa hoy"*.
- **Cultura de Soldadura:** Consejos aleatorios (*"¿Sabías que los electrodos 7018 deben mantenerse secos en el horno?", "¿Revisaron ya la presión del gas Argón?"*).
- **Interacción Manual:** Al hacerle clic con el cursor, salta emocionado y agradece el cariño o suelta un rugido travieso.

---

## 7. CÓMO MEJORAR Y EXTENDER LA MASCOTA A FUTURO (ROADMAP & GUÍA)

Aquí tienes ideas y la guía exacta de código para expandir la mascota:

### 💡 Ideas de Expansión
1. **Accesorios / Skins de Taller:**
   - Casco o careta de soldar pixel art que se pone automáticamente cuando hay equipos en estado `"En mantenimiento"`.
   - Soporte para antorcha TIG en la mano o pequeña mochila porta-herramientas.
2. **Interacciones con Componentes de la Pantalla:**
   - Detectar la posición de las tarjetas de la Pizarra o tablas para que el dragón pueda subirse a descansar encima de un panel.
3. **Mini-juego / Alimentación:**
   - Botón para "Lanzarle un pescado" desde el Navbar. El dragón corre a atraparlo en el aire con un salto parabólico.
4. **Efectos de Sonido Opcionales (Retro 8-bit):**
   - Soniditos sintéticos breves con `AudioContext` nativo (sin archivos mp3 pesados) para chispas o ronquidos, con toggle de silencio.
5. **Reacción a Eventos del WebSocket:**
   - Cuando un equipo cambie a `"Servicio culminado"` vía Realtime, el dragón puede dar una vuelta de celebración y lanzar confeti de plasma.

---

### 🛠️ Guía Rápida: Cómo agregar una nueva travesura o animación

#### Paso 1: Registrar el nuevo estado en `types.ts`
En [`components/dashboard/pet/types.ts`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/dashboard/pet/types.ts#L1-L15):
```typescript
export type DragonAction = 
  | 'idle' 
  | 'walk' 
  | 'spark' 
  | 'snack' 
  | 'tumble' 
  | 'sleep' 
  | 'drag' 
  | 'fall'
  | 'weld_mask' // ← Nueva travesura: Ponerse la careta de soldador
```

#### Paso 2: Dibujar los pixeles en `PixelToothlessDragon.tsx`
En [`components/dashboard/pet/PixelToothlessDragon.tsx`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/dashboard/pet/PixelToothlessDragon.tsx), dentro del `<svg viewBox="0 0 32 32">`, agregar la capa condicional para la nueva acción:
```tsx
{action === 'weld_mask' && (
  <g id="welding-mask-layer">
    {/* Visor de soldadura negro con vidrio verde/dorado reflectante */}
    <rect x="10" y="8" width="12" height="10" fill="#1f2937" rx="1" />
    <rect x="13" y="11" width="6" height="3" fill="#10b981" />
  </g>
)}
```

#### Paso 3: Disparar la travesura en `useDragonAI.ts`
En [`components/dashboard/pet/useDragonAI.ts`](file:///C:/Users/gorti/Desktop/System-welding-machine-service/components/dashboard/pet/useDragonAI.ts):
```typescript
// En la función que elige la siguiente travesura aleatoria:
const possibleMischief: DragonAction[] = ['spark', 'snack', 'tumble', 'weld_mask']
const selected = possibleMischief[Math.floor(Math.random() * possibleMischief.length)]
setAction(selected)
```

---

## 8. CONCLUSIÓN
La mascota está construida bajo los más altos estándares de ingeniería de software moderna:
- **Cero deuda técnica:** No modifica base de datos ni afecta el rendimiento de la aplicación.
- **Diseño declarativo:** SVG 100% escalable por código sin assets que puedan perderse o romper links.
- **Modularidad completa:** Fácilmente desactivable o expandible sin alterar la lógica de negocio de SYNAPSE.
