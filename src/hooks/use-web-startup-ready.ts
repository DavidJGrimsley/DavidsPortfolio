import { useEffect, useState } from 'react';

export const WEB_READY_FALLBACK_MS = 3000;

/** Keep the initial server/client tree consistent while fonts load. */
export function useWebStartupReady(enabled: boolean, fontsLoaded: boolean, fontError: Error | null) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(() => setReady(true), WEB_READY_FALLBACK_MS);
    return () => clearTimeout(timeout);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || (!fontsLoaded && !fontError)) return;
    if (fontError) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const fontsReady = typeof document === 'undefined' ? undefined : document.fonts?.ready;
    Promise.resolve(fontsReady).then(
      () => { if (!cancelled) setReady(true); },
      () => { if (!cancelled) setReady(true); },
    );
    return () => { cancelled = true; };
  }, [enabled, fontsLoaded, fontError]);

  return ready;
}
