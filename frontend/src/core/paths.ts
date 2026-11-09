/** The parts of the panel with the Pterodactyl look, see resolvePteroArea(). */
export type PteroArea = 'auth' | 'dashboard' | 'account' | 'server';

/** The path without trailing slashes, `/` stays `/`. */
export const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

/** Whether the path is `base` itself or a page below it. */
export const isWithin = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** Whether the path is the page a link points to (without its ?query and #hash) or below it, `/` only matches itself. */
export function isWithinLink(pathname: string, to: string): boolean {
  const base = to.split(/[?#]/, 1)[0].replace(/\/+$/, '');

  return base === '' ? pathname === '/' : isWithin(pathname, base);
}

// the server lists of the dashboard: the panel starts on All Servers (/ and /all) or Grouped Servers (/ and /grouped)
const SERVER_LIST_PATHS = new Set(['/', '/all', '/grouped']);

/** Whether the path is one of the server lists of the dashboard. */
export const isServerListPath = (pathname: string) => SERVER_LIST_PATHS.has(normalizePath(pathname));

export const isAccountPath = (pathname: string) => isWithin(pathname, '/account');

/**
 * Decides which part of the panel a path belongs to. The admin area and the first-time setup (OOBE)
 * are deliberately excluded, so they keep the stock Calagopus look.
 */
export function resolvePteroArea(pathname: string): PteroArea | null {
  if (isWithin(pathname, '/admin') || isWithin(pathname, '/oobe')) return null;
  if (isWithin(pathname, '/auth')) return 'auth';
  if (pathname.startsWith('/server/')) return 'server';
  if (isAccountPath(pathname)) return 'account';

  return 'dashboard';
}
