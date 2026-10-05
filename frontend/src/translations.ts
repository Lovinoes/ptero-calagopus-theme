import { defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {},
  translations: {
    serverRow: {
      // shown under each resource of a server row, e.g. "of 8 GiB"
      ofLimit: 'of {limit}',
    },
    settings: {
      title: 'Theme Settings',
      animations: {
        label: 'Animations',
        description: 'Fade pages in and animate dialogs and tooltips like Pterodactyl does.',
      },
      animationSpeed: {
        label: 'Animation Speed',
        description: 'How fast those animations play.',
        verySlow: 'Very slow',
        slow: 'Slow',
        normal: 'Normal',
        fast: 'Fast',
        veryFast: 'Very fast',
      },
      loadingBar: {
        label: 'Loading Bar',
        description: 'Show the blue bar at the top of the page while a page is loading.',
      },
      loadingBarDelay: {
        label: 'Loading Delay',
        description:
          'How long (in milliseconds) loading has to take before the loading bar and the spinners of lists show up, so quick page changes do not flicker.',
      },
      footerPosition: {
        label: 'Footer',
        description: 'Where the copyright line goes on every page.',
        bottom: 'At the bottom of the window',
        content: 'Right below the content (like Pterodactyl)',
        hidden: 'Hidden',
      },
      footerText: {
        label: 'Footer Text',
        // {variables} and {links} are filled in by the configuration page, so the syntax shows up literally
        description:
          "Replaces the copyright line, leave it empty for the panel's own one. Variables: {variables} (the panel name, the panel address and the current year). Links: {links}",
      },
      toast: {
        saved: 'The theme settings have been saved.',
      },
    },
  },
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
