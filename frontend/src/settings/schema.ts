import { z } from 'zod';
import { getExtTranslations } from '../translations.ts';

export const pteroAnimationSpeeds = ['very_slow', 'slow', 'normal', 'fast', 'very_fast'] as const;
export type PteroAnimationSpeed = (typeof pteroAnimationSpeeds)[number];

export const pteroFooterPositions = ['bottom', 'content', 'hidden'] as const;
export type PteroFooterPosition = (typeof pteroFooterPositions)[number];

export const pteroAuthHeaders = ['default', 'icon_name', 'icon', 'name', 'banner', 'banner_name', 'hidden'] as const;
export type PteroAuthHeader = (typeof pteroAuthHeaders)[number];

export const pteroColorPalettes = ['default', 'darker', 'shadcn'] as const;
export type PteroColorPalette = (typeof pteroColorPalettes)[number];

// backend limits, see src/settings.rs
export const PTERO_MAX_LOADING_BAR_DELAY = 10_000;
export const PTERO_MAX_FOOTER_TEXT_LENGTH = 255;

/** Mirrors ExtensionSettingsData in src/settings.rs. */
export const pteroThemeSettingsSchema = z.object({
  animations: z.boolean(),
  animationSpeed: z.enum(pteroAnimationSpeeds),
  loadingBar: z.boolean(),
  loadingBarDelay: z.number().int().min(0).max(PTERO_MAX_LOADING_BAR_DELAY),
  footerPosition: z.enum(pteroFooterPositions),
  // the form checks the length, zod counts emoji twice
  footerText: z.string(),
  authHeader: z.enum(pteroAuthHeaders),
  colorPalette: z.enum(pteroColorPalettes),
});

export type PteroThemeSettings = z.infer<typeof pteroThemeSettingsSchema>;

export const pteroThemeSettingsFormSchema = pteroThemeSettingsSchema.extend({
  footerText: z.string().refine((text) => [...text].length <= PTERO_MAX_FOOTER_TEXT_LENGTH, {
    // lazy, so it is in the current language
    error: () => getExtTranslations().t('settings.footerText.tooLong', { max: String(PTERO_MAX_FOOTER_TEXT_LENGTH) }),
  }),
});

export const defaultPteroThemeSettings: PteroThemeSettings = {
  animations: true,
  animationSpeed: 'normal',
  loadingBar: true,
  loadingBarDelay: 250,
  footerPosition: 'bottom',
  footerText: '',
  authHeader: 'default',
  colorPalette: 'default',
};

export const pteroAnimationScale: Record<PteroAnimationSpeed, number> = {
  very_slow: 2,
  slow: 1.5,
  normal: 1,
  fast: 0.6,
  very_fast: 0.3,
};
