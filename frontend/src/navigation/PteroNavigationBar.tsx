import {
  faCheck,
  faCircleHalfStroke,
  faCogs,
  faEyeSlash,
  faLayerGroup,
  faMoon,
  faRotateLeft,
  faSearch,
  faSignOutAlt,
  faSun,
  faUserCog,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Menu, Tooltip, useMantineColorScheme } from '@mantine/core';
import { Link, matchPath, NavLink, useLocation } from 'react-router';
import AppIcon from '@/elements/AppIcon.tsx';
import Avatar from '@/elements/data-display/Avatar.tsx';
import { useLogoutConfirmation } from '@/elements/useLogoutConfirmation.tsx';
import { isAdmin } from '@/lib/auth/permissions.ts';
import { isNamedRoutePathAccessible } from '@/lib/routes.ts';
import { resetAllDeviceOverrides, useDeviceOverrideCount } from '@/lib/userSettings.ts';
import { useRedactAddresses } from '@/plugins/privacy/useRedactAddresses.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useQuickActionsStore } from '@/stores/quickActions.ts';
import { usePteroTooltipTransition } from '../loading/animations.ts';

const isDashboardPath = (pathname: string) =>
  pathname === '/' || pathname === '/all' || pathname === '/grouped' || pathname === '/grouped/';

const isAccountPath = (pathname: string) => pathname === '/account' || pathname.startsWith('/account/');

/**
 * The top bar of Pterodactyl: the stock Calagopus app icon / banner on the left and Pterodactyl's
 * five icons on the right (search, dashboard, admin, account, sign out). The Calagopus-only settings
 * (theme, hiding addresses) live in the menu of the account avatar, and on a server page the admin
 * icon leads to that server in the admin area.
 */
export default function PteroNavigationBar() {
  const { t } = useTranslations();
  const { pathname } = useLocation();
  const { user, impersonating } = useAuth();

  const routeOrder = useGlobalStore((state) => state.settings.user?.routeOrder);
  const setQuickActionsOpen = useQuickActionsStore((state) => state.setOpen);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [redactAddresses, setRedactAddresses] = useRedactAddresses();
  const deviceOverrideCount = useDeviceOverrideCount();
  const tooltipTransition = usePteroTooltipTransition();
  const { confirmLogout, logoutModal } = useLogoutConfirmation();

  if (!user) {
    return null;
  }

  const suspended = Boolean(user.suspended);
  const accountHidden = suspended || !isNamedRoutePathAccessible(routeOrder, '/');
  const serverId = matchPath({ path: '/server/:id', end: false }, pathname)?.params.id;
  const adminServerLink = !!serverId && isAdmin(user, 'servers.read');
  const adminLabel = adminServerLink ? t('pages.server.viewAdmin.title', {}) : t('pages.account.admin.title', {});
  const displayName = user.nameFirst && user.nameLast ? `${user.nameFirst} ${user.nameLast}` : user.username;
  const logoutLabel = impersonating
    ? t('elements.sidebar.button.stopImpersonating', {})
    : t('elements.sidebar.button.logout', {});

  return (
    <div className='ptero-navbar'>
      <div className='ptero-navbar-inner'>
        <div className='ptero-navbar-logo'>
          <Link to='/' aria-label={t('pages.account.home.title', {})}>
            <AppIcon />
          </Link>
        </div>

        <div className='ptero-navbar-right'>
          {!suspended && (
            <Tooltip
              label={t('elements.quickActions.trigger', {})}
              position='bottom'
              transitionProps={tooltipTransition}
            >
              <button
                type='button'
                aria-label={t('elements.quickActions.trigger', {})}
                onClick={() => setQuickActionsOpen(true)}
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </Tooltip>
          )}

          {!suspended && (
            <Tooltip label={t('pages.account.home.title', {})} position='bottom' transitionProps={tooltipTransition}>
              <NavLink
                to='/'
                aria-label={t('pages.account.home.title', {})}
                className={({ isActive }) => (isActive || isDashboardPath(pathname) ? 'active' : undefined)}
                end
              >
                <FontAwesomeIcon icon={faLayerGroup} />
              </NavLink>
            </Tooltip>
          )}

          {!suspended && isAdmin(user) && (
            <Tooltip label={adminLabel} position='bottom' transitionProps={tooltipTransition}>
              <Link to={adminServerLink ? `/admin/servers/${serverId}` : '/admin'} aria-label={adminLabel}>
                <FontAwesomeIcon icon={faCogs} />
              </Link>
            </Tooltip>
          )}

          <Menu position='bottom-end' shadow='md' width={240} withinPortal>
            <Menu.Target>
              <button type='button' aria-label={displayName} className={isAccountPath(pathname) ? 'active' : undefined}>
                <span className='ptero-navbar-avatar'>
                  <Avatar size={20} src={user.avatar} name={displayName} />
                </span>
              </button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{displayName}</Menu.Label>
              {!accountHidden && (
                <Menu.Item component={Link} to='/account' leftSection={<FontAwesomeIcon icon={faUserCog} />}>
                  {t('pages.account.account.title', {})}
                </Menu.Item>
              )}
              {!accountHidden && <Menu.Divider />}
              <Menu.Label>{t('elements.sidebar.button.theme', {})}</Menu.Label>
              <Menu.Item
                leftSection={<FontAwesomeIcon icon={faCircleHalfStroke} />}
                rightSection={colorScheme === 'auto' && <FontAwesomeIcon icon={faCheck} size='sm' />}
                onClick={() => setColorScheme('auto')}
              >
                {t('elements.sidebar.button.themeAuto', {})}
              </Menu.Item>
              <Menu.Item
                leftSection={<FontAwesomeIcon icon={faMoon} />}
                rightSection={colorScheme === 'dark' && <FontAwesomeIcon icon={faCheck} size='sm' />}
                onClick={() => setColorScheme('dark')}
              >
                {t('elements.sidebar.button.themeDark', {})}
              </Menu.Item>
              <Menu.Item
                leftSection={<FontAwesomeIcon icon={faSun} />}
                rightSection={colorScheme === 'light' && <FontAwesomeIcon icon={faCheck} size='sm' />}
                onClick={() => setColorScheme('light')}
              >
                {t('elements.sidebar.button.themeLight', {})}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<FontAwesomeIcon icon={faEyeSlash} />}
                rightSection={redactAddresses && <FontAwesomeIcon icon={faCheck} size='sm' />}
                onClick={() => setRedactAddresses(!redactAddresses)}
              >
                {t('elements.sidebar.button.redactAddresses', {})}
              </Menu.Item>
              {deviceOverrideCount > 0 && (
                <Menu.Item
                  leftSection={<FontAwesomeIcon icon={faRotateLeft} />}
                  onClick={() => resetAllDeviceOverrides()}
                >
                  {t('elements.sidebar.button.resetDeviceOverrides', { count: deviceOverrideCount })}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>

          <Tooltip label={logoutLabel} position='bottom' transitionProps={tooltipTransition}>
            <button type='button' aria-label={logoutLabel} onClick={confirmLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </Tooltip>
        </div>
      </div>

      {logoutModal}
    </div>
  );
}
