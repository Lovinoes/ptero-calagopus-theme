import {
  faArrowUpRightFromSquare,
  faCheck,
  faCircleHalfStroke,
  faCogs,
  faEyeSlash,
  faLayerGroup,
  faMoon,
  faRotateLeft,
  faSearch,
  faSignOutAlt,
  faSliders,
  faSun,
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

const isDashboardPath = (pathname: string) =>
  pathname === '/' || pathname === '/all' || pathname === '/grouped' || pathname === '/grouped/';

/**
 * The top bar of Pterodactyl: the stock Calagopus app icon / banner on the left, icon links on the right.
 * Calagopus-only features (quick actions, theme, hiding addresses) are folded into the same icon row.
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
  const { confirmLogout, logoutModal } = useLogoutConfirmation();

  if (!user) {
    return null;
  }

  const suspended = Boolean(user.suspended);
  const accountHidden = suspended || !isNamedRoutePathAccessible(routeOrder, '/');
  const serverId = matchPath({ path: '/server/:id', end: false }, pathname)?.params.id;
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
            <Tooltip label={t('elements.quickActions.trigger', {})} position='bottom'>
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
            <Tooltip label={t('pages.account.home.title', {})} position='bottom'>
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

          {!suspended && serverId && isAdmin(user, 'servers.read') && (
            <Tooltip label={t('pages.server.viewAdmin.title', {})} position='bottom'>
              <Link to={`/admin/servers/${serverId}`} aria-label={t('pages.server.viewAdmin.title', {})}>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </Link>
            </Tooltip>
          )}

          {!suspended && isAdmin(user) && (
            <Tooltip label={t('pages.account.admin.title', {})} position='bottom'>
              <Link to='/admin' aria-label={t('pages.account.admin.title', {})}>
                <FontAwesomeIcon icon={faCogs} />
              </Link>
            </Tooltip>
          )}

          {!accountHidden && (
            <Tooltip label={t('pages.account.account.title', {})} position='bottom'>
              <NavLink to='/account' aria-label={t('pages.account.account.title', {})}>
                <span className='ptero-navbar-avatar'>
                  <Avatar size={20} src={user.avatar} name={displayName} />
                </span>
              </NavLink>
            </Tooltip>
          )}

          <Menu position='bottom-end' shadow='md' width={220} withinPortal>
            <Menu.Target>
              <button type='button' aria-label={t('elements.sidebar.button.theme', {})}>
                <FontAwesomeIcon icon={faSliders} />
              </button>
            </Menu.Target>
            <Menu.Dropdown>
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

          <Tooltip label={logoutLabel} position='bottom'>
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
