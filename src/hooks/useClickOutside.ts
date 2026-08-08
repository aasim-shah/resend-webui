'use client';

import React from 'react';

/**
 * Calls `onOutside` when a pointer event lands outside `ref`'s element.
 * Only listens while `enabled` is true, so closed dropdowns add no listeners.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  enabled: boolean,
  onOutside: () => void
) {
  React.useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, enabled, onOutside]);
}
