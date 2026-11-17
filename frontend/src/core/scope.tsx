import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { PACKAGE_NAME } from './constants.ts';
import { resolvePteroArea } from './paths.ts';

/** All theme CSS is scoped to html[data-ptero-theme], this toggles it. */
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

/** The replaced components are compiled in even when the extension is disabled, they check this. */
export function isPteroExtensionEnabled(): boolean {
  return !!window.extensionContext?.extensions.some((extension) => extension.packageName === PACKAGE_NAME);
}

/** Reads the address, which updates before the new page renders (the attribute only after). */
export function isPteroThemeActive(): boolean {
  return isPteroExtensionEnabled() && resolvePteroArea(window.location.pathname) !== null;
}

/** Also checks the address bar: a virtual window runs its own router at another path. */
export function usePteroThemeActive(): boolean {
  const { pathname } = useLocation();

  return isPteroThemeActive() && resolvePteroArea(pathname) !== null;
}

export default function PteroScope() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    applyPteroScope(pathname);
  }, [pathname]);

  return null;
}
