import { useSyncExternalStore } from 'react';
import { getPublicThemeSettings } from './api.ts';
import {
  defaultPteroThemeSettings,
  type PteroThemeSettings,
  pteroAnimationScale,
  pteroThemeSettingsSchema,
} from './schema.ts';

/**
 * The theme settings an admin picked (admin area -> Extensions -> Pterodactyl Theme). The last known
 * settings are kept in the browser, so a reload doesn't play animations an admin turned off while
 * the current ones are still being fetched.
 */
const CACHE_KEY = 'ptero-theme-settings';

const listeners = new Set<() => void>();

function readCache(): PteroThemeSettings {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      // settings added in a later version are missing from an older cache, they start out as defaults
      const parsed = pteroThemeSettingsSchema.safeParse({ ...defaultPteroThemeSettings, ...JSON.parse(cached) });
      if (parsed.success) return parsed.data;
    }
  } catch {
    // storage can be unavailable (privacy modes) or hold garbage, the defaults are used then
  }

  return defaultPteroThemeSettings;
}

function writeCache(settings: PteroThemeSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    // not being able to cache them only means the defaults are used until they are fetched
  }
}

let current = readCache();

export function getPteroThemeSettings(): PteroThemeSettings {
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePteroThemeSettings(): PteroThemeSettings {
  return useSyncExternalStore(subscribe, getPteroThemeSettings);
}

/** The CSS (page fade, loading lists, footer) reads the settings from the root element, see app.css. */
export function applyPteroThemeSettings() {
  const root = document.documentElement;

  if (current.animations) {
    root.removeAttribute('data-ptero-animations');
  } else {
    root.setAttribute('data-ptero-animations', 'off');
  }
  // 0 when the animations are off, so the loading spinners of lists simply appear after the delay
  root.style.setProperty(
    '--ptero-animation-scale',
    String(current.animations ? pteroAnimationScale[current.animationSpeed] : 0),
  );
  root.style.setProperty('--ptero-loading-delay', `${current.loadingBarDelay}ms`);
  root.setAttribute('data-ptero-footer', current.footerPosition);
}

export function setPteroThemeSettings(settings: PteroThemeSettings) {
  current = settings;
  writeCache(settings);
  applyPteroThemeSettings();

  for (const listener of listeners) listener();
}

export function loadPteroThemeSettings() {
  getPublicThemeSettings()
    .then(setPteroThemeSettings)
    .catch(() => {
      // an older backend or a network error, the cached (or default) settings stay in use
    });
}
