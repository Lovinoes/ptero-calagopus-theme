# Features

Only the user side is themed. The admin area and the first-time setup keep the stock look.

## Layout
- Pterodactyl's top navigation bar instead of the sidebar, with the panel's icon or banner on the left
- Icons on the right: search (quick actions), dashboard, admin, account, sign out
- Avatar menu with account link, color scheme switch, hide addresses and reset device overrides
- Horizontal sub navigation on account and server pages, with the panel's link icons; extension routes and the admin's route order still work
- Admins get a link from a server page to that server in the admin area
- Centered 1200px content column
- Page tabs (All / Grouped Servers, Backups / System Backups, ...) as buttons in a small box
- Footer at the bottom of the window everywhere; the file manager, editor and crash history leave room for it

## Look
- Pterodactyl colors, IBM Plex Sans headings, boxes, uppercase buttons and inputs
- Dark mode like Pterodactyl, plus a matching light mode
- No flash of stock colors on reload, the loading screen already uses the right palette and scheme
- Pterodactyl-style dialogs, tooltips, dropdowns, context menus and tables
- Code blocks in dark boxes, long lines wrap
- Thin scrollbars

## Pages
- Pterodactyl server rows (name, description, address, CPU / memory / disk, status bar), also inside server groups. Unreachable nodes are shown as such instead of loading forever
- Drag servers in All Servers into your own order, saved with the account
- Enter in the server search opens the first server
- Console with stat blocks, black terminal, graphs and power buttons. Stat values don't scroll sideways, network speeds get their own line
- Resource history and crash history in the same boxes as the console, crash logs in the black terminal
- Pterodactyl activity log for servers and the account. Search, user filter, file diff links and crash links all work
- Pterodactyl file list and the ayu-mirage editor theme (dark mode)
- Image viewer that centers and scales the image, with zoom and pan
- Login, register and password reset pages in Pterodactyl boxes, captchas inside the box

## Animations and loading
- Pterodactyl's loading bar at the top, only shown when loading takes a moment
- Page fade-in, dialog and tooltip pop-in
- Switching tabs keeps the current page up, with the new tab already active, until the new tab has loaded
- Lists only dim and show a spinner when loading is slow
- Coming back to a tab refreshes it quietly
- Respects the browser's reduced motion setting

## Admin settings
In **Admin → Extensions → Pterodactyl Theme**:
- Color palette for dark mode: Default (Pterodactyl's blue grays), Darker (deeper neutral grays with thin outlines and one blue accent) or shadcn (shadcn/ui's neutral grays with softened whites, one font, rounder boxes, plain-case controls, gray buttons, shadcn-style tabs and a gray pill for the open page)
- Animations on/off and their speed
- Loading bar on/off and its delay
- Footer position: bottom of the window, below the content, or hidden
- Footer text with `{app}`, `{url}`, `{year}` and `[text](https://...)` links
- What sits above the login pages: default, icon and/or name, banner with or without name, or nothing

## Other extensions
- Their pages and components keep working and get the Pterodactyl look
- They can add navigation bar icons, read the theme settings and use the theme's colors, see [EXTENSIONS.md](EXTENSIONS.md)
- The theme can be turned on and off in **Admin → Extensions** without a rebuild
