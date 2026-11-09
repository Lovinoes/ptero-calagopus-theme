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
 * The theme settings (Admin -> Extensions -> Pterodactyl Theme). The backend renders them into the page
 * (an index.html variable), so they are known before anything is drawn. The last known ones are kept in
 * the browser as well, for the boot script (public/assets/ptero-boot-2.js reads this key too) and for the
 * rare page without the variable, which fetches them instead.
 */
const CACHE_KEY = 'ptero-theme-settings';

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
    // not being able to cache them only means the defaults are used until they are known
  }
}

const store = createStore(readCache());

export const getPteroThemeSettings = (): PteroThemeSettings => store.get();

export const usePteroThemeSettings = (): PteroThemeSettings => useStore(store);

/** The CSS (page fade, loading lists, footer, colors) reads the settings from the root element, see styles/. */
export function applyPteroThemeSettings(settings: PteroThemeSettings = store.get()) {
  const root = document.documentElement;

  if (settings.animations) {
    root.removeAttribute('data-ptero-animations');
  } else {
    root.setAttribute('data-ptero-animations', 'off');
  }
  // 0 when the animations are off, so the loading spinners of lists simply appear after the delay
  root.style.setProperty(
    '--ptero-animation-scale',
    String(settings.animations ? pteroAnimationScale[settings.animationSpeed] : 0),
  );
  root.style.setProperty('--ptero-loading-delay', `${settings.loadingBarDelay}ms`);
  root.setAttribute('data-ptero-footer', settings.footerPosition);

  // the darker grays of the dark scheme, see styles/palette-darker.css
  if (settings.colorPalette === 'darker') {
    root.setAttribute('data-ptero-palette', 'darker');
  } else {
    root.removeAttribute('data-ptero-palette');
  }
}

export function setPteroThemeSettings(settings: PteroThemeSettings) {
  writeCache(settings);
  applyPteroThemeSettings(settings);
  store.set(settings);
}

/** The settings the backend rendered into the page, null when they are missing or don't fit the schema. */
function parseRendered(rendered: unknown): PteroThemeSettings | null {
  if (rendered === undefined || rendered === null) return null;

  try {
    const parsed = safeParseFromApi(pteroThemeSettingsSchema, rendered);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Applies the settings the backend rendered into the page (see initialize_index_html in src/lib.rs).
 * Without them, the last known ones are applied right away and the current ones are fetched.
 */
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
      // a network error, the cached (or default) settings stay in use
    });
}
