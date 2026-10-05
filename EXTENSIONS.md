# Extensions

How other Calagopus extensions work together with ptero-calagopus-theme. Everything here is optional: an extension that does none of it still works, it just keeps the default look for its own custom elements.

## What works on its own
- Pages added through the panel's route registry show up in the Pterodactyl sub navigation, in the admin's route order
- Everything built from Mantine and the panel's elements (boxes, tables, buttons, inputs, dialogs, menus, tabs, code) gets the Pterodactyl look
- Components added to the footer (`extensionRegistry.elements.copyright`), quick actions, context menus and global components keep working
- Tailwind's `neutral-*` and `gray-*` colors are mapped to the Pterodactyl grays

## Detecting the theme

### In CSS
While a page has the Pterodactyl look, the `<html>` element has these attributes:

| Attribute | Values |
| --- | --- |
| `data-ptero-theme` | present on every themed page, missing in the admin area and the first-time setup |
| `data-ptero-area` | `auth` (login, register, password pages), `dashboard`, `account` or `server` |
| `data-ptero-animations` | `off` when an admin turned the animations off, missing otherwise. It stays in the admin area too, use it together with `data-ptero-theme` |
| `data-mantine-color-scheme` | `dark` or `light`, set by the panel |

Scope your styles to them, so the admin area keeps your default look:

```css
html[data-ptero-theme] .my-extension-box {
  border-radius: 0.25rem;
  background-color: var(--ptero-gray-700);
}

html[data-ptero-theme][data-mantine-color-scheme="light"] .my-extension-box {
  background-color: #fff;
}
```

### In code
Ask the theme with the `callPteroTheme` helper from [Calls](#calls):

```ts
const themed = callPteroTheme(window.extensionContext, 'theme_active') === true;
```

The answer is for the page that is open right now, ask again after a navigation (e.g. with `useLocation()` from react-router as a dependency). Without the theme installed, or with it disabled, the call returns `null`.

## Colors and other variables
These CSS variables exist on themed pages. Use a fallback (`var(--ptero-gray-700, #3f4d5a)`) if your styles can apply without the theme.

| Variables | What |
| --- | --- |
| `--ptero-gray-50` to `--ptero-gray-900`, `--ptero-black` | the Pterodactyl gray scale, `700` is the color of boxes, `800` of the page |
| `--ptero-blue-50` to `--ptero-blue-900` | the primary color |
| `--ptero-cyan-400` to `--ptero-cyan-600` | the accent of active tabs and the loading bar |
| `--ptero-red-400` to `--ptero-red-600`, `--ptero-green-500`, `--ptero-green-600`, `--ptero-yellow-500`, `--ptero-yellow-600` | status colors |
| `--ptero-shadow`, `--ptero-shadow-md`, `--ptero-shadow-lg` | box shadows |
| `--ptero-font-sans`, `--ptero-font-header` | the body font and the IBM Plex Sans heading font |
| `--ptero-max-width` | the width of the content column (1200px) |
| `--ptero-animation-scale` | multiplier for animation durations, `0` when the animations are off |

To make your own animations follow the admin's animation setting:

```css
html[data-ptero-theme] .my-extension-panel {
  transition: opacity calc(150ms * var(--ptero-animation-scale, 1)) ease-in;
}
```

## Calls
The theme answers calls through its `processCall`. Copy this helper into your extension, it finds the theme among the enabled extensions and returns `null` when the theme isn't installed or is disabled:

```ts
import type { ExtensionContext } from 'shared';

export function callPteroTheme(ctx: ExtensionContext, name: string, args: object = {}): unknown {
  const theme = ctx.extensions.find((extension) => extension.packageName === 'dev.lovinoes.pterodactyl');

  return theme ? theme.processCall(ctx, `lovinoes_pterodactyl_${name}`, args) : null;
}
```

Pass the `ctx` your `initialize` gets, elsewhere `window.extensionContext`. The panel's own `ctx.call()` can't be used for this right now, it only ever reaches the first enabled extension.

| Call | Args | Returns |
| --- | --- | --- |
| `api_version` | `{}` | the version of these calls, currently `1` |
| `theme_active` | `{}` | `true` when the open page has the Pterodactyl look |
| `settings` | `{}` | the theme settings an admin picked (read only), see below |
| `navbar_add` | a navbar item, see below | a function that removes the item again, `null` if the item is invalid |
| `navbar_remove` | `{ id: string }` | `true`, `false` without an id |

New calls raise the version, calls the installed theme doesn't know return `null`. Check the version before relying on a call that came later:

```ts
const version = callPteroTheme(ctx, 'api_version');
if (typeof version === 'number' && version >= 1) {
  // the calls of version 1 are there
}
```

### Settings
`settings` returns:

```ts
interface PteroThemeSettings {
  animations: boolean;
  animationSpeed: 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
  loadingBar: boolean;
  loadingBarDelay: number; // milliseconds
  footerPosition: 'bottom' | 'content' | 'hidden';
  footerText: string;
  authHeader: 'default' | 'icon_name' | 'icon' | 'name' | 'banner' | 'banner_name' | 'hidden';
}
```

## Navigation bar icons
Extensions can add icons to the top navigation bar. They show up after the theme's own icons (search, dashboard, admin) and before the account avatar, with a tooltip and the active underline, like the theme's own icons. They are hidden for suspended users, like the other icons.

```ts
interface PteroNavbarItem {
  id: string; // unique, prefix it with your extension, the same id replaces the item
  label: string; // the tooltip and the accessible name
  icon: React.ReactNode; // a React element (usually a FontAwesomeIcon) or text
  // exactly one of these three
  to?: string; // a page of the panel starting with /, e.g. '/notifications'
  href?: string; // an outside address, opens in a new tab
  onClick?: () => void;
  isActive?: (pathname: string) => boolean; // when it is underlined, by default on `to` and the pages below it
  order?: number; // lower comes first, 0 when left out
}
```

Add them in your extension's `initialize` (with the helper from [Calls](#calls) saved as `callPteroTheme.ts`):

```tsx
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Extension, ExtensionContext } from 'shared';
import { callPteroTheme } from './callPteroTheme.ts';

class MyExtension extends Extension {
  public initialize(ctx: ExtensionContext): void {
    // does nothing (returns null) without the Pterodactyl theme
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

An invalid item (no id or label, more than one of `to`, `href` and `onClick`, ...) is not added, the browser console says why. An icon that fails to render is left out of the bar and logged there too. To remove an item, call the function `navbar_add` returned, or `navbar_remove` with its id.

## Something missing?
If your extension needs something from the theme that isn't here, or something of yours doesn't look right with it, [open an issue](https://github.com/Lovinoes/ptero-calagopus-theme/issues) or send a [pull request](https://github.com/Lovinoes/ptero-calagopus-theme/pulls).
