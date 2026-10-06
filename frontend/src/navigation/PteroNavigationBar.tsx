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
import { Menu, Tooltip, type TransitionOverride, useMantineColorScheme } from '@mantine/core';
import { Component, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
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
import { type PteroNavbarItem, useNavbarItems } from '../extensionApi/navbarItems.ts';
import { usePteroTooltipTransition } from '../loading/animations.ts';

const isDashboardPath = (pathname: string) =>
  pathname === '/' || pathname === '/all' || pathname === '/grouped' || pathname === '/grouped/';

const isAccountPath = (pathname: string) => pathname === '/account' || pathname.startsWith('/account/');

/** The page of `to` (without its ?query and #hash) and the pages below it, `/` only matches itself. */
function isWithin(pathname: string, to: string) {
  const base = to.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  if (base === '') return pathname === '/';

  return pathname === base || pathname.startsWith(`${base}/`);
}

/** An icon of another extension that fails to render is left out, instead of taking down the whole bar. */
class NavbarItemBoundary extends Component<
  { item: PteroNavbarItem; children: ReactNode },
  { item: PteroNavbarItem; failed: boolean }
> {
  override state = { item: this.props.item, failed: false };

  // a replacement with the same id gets a new try
  static getDerivedStateFromProps(props: { item: PteroNavbarItem }, state: { item: PteroNavbarItem }) {
    return props.item === state.item ? null : { item: props.item, failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error) {
    console.error(`[pterodactyl theme] navbar item "${this.props.item.id}" failed to render`, error);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** An icon another extension added, see extensionApi/navbarItems.ts. */
function ExtensionNavbarItem({
  item,
  pathname,
  transitionProps,
}: {
  item: PteroNavbarItem;
  pathname: string;
  transitionProps: TransitionOverride;
}) {
  let active = false;
  try {
    active = item.isActive ? item.isActive(pathname) : item.to ? isWithin(pathname, item.to) : false;
  } catch (error) {
    console.error(`[pterodactyl theme] isActive of navbar item "${item.id}" failed`, error);
  }

  const className = active ? 'active' : undefined;

  return (
    <Tooltip label={item.label} position='bottom' transitionProps={transitionProps}>
      {item.to ? (
        <Link to={item.to} aria-label={item.label} className={className}>
          {item.icon}
        </Link>
      ) : item.href ? (
        <a href={item.href} target='_blank' rel='noopener noreferrer' aria-label={item.label} className={className}>
          {item.icon}
        </a>
      ) : (
        <button type='button' aria-label={item.label} className={className} onClick={item.onClick}>
          {item.icon}
        </button>
      )}
    </Tooltip>
  );
}

/**
 * The top bar of Pterodactyl: the stock Calagopus app icon / banner on the left and Pterodactyl's
 * five icons on the right (search, dashboard, admin, account, sign out). The Calagopus-only settings
 * (theme, hiding addresses) live in the menu of the account avatar, the link to a server in the admin
 * area sits at the end of the server sub navigation (PteroSidebar). Other extensions can add icons
 * before the avatar.
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
  const extensionItems = useNavbarItems();
  const { confirmLogout, logoutModal } = useLogoutConfirmation();

  if (!user) {
    return null;
  }

  const suspended = Boolean(user.suspended);
  const accountHidden = suspended || !isNamedRoutePathAccessible(routeOrder, '/');
  const adminLabel = t('pages.account.admin.title', {});
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
              <Link to='/admin' aria-label={adminLabel}>
                <FontAwesomeIcon icon={faCogs} />
              </Link>
            </Tooltip>
          )}

          {!suspended &&
            extensionItems.map((item) => (
              <NavbarItemBoundary key={item.id} item={item}>
                <ExtensionNavbarItem item={item} pathname={pathname} transitionProps={tooltipTransition} />
              </NavbarItemBoundary>
            ))}

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
