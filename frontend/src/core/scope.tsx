import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { PACKAGE_NAME } from './constants.ts';
import { resolvePteroArea } from './paths.ts';

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

/** Keeps the scope attributes on the root element in step with the route. */
export default function PteroScope() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    applyPteroScope(pathname);
  }, [pathname]);

  return null;
}
