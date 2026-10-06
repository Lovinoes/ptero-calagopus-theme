# Features

Everything ptero-calagopus-theme changes in the [Calagopus](https://github.com/calagopus/panel) panel. Only the user side is themed, the admin area and the first-time setup keep the stock Calagopus look.

## Layout
- Pterodactyl's top navigation bar instead of the Calagopus sidebar, with the stock Calagopus app icon / banner on the left
- Pterodactyl's five icons on the right: search (quick actions), dashboard, admin area, account and sign out
- On a server page, admins get Pterodactyl's external link icon at the end of the sub navigation, which opens that server in the admin area
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
- The values of the stat blocks stay still instead of scrolling sideways, the network speeds sit on their own line below the traffic
- Pterodactyl's activity log on the activity pages of a server and of the account: the avatar, "user — event", the IP and how long ago, the details on the right. The search, the filter by user and the file diff links work as before
- Pterodactyl's file list rows, and the file editor in Pterodactyl's ayu-mirage colors (dark mode)
- The image viewer shows the image centered, at its own size or scaled down to fit, with zooming and panning
- The login, register and password reset pages in the same dark Pterodactyl boxes, with the centered title
- Captchas (Turnstile, hCaptcha, reCAPTCHA, ...) sit at the bottom of the login box instead of on their own below it
- The Calagopus-only features (quick actions, server groups, hiding addresses and more) styled to match

## Animations and loading
- Pterodactyl's cyan loading bar at the top while a page loads, it only shows up when loading takes a moment, so quick page changes don't flicker
- Pages fade in, dialogs and tooltips pop in like on Pterodactyl
- Switching between the tabs of a page (e.g. Allocations / Firewall / Connections, Mounts / Devices, Backups / System Backups) keeps the page on screen, with the clicked tab already active, until the new tab has loaded, instead of showing a spinner or an empty list first. The header and the tabs stay still, only the content below the tabs fades in when the animations are on. The top bar and the sub navigation stay usable meanwhile
- Lists only dim and show a spinner when loading takes a moment
- Coming back to a tab reloads its data quietly, without the loading bar or loading lists
- The buttons of a list page wait until the list has loaded, so they don't jump into the "No ..." box of an empty list
- The page fade and the loading bar's motion follow the browser's reduced motion setting

## Admin settings
In **Admin → Extensions → Pterodactyl Theme**:
- Pick the color palette of the dark mode: Default (Pterodactyl's blue-tinted grays) or Darker (deeper, neutral grays after Pterodactyl's dark theme extension, with flat bars divided by thin lines)
- Turn the animations off or change their speed (very slow to very fast)
- Turn the loading bar off, and change how long loading has to take before the loading bar and the spinners of lists show up
- Put the footer at the bottom of the window, right below the content (like Pterodactyl) or hide it
- Write your own footer text with the variables {app} (panel name), {url} (panel address) and {year} (current year) and links like [text](https://example.com), links keep the footer's color
- Choose what sits above the login pages: the panel's default, icon and name, only the icon, only the name, the uploaded banner, banner and name, or nothing

## Other extensions
- Pages, footer components and other additions of other extensions keep working and get the Pterodactyl look
- Other extensions can add icons to the top navigation bar, read the theme settings and style their own parts with the theme's colors, see [EXTENSIONS.md](EXTENSIONS.md)

## Admin area
- The admin area and the first-time setup are not touched
- The theme can be turned off and on in **Admin → Extensions** without a rebuild
