# MASCOTAS_AI_DESIGN.md
## Guía de diseño e implementación: Dragón AI + Zorro Tech

**Objetivo:** crear dos mascotas virtuales originales para un dashboard web moderno. Este documento sirve como brief visual y técnico para un agente de desarrollo/diseño (Antigravity, OpenCode, Claude Code, etc.).

---

## 1. Dirección artística compartida

Ambos personajes pertenecen al mismo universo: **compañeros robóticos inteligentes** que viven dentro del dashboard.

- Estética: robot mascota 3D estilizado, amigable, premium y ligeramente futurista.
- Silueta: compacta, reconocible incluso en tamaños pequeños; cabeza expresiva y cuerpo pequeño.
- Materiales: carcasa de cerámica blanca/perla, piezas de titanio oscuro, articulaciones suaves y detalles luminosos.
- Pantalla facial: visor negro brillante con ojos y boca luminosos; evitar rasgos humanos realistas.
- Iluminación: cian eléctrico `#00E5FF` como color principal; violeta `#8B5CF6` como acento.
- Acento exclusivo del Dragón: azul hielo y pequeños detalles violeta.
- Acento exclusivo del Zorro: ámbar/naranja `#FF9D42` combinado con cian.
- Fondo de presentación: transparente o muy oscuro; la mascota debe funcionar sobre paneles dark/glassmorphism.
- Personalidad: cercana, inteligente y profesional; no infantilizar en exceso.
- No incluir texto, letras, logotipos ni marcas incrustadas en el modelo.

**Regla de consistencia:** ambos deben compartir proporciones, materiales, nivel de detalle, tratamiento de ojos, iluminación y calidad de render. Deben parecer diseñados por el mismo estudio.

## 2. Personaje A — Dragón AI

### Concepto
Un pequeño dragón robótico que representa la inteligencia central del sistema. Debe transmitir análisis, conocimiento, protección y capacidad tecnológica. Es la mascota protagonista.

### Diseño visual
- Cuerpo pequeño y robusto, con postura estable.
- Cabeza ligeramente grande respecto al cuerpo para mejorar la lectura de expresiones.
- Dos cuernos cortos y elegantes, integrados en la silueta.
- Alas mecánicas pequeñas, plegables y con membranas de energía translúcidas cian-violeta.
- Cola articulada con punta luminosa geométrica.
- Escamas sugeridas mediante placas de armadura suaves, no escamas orgánicas realistas.
- Visor facial negro con ojos cian expresivos.
- Pecho con un núcleo circular luminoso, sin letras ni símbolos.
- Patas cortas con pequeñas garras redondeadas; aspecto amigable, nunca amenazante.

### Personalidad
Observador, sabio, protector y seguro. Habla poco y ofrece información útil. Celebra los logros sin exageración.

### Paleta
- Carcasa: `#E8F2FA`
- Armadura secundaria: `#202A3A`
- Luz principal: `#00E5FF`
- Luz secundaria: `#8B5CF6`
- Núcleo: gradiente cian-violeta.

### Prompt de generación — Dragón AI
> Diseña un personaje original llamado Dragón AI: una pequeña mascota robótica de inteligencia artificial, adorable pero premium, con cuerpo compacto y robusto, cabeza ligeramente grande, dos cuernos cortos, pequeñas alas mecánicas plegables con membranas de energía translúcidas cian y violeta, cola articulada con punta geométrica luminosa, placas de armadura de cerámica blanca perlada y titanio oscuro, visor facial negro brillante con ojos cian expresivos y núcleo circular luminoso en el pecho. Estética de collectible high-end 3D character, industrial sci-fi amigable, superficies limpias, detalles precisos, iluminación cinematográfica suave, render de producto de alta calidad. Vista de tres cuartos, personaje completo, centrado, fondo transparente, sin texto, sin letras, sin logotipos, sin elementos adicionales.

## 3. Personaje B — Zorro Tech

### Concepto
Un zorro robótico ágil que representa la asistencia cotidiana, la comunicación y la rapidez. Es el compañero explorador: detecta novedades y guía al usuario por el dashboard.

