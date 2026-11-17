/**
 * Refetches when a tab is shown again (refetchOnWindowFocus) are not page loads: requests while
 * hidden or right after return stay quiet. A slow one still shows (data-ptero-refreshing).
 */
const QUIET_AFTER_RETURN = 1000;

let quietUntil = 0;
let quietTimer: ReturnType<typeof setTimeout> | null = null;
const returnListeners = new Set<() => void>();

function startQuietWindow() {
  const root = document.documentElement;

  quietUntil = performance.now() + QUIET_AFTER_RETURN;
  root.setAttribute('data-ptero-refreshing', '');

  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    quietTimer = null;
    root.removeAttribute('data-ptero-refreshing');
  }, QUIET_AFTER_RETURN);

  for (const listener of returnListeners) listener();
}

export function isBackgroundRefresh(): boolean {
  return document.visibilityState === 'hidden' || performance.now() < quietUntil;
}

export function onTabReturn(listener: () => void): () => void {
  returnListeners.add(listener);
  return () => {
    returnListeners.delete(listener);
  };
}

export function trackBackgroundRefreshes() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startQuietWindow();
  });
}
