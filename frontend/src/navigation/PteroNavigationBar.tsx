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
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type MantineColorScheme, Menu, Tooltip, useMantineColorScheme } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import AppIcon from '@/elements/AppIcon.tsx';
import Avatar from '@/elements/data-display/Avatar.tsx';
import { useLogoutConfirmation } from '@/elements/useLogoutConfirmation.tsx';
import { isAdmin } from '@/lib/auth/permissions.ts';
import { isNamedRoutePathAccessible } from '@/lib/routes.ts';
import { resetAllDeviceOverrides, useDeviceOverrideCount } from '@/lib/userSettings.ts';
import { useRedactAddresses } from '@/plugins/privacy/useRedactAddresses.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { usePendingPathname } from '@/providers/contexts/pendingNavigationContext.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useQuickActionsStore } from '@/stores/quickActions.ts';
import { isAccountPath, isServerListPath } from '../core/paths.ts';
import { useNavbarItems } from '../extensionApi/navbarItems.ts';
import { usePteroTooltipTransition } from '../loading/animations.ts';
import ExtensionNavbarItem from './ExtensionNavbarItem.tsx';

/** The color schemes of the account menu, in Pterodactyl's order. */
function useColorSchemeItems(): { scheme: MantineColorScheme; icon: IconDefinition; label: string }[] {
  const { t } = useTranslations();

  return [
    { scheme: 'auto', icon: faCircleHalfStroke, label: t('elements.sidebar.button.themeAuto', {}) },
    { scheme: 'dark', icon: faMoon, label: t('elements.sidebar.button.themeDark', {}) },
    { scheme: 'light', icon: faSun, label: t('elements.sidebar.button.themeLight', {}) },
  ];
}

const checkMark = (checked: boolean) => checked && <FontAwesomeIcon icon={faCheck} size='sm' />;

/**
 * The top bar of Pterodactyl: the stock Calagopus app icon / banner on the left and Pterodactyl's
 * five icons on the right (search, dashboard, admin, account, sign out). The Calagopus-only settings
 * (theme, hiding addresses) live in the menu of the account avatar, the link to a server in the admin
 * area sits at the end of the server sub navigation (PteroSidebar). Other extensions can add icons
 * before the avatar.
 */
export default function PteroNavigationBar() {
  const { t } = useTranslations();
  const { pathname: currentPathname } = useLocation();
  // the panel keeps the old page up while the next one loads, the icon of the next one is underlined
  // meanwhile, like the panel's sidebar links
  const pathname = usePendingPathname() ?? currentPathname;
  const { user, impersonating } = useAuth();

  const routeOrder = useGlobalStore((state) => state.settings.user?.routeOrder);
  const setQuickActionsOpen = useQuickActionsStore((state) => state.setOpen);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const colorSchemeItems = useColorSchemeItems();
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
  const onDashboard = isServerListPath(pathname);
  const searchLabel = t('elements.quickActions.trigger', {});
  const dashboardLabel = t('pages.account.home.title', {});
  const adminLabel = t('pages.account.admin.title', {});
  const displayName = user.nameFirst && user.nameLast ? `${user.nameFirst} ${user.nameLast}` : user.username;
  const logoutLabel = impersonating
    ? t('elements.sidebar.button.stopImpersonating', {})
    : t('elements.sidebar.button.logout', {});

  return (
    <div className='ptero-navbar'>
      <div className='ptero-navbar-inner'>
        <div className='ptero-navbar-logo'>
          <Link to='/' aria-label={dashboardLabel}>
            <AppIcon />
          </Link>
        </div>

        <div className='ptero-navbar-right'>
          {!suspended && (
            <>
              <Tooltip label={searchLabel} position='bottom' transitionProps={tooltipTransition}>
                <button type='button' aria-label={searchLabel} onClick={() => setQuickActionsOpen(true)}>
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </Tooltip>

              <Tooltip label={dashboardLabel} position='bottom' transitionProps={tooltipTransition}>
                <Link
                  to='/'
                  aria-label={dashboardLabel}
                  className={onDashboard ? 'active' : undefined}
                  aria-current={onDashboard ? 'page' : undefined}
                >
                  <FontAwesomeIcon icon={faLayerGroup} />
                </Link>
              </Tooltip>

              {isAdmin(user) && (
                <Tooltip label={adminLabel} position='bottom' transitionProps={tooltipTransition}>
                  <Link to='/admin' aria-label={adminLabel}>
                    <FontAwesomeIcon icon={faCogs} />
                  </Link>
                </Tooltip>
              )}

              {extensionItems.map((item) => (
                <ExtensionNavbarItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  transitionProps={tooltipTransition}
                />
              ))}
            </>
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
                <>
                  <Menu.Item component={Link} to='/account' leftSection={<FontAwesomeIcon icon={faUserCog} />}>
                    {t('pages.account.account.title', {})}
                  </Menu.Item>
                  <Menu.Divider />
                </>
              )}
              <Menu.Label>{t('elements.sidebar.button.theme', {})}</Menu.Label>
              {colorSchemeItems.map(({ scheme, icon, label }) => (
                <Menu.Item
                  key={scheme}
                  leftSection={<FontAwesomeIcon icon={icon} />}
                  rightSection={checkMark(colorScheme === scheme)}
                  onClick={() => setColorScheme(scheme)}
                >
                  {label}
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item
                leftSection={<FontAwesomeIcon icon={faEyeSlash} />}
                rightSection={checkMark(redactAddresses)}
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