### Diseño visual
- Cuerpo pequeño, ligero y ligeramente más estilizado que el Dragón.
- Orejas grandes y puntiagudas, con interior luminoso cian.
- Máscara facial inspirada en un zorro, integrada como placas de armadura; no usar rostro de animal realista.
- Visor negro brillante con ojos cian y expresiones claras.
- Cola grande y esponjosa en silueta, pero construida con segmentos mecánicos/placas suaves; punta luminosa ámbar.
- Patas ágiles y postura inclinada ligeramente hacia delante.
- Detalles ámbar/naranja en orejas, cola y articulaciones.
- Pequeño módulo luminoso en el pecho, coherente con el núcleo del Dragón.

### Personalidad
Curioso, rápido, comunicativo y optimista. Es ideal para consejos breves, novedades, recordatorios y mensajes de bienvenida.

### Paleta
- Carcasa: `#E8F2FA`
- Armadura secundaria: `#263044`
- Luz principal: `#00E5FF`
- Acento zorro: `#FF9D42`
- Luz secundaria: `#8B5CF6`

### Prompt de generación — Zorro Tech
> Diseña un personaje original llamado Zorro Tech: una pequeña mascota robótica con forma de zorro, ágil, simpática y premium, cuerpo compacto y estilizado, orejas grandes y puntiagudas con interior cian luminoso, máscara facial geométrica de zorro integrada en placas de armadura, visor negro brillante con ojos cian expresivos, gran cola segmentada de diseño mecánico con punta luminosa ámbar, carcasa de cerámica blanca perlada y piezas de titanio oscuro, detalles de luz cian, naranja ámbar y pequeños acentos violetas. Estética de collectible high-end 3D character, sci-fi industrial amigable, superficies limpias, detalles precisos, iluminación cinematográfica suave, render de producto de alta calidad. Vista de tres cuartos, personaje completo, centrado, fondo transparente, sin texto, sin letras, sin logotipos, sin elementos adicionales.

## 4. Expresiones y estados necesarios

Crear las siguientes expresiones para **cada personaje**, manteniendo exactamente el mismo diseño base:

| Estado | Expresión / pose | Uso en el dashboard |
|---|---|---|
| `idle` | Respiración suave, ojos relajados | Estado normal |
| `happy` | Ojos curvados/sonrientes, pequeño salto | Acción completada |
| `thinking` | Ojos atentos, cabeza inclinada | Procesando o analizando |
| `alert` | Ojos abiertos, orejas/alas levantadas | Nueva notificación |
| `sleeping` | Ojos cerrados, pequeña animación Z | Inactividad |
| `error` | Ojos preocupados, luz roja discreta | Error o incidencia |
| `working` | Pose activa, núcleo pulsando | Tarea en progreso |

No cambiar el color completo del personaje en cada estado. La emoción debe leerse principalmente en los ojos, la postura y pequeños efectos.

## 5. Entregables gráficos

Solicitar al agente que genere:

1. `dragon-ai-idle.png`
2. `dragon-ai-happy.png`
3. `dragon-ai-thinking.png`
4. `dragon-ai-alert.png`
5. `dragon-ai-sleeping.png`
6. `dragon-ai-error.png`
7. `dragon-ai-working.png`
8. `fox-tech-idle.png`
9. `fox-tech-happy.png`
10. `fox-tech-thinking.png`
11. `fox-tech-alert.png`
12. `fox-tech-sleeping.png`
13. `fox-tech-error.png`
14. `fox-tech-working.png`

**Especificaciones:**
- PNG con transparencia real (canal alfa).
- Resolución objetivo: 1024 × 1024 px por pose.
- Personaje completo, sin recortes de orejas, alas, cola o patas.
- Cámara, escala, orientación e iluminación consistentes entre estados del mismo personaje.
- Evitar sombras exteriores grandes que dificulten la integración.
- Si se usa un generador que no conserva consistencia entre imágenes, generar primero una hoja de referencia del personaje y reutilizarla como referencia visual en cada pose.

**Importante:** no generar 14 diseños independientes desde cero. Primero aprobar un modelo maestro por personaje y luego derivar las expresiones del mismo modelo.

