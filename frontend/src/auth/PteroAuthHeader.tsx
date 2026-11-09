import { useComputedColorScheme } from '@mantine/core';
import classNames from 'classnames';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';
import { useGlobalStore } from '@/stores/global.ts';
import { resolvePteroArea } from '../core/paths.ts';
import type { PteroAuthHeader as PteroAuthHeaderSetting } from '../settings/schema.ts';
import { usePteroThemeSettings } from '../settings/store.ts';

/** What each setting shows, the banner options fall back to the icon while no banner is uploaded. */
function partsOf(setting: Exclude<PteroAuthHeaderSetting, 'default' | 'hidden'>, hasBanner: boolean) {
  const wantsBanner = setting === 'banner' || setting === 'banner_name';

  return {
    banner: wantsBanner && hasBanner,
    icon: setting === 'icon_name' || setting === 'icon' || (wantsBanner && !hasBanner),
    name: setting === 'icon_name' || setting === 'name' || setting === 'banner_name',
  };
}

/**
 * What sits above the login, register and password pages (the panel's AppIcon there). An admin picks
 * it in the theme settings: the panel's own choice, the icon and/or the name, the uploaded banner with
 * or without the name, or nothing. Everywhere else the AppIcon stays as it is.
 */
export default function PteroAuthHeader({ original, className }: { original: ReactElement; className?: string }) {
  const { pathname } = useLocation();
  const { authHeader } = usePteroThemeSettings();
  const app = useGlobalStore((state) => state.settings.app);
  const isLight = useComputedColorScheme('dark') === 'light';

  if (resolvePteroArea(pathname) !== 'auth' || authHeader === 'default') {
    return original;
  }

  if (authHeader === 'hidden') {
    return null;
  }

  const banner = app.banner ? (isLight ? (app.bannerLight ?? app.banner) : app.banner) : null;
  const icon = isLight ? (app.iconLight ?? app.icon) : app.icon;
  const show = partsOf(authHeader, !!banner);
  // the name is the accessible text when it is shown, the images are decoration then
  const imageAlt = show.name ? '' : app.name;

  return (
    <div className={classNames('ptero-auth-header', className)} data-banner={show.banner || undefined}>
      {show.banner && banner && <img src={banner} alt={imageAlt} className='ptero-auth-header__banner' />}
      {show.icon && <img src={icon} alt={imageAlt} className='ptero-auth-header__icon' />}
      {show.name && <h1 className='ptero-auth-header__name'>{app.name}</h1>}
    </div>
  );
}
