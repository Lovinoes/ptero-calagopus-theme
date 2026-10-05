import type { MantineTransition, TransitionOverride } from '@mantine/core';
import { type PteroThemeSettings, pteroAnimationScale } from '../settings/schema.ts';
import { getPteroThemeSettings, usePteroThemeSettings } from '../settings/store.ts';

/** Scales a duration by the animation speed an admin picked, 0 when animations are turned off. */
function scaled(settings: PteroThemeSettings, duration: number): number {
  return settings.animations ? Math.round(duration * pteroAnimationScale[settings.animationSpeed]) : 0;
}

/**
 * Pterodactyl's dialogs (components/elements/dialog/Dialog.tsx) open with "ease-out duration-200"
 * from opacity-0 scale-95 and close with "ease-in duration-100".
 */
const dialogScale: MantineTransition = {
  in: { opacity: 1, transform: 'scale(1)' },
  out: { opacity: 0, transform: 'scale(0.95)' },
  transitionProperty: 'opacity, transform',
};

export function getPteroDialogTransition(): TransitionOverride {
  const settings = getPteroThemeSettings();

  return {
    transition: dialogScale,
    duration: scaled(settings, 200),
    exitDuration: scaled(settings, 100),
    timingFunction: 'ease-out',
  };
}

/** Pterodactyl's tooltips pop in quickly (framer-motion scale 0.85 -> 1). */
export function usePteroTooltipTransition(): TransitionOverride {
  const settings = usePteroThemeSettings();

  return { transition: 'pop', duration: scaled(settings, 150) };
}
