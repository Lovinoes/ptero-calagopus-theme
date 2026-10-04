import { defineTranslations } from 'shared';

const translations = defineTranslations({
  items: {},
  translations: {
    serverRow: {
      // shown under each resource of a server row, e.g. "of 8 GiB"
      ofLimit: 'of {limit}',
    },
  },
});

export const useExtTranslations = translations.useTranslations.bind(translations);
export const getExtTranslations = translations.getTranslations.bind(translations);

export default translations;
