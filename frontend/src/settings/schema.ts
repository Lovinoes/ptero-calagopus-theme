import { z } from 'zod';

export const pteroAnimationSpeeds = ['very_slow', 'slow', 'normal', 'fast', 'very_fast'] as const;

export type PteroAnimationSpeed = (typeof pteroAnimationSpeeds)[number];

export const pteroFooterPositions = ['bottom', 'content', 'hidden'] as const;

export type PteroFooterPosition = (typeof pteroFooterPositions)[number];

export const pteroAuthHeaders = ['default', 'icon_name', 'icon', 'name', 'banner', 'banner_name', 'hidden'] as const;

export type PteroAuthHeader = (typeof pteroAuthHeaders)[number];

/** Mirrors ExtensionSettingsData in src/settings.rs, see there for the defaults. */
export const pteroThemeSettingsSchema = z.object({
  animations: z.boolean(),
  animationSpeed: z.enum(pteroAnimationSpeeds),
  loadingBar: z.boolean(),
  loadingBarDelay: z.number().int().min(0).max(10_000),
  footerPosition: z.enum(pteroFooterPositions),
  // the 255 characters are checked by the backend and the form, zod would count emoji twice here
  footerText: z.string(),
  authHeader: z.enum(pteroAuthHeaders),
});

/** The admin form, the footer text gets the backend's length limit there. */
export const pteroThemeSettingsFormSchema = pteroThemeSettingsSchema.extend({
  footerText: z.string().refine((text) => [...text].length <= 255),
});

export type PteroThemeSettings = z.infer<typeof pteroThemeSettingsSchema>;

export const defaultPteroThemeSettings: PteroThemeSettings = {
  animations: true,
  animationSpeed: 'normal',
  loadingBar: true,
  loadingBarDelay: 250,
  footerPosition: 'bottom',
  footerText: '',
  authHeader: 'default',
};

/** Multiplier for every animation duration of the theme. */
export const pteroAnimationScale: Record<PteroAnimationSpeed, number> = {
  very_slow: 2,
  slow: 1.5,
  normal: 1,
  fast: 0.6,
  very_fast: 0.3,
};
