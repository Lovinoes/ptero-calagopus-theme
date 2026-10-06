import type { ExtensionContext } from 'shared';
import { resolvePteroArea } from '../scope.tsx';
import { getPteroThemeSettings } from '../settings/store.ts';
import { addNavbarItem, parseNavbarItem, removeNavbarItem } from './navbarItems.ts';

/**
 * What other extensions can ask the theme through its extension calls (processCall), documented in
 * EXTENSIONS.md. They call this extension's processCall directly: the panel's own ctx.call() can't
 * pass a call on to the next extension (its ctx.skip() result is never recognized as a skip), so it
 * only ever reaches the first extension.
 *
 * Raise PTERO_API_VERSION when a call is added or changes, extensions can check it before using one.
 * 2: `settings` has `colorPalette`.
 */
export const PTERO_API_VERSION = 2;

const CALL_PREFIX = 'lovinoes_pterodactyl_';

export function handlePteroCall(ctx: ExtensionContext, name: string, args: object): unknown {
  if (!name.startsWith(CALL_PREFIX)) return ctx.skip();

  switch (name.slice(CALL_PREFIX.length)) {
    case 'api_version':
      return PTERO_API_VERSION;

    // whether the page that is open right now has the Pterodactyl look (not the admin area or the setup)
    case 'theme_active':
      return resolvePteroArea(window.location.pathname) !== null;

    // a copy, changing it changes nothing
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

    // a call of a later version of the theme
    default:
      return null;
  }
}
