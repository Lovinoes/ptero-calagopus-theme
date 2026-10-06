import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

export type PteroArea = 'auth' | 'dashboard' | 'account' | 'server';

export const PACKAGE_NAME = 'dev.lovinoes.pterodactyl';

const BOOT_STYLE_ID = 'ptero-theme-boot';

const isWithin = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/**
 * Decides which part of the panel a path belongs to. The admin area and the first-time setup (OOBE)
 * are deliberately excluded, so they keep the stock Calagopus look.
 */
export function resolvePteroArea(pathname: string): PteroArea | null {
  if (isWithin(pathname, '/admin') || isWithin(pathname, '/oobe')) return null;
  if (isWithin(pathname, '/auth')) return 'auth';
  if (pathname.startsWith('/server/')) return 'server';
  if (isWithin(pathname, '/account')) return 'account';

  return 'dashboard';
}

/**
 * Every style of this theme is scoped to `html[data-ptero-theme]`, toggling the attribute is what
 * switches between the Pterodactyl look and the stock look (for the admin area).
 */
export function applyPteroScope(pathname: string) {
  const root = document.documentElement;
  const area = resolvePteroArea(pathname);

  if (area) {
    root.setAttribute('data-ptero-theme', '');
    root.setAttribute('data-ptero-area', area);
  } else {
    root.removeAttribute('data-ptero-theme');
    root.removeAttribute('data-ptero-area');
  }
}

/**
 * Whether this extension is enabled. The core components it replaces (overrides.ts) are compiled into
 * the panel either way, so they check this to fall back to the stock component.
 */
export function isPteroExtensionEnabled(): boolean {
  return !!window.extensionContext?.extensions.some((extension) => extension.packageName === PACKAGE_NAME);
}

/**
 * Whether the theme styles the current page: the extension is enabled and the page is not excluded.
 * It reads the address, which the router updates before it renders the new page, so it is right while
 * that page renders as well (the data-ptero-theme attribute only follows after the render).
 */
export function isPteroThemeActive(): boolean {
  return isPteroExtensionEnabled() && resolvePteroArea(window.location.pathname) !== null;
}

/** The same as a hook, components using it render again when the route changes. */
export function usePteroThemeActive(): boolean {
  const { pathname } = useLocation();

  return isPteroExtensionEnabled() && resolvePteroArea(pathname) !== null;
}

export function removePteroScope() {
  document.documentElement.removeAttribute('data-ptero-theme');
  document.documentElement.removeAttribute('data-ptero-area');
  document.getElementById(BOOT_STYLE_ID)?.remove();
}

/** Mirrors how Mantine picks the scheme: the stored choice, falling back to the panel default (dark). */
function bootsInLightScheme(): boolean {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('mantine-color-scheme-value');
  } catch {
    // storage can be unavailable (privacy modes), the panel then starts dark
  }

  if (stored === 'light') return true;
  if (stored === 'auto') return !window.matchMedia('(prefers-color-scheme: dark)').matches;

  return false;
}

/** The last known color palette, from the settings that settings/store.ts keeps in the browser. */
function bootsInDarkerPalette(): boolean {
  try {
    // the key of settings/store.ts, not imported from there (it imports this file through settings/api.ts)
    return JSON.parse(localStorage.getItem('ptero-theme-settings') ?? '{}')?.colorPalette === 'darker';
  } catch {
    // no storage or no cache yet, the default palette
    return false;
  }
}

/**
 * While the panel loads its settings the extension stylesheet is still disabled and Mantine is not
 * mounted, so the loading screen would show the stock Calagopus colors. This runs as soon as the
 * bundle executes and paints that screen in the theme colors instead. Once Mantine sets
 * `--mantine-color-body` the real theme takes over.
 */
export function installBootScope() {
  applyPteroScope(window.location.pathname);

  if (!document.getElementById(BOOT_STYLE_ID)) {
    const light = bootsInLightScheme();
    const darker = bootsInDarkerPalette();
    // the page and the text color (gray-800 and gray-100) of the scheme and palette, see app.css
    const page = light ? 'hsl(214, 20%, 93%)' : darker ? 'oklch(0.195 0.012 264)' : 'hsl(209, 20%, 25%)';
    const spinner = light ? 'hsl(209, 20%, 25%)' : darker ? 'oklch(0.93 0.008 264)' : 'hsl(214, 15%, 91%)';
    const style = document.createElement('style');

    style.id = BOOT_STYLE_ID;
    style.textContent = [
      `html[data-ptero-theme]{background-color:var(--mantine-color-body,${page})}`,
      `html[data-ptero-theme]:not([data-mantine-color-scheme]) .spinner{border-color:${spinner};border-bottom-color:transparent}`,
    ].join('\n');
    document.head.appendChild(style);
  }
}

export default function PteroScope() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    applyPteroScope(pathname);
  }, [pathname]);

  return null;
}
