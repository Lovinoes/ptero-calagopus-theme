# Features

Everything ptero-calagopus-theme changes in the [Calagopus](https://github.com/calagopus/panel) panel. Only the user side is themed, the admin area and the first-time setup keep the stock Calagopus look.

## Layout
- Pterodactyl's top navigation bar instead of the Calagopus sidebar, with the stock Calagopus app icon / banner on the left
- Pterodactyl's five icons on the right: search (quick actions), dashboard, admin area, account and sign out
- On a server page the admin icon opens that server in the admin area
- The account avatar opens a menu with the account link, the theme switcher (auto, dark, light), hiding addresses and resetting device overrides
- Pterodactyl's horizontal sub navigation on account and server pages, routes added by other extensions and the admin's route order keep working
- The centered 1200px content column
- The tabs of a page (e.g. All Servers / Grouped Servers, Backups / System Backups) as buttons in a small Pterodactyl box
- The footer sits at the bottom of the window on every page, including the login pages, the file manager and the editor leave room for it

## Look
- Pterodactyl colors, fonts (IBM Plex Sans headers), boxes, uppercase buttons and inputs
- Dark mode like Pterodactyl, plus a matching light mode
- No flash of the stock Calagopus colors while the panel loads
- Pterodactyl-style dialogs, tooltips, dropdowns and right-click menus
- Tables as Pterodactyl boxes with a dark header bar and small uppercase labels
- Code in Pterodactyl's dark boxes, long lines of code blocks (e.g. the backup metadata) wrap instead of running out of the dialog
- The folder picker of Export to Files, Copy and Extract looks like the file list
- Thin scrollbars without arrow buttons

## Pages
- Pterodactyl's server list rows (name, description, allocation, CPU / memory / disk and the status bar), also inside the Calagopus server groups
- The servers in All Servers can be dragged into any order, like the servers of a group, the order is saved with the account
- The Pterodactyl console page with stat blocks, black terminal, graphs and the Start / Restart / Stop buttons
- Pterodactyl's file list rows, and the file editor in Pterodactyl's ayu-mirage colors (dark mode)
- The image viewer shows the image centered, at its own size or scaled down to fit, with zooming and panning
- The login, register and password reset pages in the same dark Pterodactyl boxes, with the centered title
- The Calagopus-only features (quick actions, server groups, hiding addresses and more) styled to match

## Animations and loading
- Pterodactyl's blue loading bar at the top while a page loads, it only shows up when loading takes a moment, so quick page changes don't flicker
- Pages fade in, dialogs and tooltips pop in like on Pterodactyl
- Switching between the tabs of a page (e.g. Backups / System Backups, Allocations / Firewall, Mounts / Devices) keeps the page on screen until the new tab has loaded instead of reloading the whole page
- Lists only dim and show a spinner when loading takes a moment
- The buttons of a list page wait until the list has loaded, so they don't jump into the "No ..." box of an empty list
- The page fade and the loading bar's motion follow the browser's reduced motion setting

## Admin settings
In **Admin → Extensions → Pterodactyl Theme**:
- Turn the animations off or change their speed (very slow to very fast)
- Turn the loading bar off, and change how long loading has to take before the loading bar and the spinners of lists show up
- Put the footer at the bottom of the window, right below the content (like Pterodactyl) or hide it
- Write your own footer text with the variables {app} (panel name), {url} (panel address) and {year} (current year) and links like [text](https://example.com)

## Admin area
- The admin area and the first-time setup are not touched
- The theme can be turned off and on in **Admin → Extensions** without a rebuild
