# ptero-calagopus-theme
A [Pterodactyl](https://github.com/pterodactyl/panel) theme for the [Calagopus](https://github.com/calagopus/panel) panel

## Features
- Pterodactyl's top navigation bar and horizontal sub navigation instead of the Calagopus sidebar, with the stock Calagopus app icon / banner on the left
- Pterodactyl colors, fonts (IBM Plex Sans headers), boxes, uppercase buttons, inputs and the centered 1200px content column
- Pterodactyl's server list rows (name, description, allocation, CPU / memory / disk and the status bar), also inside the Calagopus server groups
- The Pterodactyl console page with stat blocks, black terminal, graphs and the Start / Restart / Stop buttons, and Pterodactyl's file list rows
- The login, register and password reset pages in the same dark Pterodactyl boxes, with the centered title
- The Calagopus-only features are kept and styled to match: quick actions (search icon), server groups, theme switcher, hiding addresses, routes added by other extensions and the admin's route order
- Dark mode like Pterodactyl, plus a matching light mode
- The admin area and the first-time setup are not touched, they keep the stock Calagopus look
- Can be turned off and on in **Admin → Extensions** without a rebuild

## Installation

Extensions need the `:heavy` (or `:nightly-heavy`) Docker image of Calagopus, see [Switching to the Heavy Image](https://calagopus.com/docs/panel/extensions/switching-to-the-heavy-image).

Download `dev_lovinoes_pterodactyl.c7s.zip` from the [latest release](https://github.com/Lovinoes/ptero-calagopus-theme/releases/latest) and upload it in **Admin → Extensions**. In a development environment, run `panel-rs extensions add dev_lovinoes_pterodactyl.c7s.zip` followed by `panel-rs extensions apply` instead.

You need Calagopus 1.2.3 or newer.

## Building

After cloning this repository, pack the extension by running `node scripts/package.mjs` and take the created `.c7s.zip` out of the `dist` directory.

You need Node.js 24 or newer to build ptero-calagopus-theme.

To work on the theme in a [Calagopus development environment](https://calagopus.com/docs/panel/extensions/dev-environment), clone this repository into `backend-extensions/dev_lovinoes_pterodactyl` of the panel, link the frontend the same way the panel does with `ln -s ../../backend-extensions/dev_lovinoes_pterodactyl/frontend frontend/extensions/dev_lovinoes_pterodactyl` and run `panel-rs extensions resync`.

## Credits

The look is recreated from the [Pterodactyl panel](https://github.com/pterodactyl/panel) (MIT License, © Dane Everitt and contributors).

Built for [Calagopus](https://github.com/calagopus/panel) (MIT License).

Includes [IBM Plex Sans](https://github.com/IBM/plex) (SIL Open Font License 1.1) and uses icons from [Font Awesome Free](https://fontawesome.com) (CC BY 4.0). See [NOTICE](NOTICE) for the full notices.

This project is not affiliated with or endorsed by Pterodactyl or Calagopus.