## 6. Comportamiento en el dashboard

### Reglas de interacción
- Mostrar una sola mascota a la vez por defecto; permitir alternar entre Dragón AI y Zorro Tech desde preferencias.
- La mascota aparece en un módulo compacto o flotante, sin tapar botones ni tablas.
- Al hacer clic, abre/cierra un pequeño panel de mensajes.
- Los mensajes deben ser breves, contextuales y no bloquear el trabajo.
- Respetar `prefers-reduced-motion`; ofrecer animaciones discretas.
- No reproducir sonidos automáticamente.
- No inventar alertas: las reacciones deben depender de eventos reales del sistema.

### Personalidad por personaje
- Dragón AI: análisis, resumen, ayuda contextual, estado general del sistema.
- Zorro Tech: bienvenida, novedades, recordatorios, guía de navegación.

### Ejemplos de mensajes
- Dragón AI: “He terminado de analizar los datos. Tienes 3 puntos que revisar.”
- Dragón AI: “Todo está funcionando correctamente.”
- Zorro Tech: “¡Hola! Hay una actualización en tu panel.”
- Zorro Tech: “Tienes una tarea pendiente. ¿La revisamos?”

Los números y eventos de estos mensajes deben proceder de datos reales; los ejemplos son solo texto de demostración.

## 7. Integración técnica sugerida (Next.js / React)

Estructura orientativa:

```text
components/
  mascot/
    MascotWidget.tsx
    MascotCharacter.tsx
    MascotMessage.tsx
    mascot-config.ts
    mascot-state.ts
public/
  mascots/
    dragon-ai/
    fox-tech/
```

### Tipos sugeridos

```ts
export type MascotKind = "dragon-ai" | "fox-tech";

export type MascotMood =
  | "idle"
  | "happy"
  | "thinking"
  | "alert"
  | "sleeping"
  | "error"
  | "working";
```

### Criterios de implementación
- Crear un componente reutilizable `MascotWidget`.
- Seleccionar el archivo gráfico según personaje y estado.
- Usar CSS transitions para transiciones sencillas; usar Rive o Lottie solo si se dispone de animaciones preparadas.
- Mantener la lógica de negocio fuera del componente visual.
- Recibir eventos mediante props o un store existente; no acoplar la mascota directamente a consultas de base de datos.
- Cargar las imágenes de forma optimizada y con dimensiones reservadas para evitar saltos de layout.
- En móvil, reducir tamaño y evitar que el widget cubra controles esenciales.
- Añadir accesibilidad: nombre accesible, botón de abrir/cerrar, foco visible y opción de reducir movimiento.

## 8. Orden de trabajo recomendado para el agente

1. Revisar el dashboard actual y detectar framework, estilos, layout y sistema de componentes existente.
2. Crear una hoja de referencia visual con ambos personajes en la misma escena.
3. Generar y aprobar primero el modelo maestro del Dragón AI y del Zorro Tech.
4. Derivar las siete expresiones de cada personaje manteniendo la consistencia.
5. Implementar el componente React con imágenes estáticas y estados simulados.
6. Conectar eventos reales del sistema solo después de validar la interfaz.
7. Probar escritorio, tablet y móvil; comprobar transparencia, rendimiento y accesibilidad.

## 9. Criterios de aceptación

- Los dos personajes se reconocen claramente y no parecen variantes del mismo animal.
- Mantienen una identidad visual común.
- Cada estado conserva el mismo modelo, proporciones y materiales.
- Los PNG tienen transparencia real y no un fondo cuadriculado simulado.
- La mascota no tapa contenido ni interrumpe flujos de trabajo.
- Las reacciones reflejan eventos reales, no datos inventados.
- El dashboard sigue siendo usable sin mostrar la mascota.

---

## Instrucción final para el agente

Lee este documento y revisa primero el proyecto existente. No modifiques la arquitectura ni reemplaces componentes del dashboard sin necesidad. Presenta primero una propuesta visual de los dos modelos maestros para aprobación. Después genera las expresiones y realiza la integración como un componente aislado, reutilizable y responsive. Prioriza consistencia visual, rendimiento y facilidad de mantenimiento.
