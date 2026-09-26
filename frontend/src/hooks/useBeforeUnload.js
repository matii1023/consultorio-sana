import { useEffect } from 'react';

/**
 * Muestra un aviso del navegador si el usuario intenta cerrar
 * la pestaña con una sesión activa.
 */
export const useBeforeUnload = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);
};