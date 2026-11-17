import { safeParseFromApi } from '@/lib/serialization/api-transform.ts';
import { createStore, useStore } from '../core/createStore.ts';
import { getPublicThemeSettings } from './api.ts';
import {
  defaultPteroThemeSettings,
  type PteroThemeSettings,
  pteroAnimationScale,
  pteroThemeSettingsSchema,
} from './schema.ts';

/**
 * Theme settings. The backend renders them into the page; the last ones are cached for the boot
 * script (same key) and for pages without the variable.
 */
const CACHE_KEY = 'ptero-theme-settings';

function readCache(): PteroThemeSettings {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      // a cache from an older version lacks newer settings, defaults fill them
      const parsed = pteroThemeSettingsSchema.safeParse({ ...defaultPteroThemeSettings, ...JSON.parse(cached) });
      if (parsed.success) return parsed.data;
    }
  } catch {
    // storage may be unavailable or hold garbage
  }

  return defaultPteroThemeSettings;
}

function writeCache(settings: PteroThemeSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {}
}

const store = createStore(readCache());
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export const pteroAnimationScaleOf = (settings: PteroThemeSettings): number =>
  settings.animations && !reducedMotion.matches ? pteroAnimationScale[settings.animationSpeed] : 0;

export const getPteroThemeSettings = (): PteroThemeSettings => store.get();

export const usePteroThemeSettings = (): PteroThemeSettings => useStore(store);

/** The CSS reads the settings from attributes and variables on <html>. */
export function applyPteroThemeSettings(settings: PteroThemeSettings = store.get()) {
  const root = document.documentElement;

  if (settings.animations) {
    root.removeAttribute('data-ptero-animations');
  } else {
    root.setAttribute('data-ptero-animations', 'off');
  }
  root.style.setProperty('--ptero-animation-scale', String(pteroAnimationScaleOf(settings)));
  root.style.setProperty('--ptero-loading-delay', `${settings.loadingBarDelay}ms`);
  root.setAttribute('data-ptero-footer', settings.footerPosition);

  if (settings.colorPalette !== 'default') {
    root.setAttribute('data-ptero-palette', settings.colorPalette);
  } else {
    root.removeAttribute('data-ptero-palette');
  }
}

export function setPteroThemeSettings(settings: PteroThemeSettings) {
  writeCache(settings);
  applyPteroThemeSettings(settings);
  store.set(settings);
}

function parseRendered(rendered: unknown): PteroThemeSettings | null {
  if (rendered === undefined || rendered === null) return null;

  try {
    const parsed = safeParseFromApi(pteroThemeSettingsSchema, rendered);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Uses the settings rendered into the page, else the cached ones while fetching the current ones. */
export function loadPteroThemeSettings(rendered: unknown) {
  const settings = parseRendered(rendered);
  if (settings) {
    setPteroThemeSettings(settings);
    return;
  }

  applyPteroThemeSettings();
  getPublicThemeSettings()
    .then(setPteroThemeSettings)
    .catch(() => {
      // network error: keep the cached or default settings
    });
}
