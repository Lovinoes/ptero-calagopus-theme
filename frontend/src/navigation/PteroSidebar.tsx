import { ComponentProps, createContext, ReactElement, useContext } from 'react';
import { useLocation } from 'react-router';
import type Sidebar from '@/elements/navigation/Sidebar.tsx';
import { resolvePteroArea } from '../scope.tsx';
import PteroNavigationBar from './PteroNavigationBar.tsx';

type SidebarProps = ComponentProps<typeof Sidebar>;
type SidebarLinkProps = ComponentProps<typeof Sidebar.Link>;

const InPteroSubNavigationContext = createContext(false);

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
            <div className='ptero-subnav-inner'>{children}</div>
          </nav>
        </InPteroSubNavigationContext.Provider>
      )}
    </div>
  );
}

/**
 * The server sidebar repeats the "Servers", "Admin" and "View in Admin Area" links, which already live
 * in the top navigation bar, so they are left out of the sub navigation. Admin-configured redirects
 * have no `end` and are kept.
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
