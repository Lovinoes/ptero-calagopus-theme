import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { resolvePteroArea } from '../scope.tsx';
import { getPteroThemeSettings } from '../settings/store.ts';

/**
 * Switching between the tabs of a page (Backups / System Backups, Allocations / Firewall, Mounts /
 * Devices, ...) opens another route, so the whole page was rebuilt: it faded in again and showed a
 * spinner or an empty list while its data loaded, which looked like a reload. Now a tab switch keeps
 * the current page on screen until the new one has its content (at most MAX_HOLD, or the loading delay
 * an admin set if that is shorter) and then swaps to it, without replaying the page fade.
 */
const PAGE_SELECTOR = '[data-ptero-nav] ~ :is(#dashboard-root, #server-root) > div > div:first-child > *';
const TAB_LINK_SELECTOR = '.mantine-Tabs-list a[href]';
const MAX_HOLD = 400;
// the panel's spinners (a list loading, or a whole page waiting for its data)
const LOADER_SELECTOR = '[data-testid="loader"]';

const normalize = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

let tabTarget: string | null = null;
let replaying = false;

/** The new page is there and done loading (no spinner of a list or of the whole page left). */
function pageReady(target: string, previousPages: Element[]) {
  if (normalize(window.location.pathname) !== target) return false;

  const pages = [...document.querySelectorAll(PAGE_SELECTOR)].filter((page) => !previousPages.includes(page));
  return pages.length > 0 && pages.every((page) => !page.querySelector(LOADER_SELECTOR));
}

function waitForPage(target: string, previousPages: Element[], maxWait: number) {
  return new Promise<void>((resolve) => {
    const start = performance.now();

    // the browser renders nothing while it holds the old page, so no requestAnimationFrame here
    const check = () => {
      if (pageReady(target, previousPages) || performance.now() - start >= maxWait) {
        resolve();
      } else {
        window.setTimeout(check, 16);
      }
    };

    check();
  });
}

function onClick(event: MouseEvent) {
  const link = event.target instanceof Element ? event.target.closest(TAB_LINK_SELECTOR) : null;
  if (!(link instanceof HTMLAnchorElement)) return;

  const target = normalize(link.pathname);
  tabTarget = target;

  // the click that is replayed below, or one the browser handles itself (new tab or window)
  if (replaying || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target && link.target !== '_self') return;
  if (target === normalize(window.location.pathname) || resolvePteroArea(window.location.pathname) === null) return;
  if (typeof document.startViewTransition !== 'function') return;

  // the router may only navigate once the browser took its picture of the current page
  event.preventDefault();
  event.stopImmediatePropagation();

  const previousPages = [...document.querySelectorAll(PAGE_SELECTOR)];
  const maxWait = Math.min(getPteroThemeSettings().loadingBarDelay, MAX_HOLD);
  const root = document.documentElement;

  root.setAttribute('data-ptero-tab-transition', '');

  const transition = document.startViewTransition(() => {
    replaying = true;
    try {
      link.click();
    } finally {
      replaying = false;
    }

    return waitForPage(target, previousPages, maxWait);
  });

  transition.finished
    .catch(() => {
      // a skipped transition still navigated, there is nothing to undo
    })
    .finally(() => root.removeAttribute('data-ptero-tab-transition'));
}

/** Remembers which page a tab click opens and keeps the current page up while it loads. */
export function trackTabNavigation() {
  document.addEventListener('click', onClick, true);
}

export default function PteroPageTransitions() {
  const { pathname } = useLocation();

  // runs after the new page is in the DOM but before it is painted, so a skipped fade never shows
  useLayoutEffect(() => {
    const tabSwitch = tabTarget === normalize(pathname);
    tabTarget = null;

    for (const page of document.querySelectorAll(PAGE_SELECTOR)) {
      // elements that stay on screen across pages (e.g. alerts) were marked when they appeared
      if (page.hasAttribute('data-ptero-page')) continue;

      page.setAttribute('data-ptero-page', tabSwitch ? 'still' : '');
    }
  }, [pathname]);

  return null;
}
