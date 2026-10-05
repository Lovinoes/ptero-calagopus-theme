# Features

Everything ptero-calagopus-theme changes in the [Calagopus](https://github.com/calagopus/panel) panel. Only the user side is themed, the admin area and the first-time setup keep the stock Calagopus look.

## Layout
- Pterodactyl's top navigation bar instead of the Calagopus sidebar, with the stock Calagopus app icon / banner on the left
- Pterodactyl's five icons on the right: search (quick actions), dashboard, admin area, account and sign out
- On a server page the admin icon opens that server in the admin area
- The account avatar opens a menu with the account link, the theme switcher (auto, dark, light), hiding addresses and resetting device overrides
- Pterodactyl's horizontal sub navigation on account and server pages, routes added by other extensions and the admin's route order keep working
- The centered 1200px content column

## Look
- Pterodactyl colors, fonts (IBM Plex Sans headers), boxes, uppercase buttons and inputs
- Dark mode like Pterodactyl, plus a matching light mode
- No flash of the stock Calagopus colors while the panel loads
- Pterodactyl-style dialogs, tooltips, dropdowns and right-click menus
- Tables as Pterodactyl boxes with a dark header bar and small uppercase labels
- Thin scrollbars without arrow buttons

## Pages
- Pterodactyl's server list rows (name, description, allocation, CPU / memory / disk and the status bar), also inside the Calagopus server groups
- The Pterodactyl console page with stat blocks, black terminal, graphs and the Start / Restart / Stop buttons
- Pterodactyl's file list rows, and the file editor in Pterodactyl's ayu-mirage colors (dark mode)
- The image viewer shows the image centered, at its own size or scaled down to fit, with zooming and panning
- The login, register and password reset pages in the same dark Pterodactyl boxes, with the centered title
- The Calagopus-only features (quick actions, server groups, hiding addresses and more) styled to match

## Animations
- Pterodactyl's blue loading bar at the top while a page loads, it only shows up when loading takes a moment, so quick page changes don't flicker
- Pages fade in, dialogs and tooltips pop in like on Pterodactyl
- The page fade and the loading bar's motion follow the browser's reduced motion setting

## Admin settings
In **Admin → Extensions → Pterodactyl Theme**:
- Turn the animations off or change their speed (very slow to very fast)
- Turn the loading bar off or change how long loading has to take before it shows up

## Admin area
- The admin area and the first-time setup are not touched
- The theme can be turned off and on in **Admin → Extensions** without a rebuild
