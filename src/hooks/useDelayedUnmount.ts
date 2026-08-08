'use client';

import React from 'react';

/**
 * Keeps a conditionally-rendered element mounted for `exitDurationMs` after
 * `isOpen` flips false, so its CSS exit animation (e.g. `*-out` keyframes in
 * globals.css) has time to play instead of the element vanishing instantly.
 */
export function useDelayedUnmount(isOpen: boolean, exitDurationMs: number): boolean {
  const [shouldRender, setShouldRender] = React.useState(isOpen);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    if (shouldRender) {
      const timer = setTimeout(() => setShouldRender(false), exitDurationMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, exitDurationMs, shouldRender]);

  return shouldRender;
}
