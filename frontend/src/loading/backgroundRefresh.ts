/**
 * The panel reloads every list and value of a page when its tab is shown again (react-query's
 * refetchOnWindowFocus). Those are refreshes of data that is already on screen, not page loads, so the
 * loading bar and the loading lists stay quiet for them: requests made while the tab is hidden or in
 * the first moment after it comes back don't count. A refresh that takes longer than that still shows
 * up the normal way (app.css, data-ptero-refreshing).
 */
const QUIET_AFTER_RETURN = 1000;

let quietUntil = 0;
let quietTimer: ReturnType<typeof setTimeout> | null = null;
const returnListeners = new Set<() => void>();

function startQuietWindow() {
  quietUntil = performance.now() + QUIET_AFTER_RETURN;

  const root = document.documentElement;
  root.setAttribute('data-ptero-refreshing', '');

  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    quietTimer = null;
    root.removeAttribute('data-ptero-refreshing');
  }, QUIET_AFTER_RETURN);

  for (const listener of returnListeners) listener();
}

/** Whether a request starting now is one of these refreshes. */
export function isBackgroundRefresh(): boolean {
  return document.visibilityState === 'hidden' || performance.now() < quietUntil;
}

/** Runs when the tab is shown again, e.g. to drop a loading bar that was stuck while it was hidden. */
export function onTabReturn(listener: () => void) {
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
