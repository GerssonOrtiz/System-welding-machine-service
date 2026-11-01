export type MascotKind = 'dragon-ai' | 'fox-tech';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'alert'
  | 'sleeping'
  | 'error'
  | 'working';

export interface MascotMessageItem {
  id: string;
  text: string;
  mood: MascotMood;
  actionLabel?: string;
  actionHref?: string;
}

export interface MascotConfig {
  name: string;
  title: string;
  accentColor: string;
  glowColor: string;
  description: string;
}

export const MASCOT_PROFILES: Record<MascotKind, MascotConfig> = {
  'dragon-ai': {
    name: 'Dragón AI',
    title: 'Inteligencia Central',
    accentColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.35)',
    description: 'Análisis global, salud operativa del sistema y métricas en tiempo real.',
  },
  'fox-tech': {
    name: 'Zorro Tech',
    title: 'Asistente Operativo',
    accentColor: '#FF9D42',
    glowColor: 'rgba(255, 157, 66, 0.35)',
    description: 'Guía ágil, recordatorios de tareas, novedades y atajos rápidos.',
  },
};

export const MOOD_LABELS: Record<MascotMood, string> = {
  idle: 'En reposo',
  happy: '¡Excelente!',
  thinking: 'Analizando...',
  alert: 'Atención',
  sleeping: 'Inactivo',
  error: 'Revisión requerida',
  working: 'Procesando datos',
};
