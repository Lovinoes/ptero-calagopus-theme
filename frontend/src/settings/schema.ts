import { z } from 'zod';

export const pteroAnimationSpeeds = ['very_slow', 'slow', 'normal', 'fast', 'very_fast'] as const;

export type PteroAnimationSpeed = (typeof pteroAnimationSpeeds)[number];

/** Mirrors ExtensionSettingsData in src/settings.rs, see there for the defaults. */
export const pteroThemeSettingsSchema = z.object({
  animations: z.boolean(),
  animationSpeed: z.enum(pteroAnimationSpeeds),
  loadingBar: z.boolean(),
  loadingBarDelay: z.number().int().min(0).max(10_000),
});

export type PteroThemeSettings = z.infer<typeof pteroThemeSettingsSchema>;

export const defaultPteroThemeSettings: PteroThemeSettings = {
  animations: true,
  animationSpeed: 'normal',
  loadingBar: true,
  loadingBarDelay: 250,
};

/** Multiplier for every animation duration of the theme. */
export const pteroAnimationScale: Record<PteroAnimationSpeed, number> = {
  very_slow: 2,
  slow: 1.5,
  normal: 1,
  fast: 0.6,
  very_fast: 0.3,
};
