import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mantine/core';
import { type ComponentProps, createContext, type ReactElement, useContext } from 'react';
import { Link, matchPath, useLocation } from 'react-router';
import type Sidebar from '@/elements/navigation/Sidebar.tsx';
import { isAdmin } from '@/lib/auth/permissions.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { isWithin, resolvePteroArea } from '../core/paths.ts';
import { usePteroTooltipTransition } from '../loading/animations.ts';
import PteroNavigationBar from './PteroNavigationBar.tsx';

type SidebarProps = ComponentProps<typeof Sidebar>;
type SidebarLinkProps = ComponentProps<typeof Sidebar.Link>;

const InPteroSubNavigationContext = createContext(false);

/** Pterodactyl's admin link icon at the end of the server sub navigation, replaces "View in Admin Area". */
function PteroServerAdminLink({ pathname }: { pathname: string }) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const tooltipTransition = usePteroTooltipTransition();

  const serverId = matchPath({ path: '/server/:id', end: false }, pathname)?.params.id;
  if (!user || user.suspended || !serverId || !isAdmin(user, 'servers.read')) return null;

  const label = t('pages.server.viewAdmin.title', {});

  return (
    <Tooltip label={label} position='bottom' transitionProps={tooltipTransition}>
      <Link to={`/admin/servers/${serverId}`} aria-label={label} className='ptero-subnav-admin'>
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
      </Link>
    </Tooltip>
  );
}

/**
 * The top bar plus a horizontal sub navigation made of the stock sidebar links (ordering, permissions
 * and extension routes keep working). The admin area keeps the stock sidebar.
 */
export default function PteroSidebar({ original, children }: SidebarProps & { original: ReactElement }) {
  const { pathname } = useLocation();
  const area = resolvePteroArea(pathname);

  if (area === null) {
    return original;
  }

  return (
    <div data-ptero-nav className='ptero-nav'>
      <PteroNavigationBar />

      {(area === 'server' || area === 'account') && (
        <InPteroSubNavigationContext.Provider value>
          <nav className='ptero-subnav'>
            <div className='ptero-subnav-inner'>
              {children}
              {area === 'server' && <PteroServerAdminLink pathname={pathname} />}
            </div>
          </nav>
        </InPteroSubNavigationContext.Provider>
      )}
    </div>
  );
}

/** Drops links the top bar already has (Servers, Admin, View in Admin Area). Redirects have no `end` and stay. */
export function PteroSidebarLinkGate({ original, linkProps }: { original: ReactElement; linkProps: SidebarLinkProps }) {
  const inSubNavigation = useContext(InPteroSubNavigationContext);
  const repeatsTopBar = linkProps.end && (linkProps.to === '/' || isWithin(linkProps.to, '/admin'));

  return inSubNavigation && repeatsTopBar ? null : original;
}
