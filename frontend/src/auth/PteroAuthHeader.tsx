import { useComputedColorScheme } from '@mantine/core';
import classNames from 'classnames';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';
import { useGlobalStore } from '@/stores/global.ts';
import { resolvePteroArea } from '../scope.tsx';
import { usePteroThemeSettings } from '../settings/store.ts';

/**
 * What sits above the login, register and password pages (the panel's AppIcon there). An admin picks
 * it in the theme settings: the panel's own choice, the icon and/or the name, the uploaded banner with
 * or without the name, or nothing. The banner options show the icon while no banner is uploaded.
 * Everywhere else the AppIcon stays as it is.
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
  const wantsBanner = authHeader === 'banner' || authHeader === 'banner_name';

  const showBanner = wantsBanner && !!banner;
  const showIcon = authHeader === 'icon_name' || authHeader === 'icon' || (wantsBanner && !banner);
  const showName = authHeader === 'icon_name' || authHeader === 'name' || authHeader === 'banner_name';

  return (
    <div className={classNames('ptero-auth-header', className)} data-banner={showBanner || undefined}>
      {showBanner && banner && (
        <img src={banner} alt={showName ? '' : app.name} className='ptero-auth-header__banner' />
      )}
      {showIcon && <img src={icon} alt={showName ? '' : app.name} className='ptero-auth-header__icon' />}
      {showName && <h1 className='ptero-auth-header__name'>{app.name}</h1>}
    </div>
  );
}
