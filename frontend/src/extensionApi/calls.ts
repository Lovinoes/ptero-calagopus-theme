import type { ExtensionContext } from 'shared';
import { resolvePteroArea } from '../core/paths.ts';
import { getPteroThemeSettings } from '../settings/store.ts';
import { addNavbarItem, parseNavbarItem, removeNavbarItem } from './navbarItems.ts';

/**
 * Calls other extensions can make (EXTENSIONS.md). They call processCall directly: the panel's
 * ctx.call() only ever reaches the first extension.
 * Bump PTERO_API_VERSION when calls change. 2: settings.colorPalette. 3: colorPalette 'shadcn'.
 */
export const PTERO_API_VERSION = 3;

const CALL_PREFIX = 'lovinoes_pterodactyl_';

export function handlePteroCall(ctx: ExtensionContext, name: string, args: object): unknown {
  if (!name.startsWith(CALL_PREFIX)) return ctx.skip();

  switch (name.slice(CALL_PREFIX.length)) {
    case 'api_version':
      return PTERO_API_VERSION;

    // only the page counts: extensions may ask before window.extensionContext exists
    case 'theme_active':
      return resolvePteroArea(window.location.pathname) !== null;

    case 'settings':
      return Object.freeze({ ...getPteroThemeSettings() });

    case 'navbar_add': {
      const item = parseNavbarItem(args);
      return item ? addNavbarItem(item) : null;
    }

    case 'navbar_remove': {
      const id = (args as { id?: unknown } | null)?.id;
      if (typeof id !== 'string') return false;

      removeNavbarItem(id);
      return true;
    }

    default:
      return null;
  }
}
