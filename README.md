# ptero-calagopus-theme
A [Pterodactyl](https://github.com/pterodactyl/panel) theme for the [Calagopus](https://github.com/calagopus/panel) panel

Makes the user side of Calagopus look like the classic Pterodactyl panel, while the admin area keeps the stock Calagopus look. See [FEATURES.md](FEATURES.md) for everything it changes, and [EXTENSIONS.md](EXTENSIONS.md) for making other extensions work with it.

## Installation

Extensions need a heavy Docker image of Calagopus (`:heavy`, `:nightly-heavy` or their `-aio` variants), see [Switching to the Heavy Image](https://calagopus.com/docs/panel/extensions/switching-to-the-heavy-image).

Download `dev_lovinoes_pterodactyl.c7s.zip` from the [latest release](https://github.com/Lovinoes/ptero-calagopus-theme/releases/latest) and upload it in **Admin → Extensions**. In a development environment, run `panel-rs extensions add dev_lovinoes_pterodactyl.c7s.zip` followed by `panel-rs extensions apply` instead.

You need Calagopus 1.2.3 or newer.

## Configuration

Open **Admin → Extensions → Pterodactyl Theme** to pick the color palette of the dark mode (Default or Darker), to turn the animations off or change their speed, to turn the loading bar off or change how long loading has to take before it shows up, to choose where the footer goes and what it says, and to choose what sits above the login pages (icon, name, banner or nothing).

## Building

After cloning this repository, pack the extension by running `node scripts/package.mjs` and take the created `.c7s.zip` out of the `dist` directory.

You need Node.js 24 or newer to build ptero-calagopus-theme.

Releases built by GitHub Actions use the build number as their patch version (e.g. `1.1.57`), so the panel always offers a newer build as an update.

To work on the theme in a [Calagopus development environment](https://calagopus.com/docs/panel/extensions/dev-environment), clone this repository into `backend-extensions/dev_lovinoes_pterodactyl` of the panel, link the frontend the same way the panel does with `ln -s ../../backend-extensions/dev_lovinoes_pterodactyl/frontend frontend/extensions/dev_lovinoes_pterodactyl` and run `panel-rs extensions resync`.

## Credits

The look is recreated from the [Pterodactyl panel](https://github.com/pterodactyl/panel) (MIT License, © Dane Everitt and contributors).

Built for [Calagopus](https://github.com/calagopus/panel) (MIT License).

Includes [IBM Plex Sans](https://github.com/IBM/plex) (SIL Open Font License 1.1) and uses icons from [Font Awesome Free](https://fontawesome.com) (CC BY 4.0). See [NOTICE](NOTICE) for the full notices.

This project is not affiliated with or endorsed by Pterodactyl or Calagopus.
