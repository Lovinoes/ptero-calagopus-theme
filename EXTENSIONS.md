# Extensions

How other Calagopus extensions can work with the theme. All of this is optional.

## Works out of the box
- Routes from the route registry show up in the sub navigation, in the admin's order
- Anything built from Mantine and the panel's elements gets the Pterodactyl look
- Footer components (`extensionRegistry.elements.copyright`), quick actions, context menus and global components keep working
- Tailwind's `neutral-*` and `gray-*` map to the Pterodactyl grays

## Detecting the theme

### CSS
On themed pages `<html>` has these attributes:

| Attribute | Values |
| --- | --- |
| `data-ptero-theme` | set on themed pages, missing in the admin area and first-time setup |
| `data-ptero-area` | `auth`, `dashboard`, `account` or `server` |
| `data-ptero-animations` | `off` when animations are disabled. Also set in the admin area, so combine it with `data-ptero-theme` |
| `data-ptero-palette` | `darker` or `shadcn` when that palette is picked, missing for the default one. Both only change the dark scheme, and shadcn builds on darker (`[data-ptero-palette]` matches both). Also set in the admin area, so combine it with `data-ptero-theme` |
| `data-mantine-color-scheme` | `dark` or `light`, set by the panel |

```css
html[data-ptero-theme] .my-extension-box {
  border-radius: 0.25rem;
  background-color: var(--ptero-gray-700);
}

html[data-ptero-theme][data-mantine-color-scheme='light'] .my-extension-box {
  background-color: #fff;
}
```

### Code
With the `callPteroTheme` helper from [Calls](#calls):

```ts
const themed = callPteroTheme(window.extensionContext, 'theme_active') === true;
```

The answer is for the current page, so ask again after navigating. Returns `null` without the theme.

## CSS variables
Available on themed pages. Add a fallback (`var(--ptero-gray-700, #3f4d5a)`) if your styles also apply without the theme.

| Variables | What |
| --- | --- |
| `--ptero-gray-50` … `--ptero-gray-900`, `--ptero-black` | gray scale, `700` = boxes, `800` = page. Darker and shadcn palettes: their own neutral grays |
| `--ptero-blue-50` … `--ptero-blue-900` | primary color. Darker palette: `300`–`500` hold `600`. shadcn palette: neutral grays, `600` fills, `300` light text |
| `--ptero-cyan-400` … `--ptero-cyan-600` | accent for active tabs and the loading bar. Darker palette: `--ptero-blue-600`. shadcn palette: near white |
| `--ptero-red-400` … `--ptero-red-700`, same for `orange`, `yellow`, `green` | `400` text, `500` fill, `600` hover. Darker palette: fill `600`, hover `700` |
| `--ptero-darker-line`, `--ptero-darker-raised`, `--ptero-darker-input`, `--ptero-darker-input-line` | darker and shadcn palettes only: box outline, raised surface, input fill and border |
| `--ptero-shadow`, `--ptero-shadow-md`, `--ptero-shadow-lg` | box shadows |
| `--ptero-font-sans`, `--ptero-font-header` | body font, IBM Plex Sans headings |
| `--ptero-max-width` | content column width (1200px) |
| `--ptero-animation-scale` | duration multiplier, `0` when animations are off |

```css
html[data-ptero-theme] .my-extension-panel {
  transition: opacity calc(150ms * var(--ptero-animation-scale, 1)) ease-in;
}
```

## Calls
Copy this helper into your extension. It returns `null` when the theme isn't installed or is disabled:

```ts
import type { ExtensionContext } from 'shared';

export function callPteroTheme(ctx: ExtensionContext, name: string, args: object = {}): unknown {
  const theme = ctx.extensions.find((extension) => extension.packageName === 'dev.lovinoes.pterodactyl');

  return theme ? theme.processCall(ctx, `lovinoes_pterodactyl_${name}`, args) : null;
}
```

Pass the `ctx` from `initialize`, or `window.extensionContext` elsewhere. The panel's `ctx.call()` doesn't work for this, it only reaches the first enabled extension.

| Call | Args | Returns |
| --- | --- | --- |
| `api_version` | `{}` | `3` |
| `theme_active` | `{}` | `true` if the current page is themed |
| `settings` | `{}` | the theme settings (read only) |
| `navbar_add` | a navbar item | a function that removes it, or `null` if the item is invalid |
| `navbar_remove` | `{ id: string }` | `true`, or `false` without an id |

Unknown calls return `null`. The version goes up when calls change; version 2 added `colorPalette` to `settings`, version 3 its `shadcn` value.

```ts
const version = callPteroTheme(ctx, 'api_version');
if (typeof version === 'number' && version >= 2) {
  // settings has colorPalette
}
```

### Settings
```ts
interface PteroThemeSettings {
  animations: boolean;
  animationSpeed: 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
  loadingBar: boolean;
  loadingBarDelay: number; // ms
  footerPosition: 'bottom' | 'content' | 'hidden';
  footerText: string;
  authHeader: 'default' | 'icon_name' | 'icon' | 'name' | 'banner' | 'banner_name' | 'hidden';
  colorPalette: 'default' | 'darker' | 'shadcn'; // since version 2, 'shadcn' since 3
}
```

## Navigation bar icons
Extra icons go after the theme's own (search, dashboard, admin) and before the avatar, with a tooltip and the active underline. Hidden for suspended users.

```ts
interface PteroNavbarItem {
  id: string; // unique, prefix it with your extension; the same id replaces the item
  label: string; // tooltip and accessible name
  icon: React.ReactNode;
  // exactly one of these three
  to?: string; // panel page starting with /
  href?: string; // external link, opens in a new tab
  onClick?: () => void;
  isActive?: (pathname: string) => boolean; // default: `to` and pages below it
  order?: number; // lower first, default 0
}
```

```tsx
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Extension, ExtensionContext } from 'shared';
import { callPteroTheme } from './callPteroTheme.ts';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    // no-op without the theme
    callPteroTheme(ctx, 'navbar_add', {
      id: 'yourname_yourextension_notifications',
      label: 'Notifications',
      icon: <FontAwesomeIcon icon={faBell} />,
      to: '/notifications',
    });
  }
}

export default new MyExtension();
```

Invalid items are skipped with a console message, and so are icons that fail to render. Remove an item with the function `navbar_add` returned, or with `navbar_remove`.

## Conflicts
The panel build fails if two extensions do either of these:

- **Replace the same component.** The theme replaces these (`src/overrides.ts`):

  | Component | For |
  | --- | --- |
  | `elements/Copyright.tsx` | custom footer text |
  | `elements/data-display/StatCard.tsx` | console, resource history and database stat blocks |
  | `pages/dashboard/home/ServerItem.tsx` | server rows |
  | `pages/dashboard/home/DashboardHomeAll.tsx` | draggable server order |
  | `pages/server/activity/ServerActivity.tsx` | server activity log |
  | `pages/dashboard/activity/DashboardActivity.tsx` | account activity log |

  The replacements keep the same extension slots and registries, so hooking into them still works.
- **Ship a `src/boot.html`.** The theme uses one for its loading screen, and only one extension can.

## Missing something?
[Open an issue](https://github.com/Lovinoes/ptero-calagopus-theme/issues) or send a [pull request](https://github.com/Lovinoes/ptero-calagopus-theme/pulls).
