export type PteroArea = 'auth' | 'dashboard' | 'account' | 'server';

export const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

export const isWithin = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** `/` only matches itself */
export function isWithinLink(pathname: string, to: string): boolean {
  const base = to.split(/[?#]/, 1)[0].replace(/\/+$/, '');

  return base === '' ? pathname === '/' : isWithin(pathname, base);
}

const SERVER_LIST_PATHS = new Set(['/', '/all', '/grouped']);

export const isServerListPath = (pathname: string) => SERVER_LIST_PATHS.has(normalizePath(pathname));

export const isAccountPath = (pathname: string) => isWithin(pathname, '/account');

/** The themed area of a path, null for the admin area and the setup (OOBE). */
export function resolvePteroArea(pathname: string): PteroArea | null {
  if (isWithin(pathname, '/admin') || isWithin(pathname, '/oobe')) return null;
  if (isWithin(pathname, '/auth')) return 'auth';
  if (pathname.startsWith('/server/')) return 'server';
  if (isAccountPath(pathname)) return 'account';

  return 'dashboard';
}
