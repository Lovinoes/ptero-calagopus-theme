import type { MantineTransition, TransitionOverride } from '@mantine/core';
import type { PteroThemeSettings } from '../settings/schema.ts';
import { getPteroThemeSettings, pteroAnimationScaleOf, usePteroThemeSettings } from '../settings/store.ts';

function scaled(settings: PteroThemeSettings, duration: number): number {
  return Math.round(duration * pteroAnimationScaleOf(settings));
}

/** Pterodactyl's dialog: ease-out 200ms from opacity-0 scale-95, ease-in 100ms out. */
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

const tooltipTransition = (settings: PteroThemeSettings): TransitionOverride => ({
  transition: 'pop',
  duration: scaled(settings, 150),
});

export const getPteroTooltipTransition = (): TransitionOverride => tooltipTransition(getPteroThemeSettings());

export const usePteroTooltipTransition = (): TransitionOverride => tooltipTransition(usePteroThemeSettings());
