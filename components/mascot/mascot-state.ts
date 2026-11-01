'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { MascotKind, MascotMood } from './mascot-config';

interface MascotState {
  kind: MascotKind;
  mood: MascotMood;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  setKind: (kind: MascotKind) => void;
  setMood: (mood: MascotMood) => void;
  toggleKind: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMascotState(): MascotState {
  // Preferencia guardada en localStorage
  const [kind, setKindState] = useState<MascotKind>('dragon-ai');
  const [mood, setMood] = useState<MascotMood>('idle');
  const [message, setMessage] = useState<string>('Todo está funcionando con normalidad.');
  const [actionLabel, setActionLabel] = useState<string | undefined>(undefined);
  const [actionHref, setActionHref] = useState<string | undefined>(undefined);

  // Cargar preferencia persistida
  useEffect(() => {
    try {
      const savedKind = localStorage.getItem('synapse_mascot_kind');
      if (savedKind === 'dragon-ai' || savedKind === 'fox-tech') {
        setKindState(savedKind);
      }
    } catch {
      // Ignorar si no hay acceso a storage
    }
  }, []);

  const setKind = (newKind: MascotKind) => {
    setKindState(newKind);
    try {
      localStorage.setItem('synapse_mascot_kind', newKind);
    } catch {
      // Ignorar
    }
  };

  const toggleKind = () => {
    setKind(kind === 'dragon-ai' ? 'fox-tech' : 'dragon-ai');
  };

  // Conectar con datos y eventos reales del sistema (sin inventar alertas)
  const { data: statsData } = useSWR('/api/stats', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Cada 1 minuto
  });

  useEffect(() => {
    if (!statsData || !statsData.success) {
      if (kind === 'dragon-ai') {
        setMood('idle');
        setMessage('Monitoreando servicios y procesos operativos.');
      } else {
        setMood('idle');
        setMessage('¡Hola! Estoy listo para asistirte en el taller.');
      }
      return;
    }

    const { total_active = 0, delayed_count = 0, waiting_parts_count = 0 } = statsData.data || {};

    if (delayed_count > 0) {
      setMood('alert');
      if (kind === 'dragon-ai') {
        setMessage(`Se detectaron ${delayed_count} equipo(s) con demoras en taller.`);
        setActionLabel('Ver Equipos');
        setActionHref('/equipos');
      } else {
        setMessage(`¡Atención! Hay ${delayed_count} orden(es) fuera del plazo proyectado.`);
        setActionLabel('Revisar demoras');
        setActionHref('/equipos');
      }
    } else if (waiting_parts_count > 0) {
      setMood('thinking');
      if (kind === 'dragon-ai') {
        setMessage(`Hay ${waiting_parts_count} equipo(s) en espera de repuestos o insumos.`);
        setActionLabel('Ir a Pizarra');
        setActionHref('/pizarra');
      } else {
        setMessage(`${waiting_parts_count} orden(es) necesitan componentes de logística.`);
        setActionLabel('Ver logística');
        setActionHref('/pizarra');
      }
    } else if (total_active > 0) {
      setMood('working');
      if (kind === 'dragon-ai') {
        setMessage(`Sistema operativo: ${total_active} equipos en flujo activo.`);
        setActionLabel('Panel Estadísticas');
        setActionHref('/estadisticas');
      } else {
        setMessage(`¡Taller productivo! Procesando ${total_active} equipos actualmente.`);
        setActionLabel('Ver Pizarra');
        setActionHref('/pizarra');
      }
    } else {
      setMood('happy');
      if (kind === 'dragon-ai') {
        setMessage('Diagnósticos y mantenimientos al día. Cero incidencias reportadas.');
      } else {
        setMessage('¡Todo despejado! No hay órdenes pendientes en este momento.');
      }
      setActionLabel(undefined);
      setActionHref(undefined);
    }
  }, [statsData, kind]);

  return {
    kind,
    mood,
    message,
    actionLabel,
    actionHref,
    setKind,
    setMood,
    toggleKind,
  };
}
