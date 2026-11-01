'use client';

import React, { useState } from 'react';
import MascotCharacter from './MascotCharacter';
import MascotMessage from './MascotMessage';
import { useMascotState } from './mascot-state';
import { MascotKind, MascotMood } from './mascot-config';

interface MascotWidgetProps {
  initialKind?: MascotKind;
  initialMood?: MascotMood;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
}

export default function MascotWidget({
  className = '',
  position = 'bottom-right',
}: MascotWidgetProps) {
  const { kind, mood, message, actionLabel, actionHref, toggleKind } = useMascotState();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40',
    'bottom-left': 'fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40',
    'inline': 'relative z-10',
  }[position];

  return (
    <div className={`flex flex-col items-end gap-2.5 ${positionClasses} ${className}`}>
      {/* Panel flotante de mensaje */}
      {isOpen && (
        <div className="mb-1">
          <MascotMessage
            kind={kind}
            mood={mood}
            message={message}
            actionLabel={actionLabel}
            actionHref={actionHref}
            onClose={() => setIsOpen(false)}
            onToggleKind={toggleKind}
          />
        </div>
      )}

      {/* Personaje interactivo */}
      <div className="flex items-center gap-2">
        <MascotCharacter
          kind={kind}
          mood={mood}
          size={78}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
    </div>
  );
}
