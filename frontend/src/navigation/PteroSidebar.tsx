import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mantine/core';
import { ComponentProps, createContext, ReactElement, useContext } from 'react';
import { Link, matchPath, useLocation } from 'react-router';
import type Sidebar from '@/elements/navigation/Sidebar.tsx';
import { isAdmin } from '@/lib/auth/permissions.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { usePteroTooltipTransition } from '../loading/animations.ts';
import { resolvePteroArea } from '../scope.tsx';
import PteroNavigationBar from './PteroNavigationBar.tsx';

type SidebarProps = ComponentProps<typeof Sidebar>;
type SidebarLinkProps = ComponentProps<typeof Sidebar.Link>;

const InPteroSubNavigationContext = createContext(false);

/**
 * Pterodactyl's external link icon at the end of the server sub navigation, to the server in the admin
 * area. It replaces the stock "View in Admin Area" sidebar link and shows under the same conditions.
 */
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
 * Replaces the Calagopus sidebar with the Pterodactyl layout: a top navigation bar, plus a horizontal
 * sub navigation on account and server pages. The links inside the sub navigation are the stock
 * sidebar links (so route ordering, permissions and extension routes keep working), only restyled.
 * The admin area keeps the original sidebar.
 */
export default function PteroSidebar({ original, children }: SidebarProps & { original: ReactElement }) {
  const { pathname } = useLocation();
  const area = resolvePteroArea(pathname);

  if (area === null || area === 'auth') {
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

/**
 * The server sidebar repeats the "Servers" and "Admin" links, which already live in the top navigation
 * bar, so they are left out of the sub navigation. So is "View in Admin Area", Pterodactyl's icon at its
 * end replaces it (PteroServerAdminLink). Admin-configured redirects have no `end` and are kept.
 */
export function PteroSidebarLinkGate({ original, linkProps }: { original: ReactElement; linkProps: SidebarLinkProps }) {
  const inSubNavigation = useContext(InPteroSubNavigationContext);

  if (
    inSubNavigation &&
    linkProps.end &&
    (linkProps.to === '/' || linkProps.to === '/admin' || linkProps.to.startsWith('/admin/'))
  ) {
    return null;
  }

  return original;
}
