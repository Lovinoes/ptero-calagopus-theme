import { useEffect, useLayoutEffect } from 'react';
import { type NavigateFunction, useLocation, useNavigate } from 'react-router';
import { resolvePteroArea } from '../scope.tsx';

/**
 * Switching between the tabs of a page (Allocations / Firewall / Connections, Mounts / Devices, Backups /
 * System Backups, ...) opens another route, so the page is rebuilt: some tabs show only a spinner until
 * their data is there (the header and the tabs disappear), others an empty list that fills a moment later.
 *
 * Now a tab switch puts a picture of the current page on top (with the clicked tab already active) while
 * the new tab renders underneath, and swaps it for the new tab at once when that has its content (at most
 * MAX_HOLD). Its header and its tabs stay still, only the content below the tabs fades in (with the
 * animations on). The same for every tab bar, the top bar and the sub navigation stay usable all along.
 */
const ROOT_SELECTOR = '#dashboard-root, #server-root';
const PAGE_SELECTOR = '[data-ptero-nav] ~ :is(#dashboard-root, #server-root) > div > div:first-child > *';
// the same pages, inside one page root
const ROOT_PAGE_SELECTOR = ':scope > div > div:first-child > *';
const TAB_LINK_SELECTOR = '.mantine-Tabs-list a[href]';
const PICTURE_CLASS = 'ptero-tab-hold';
const MAX_HOLD = 1500;
// the panel's spinners (a list loading, or a whole page waiting for its data)
const LOADER_SELECTOR = '[data-testid="loader"]';

const normalize = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

let tabTarget: string | null = null;
// the route that is on the page (set once the panel rendered it)
let renderedPath: string | null = null;
// the router's navigate, set by the component below once the router is there
let navigateTo: NavigateFunction | null = null;

interface Hold {
  root: HTMLElement;
  picture: HTMLElement;
  // the page's elements before the switch, the ones the panel keeps don't fade in again
  previousPages: Element[];
  target: string;
  start: number;
  readyChecks: number;
  timer: number;
  rootVisibility: string;
  rootMinHeight: string;
}

let hold: Hold | null = null;

/** A copy keeps neither where its lists were scrolled to nor what was typed into its fields. */
function copyLiveState(from: Element, to: Element) {
  const source = document.createTreeWalker(from, NodeFilter.SHOW_ELEMENT);
  const copy = document.createTreeWalker(to, NodeFilter.SHOW_ELEMENT);

  for (
    let original: Node | null = source.currentNode, clone: Node | null = copy.currentNode;
    original && clone;
    original = source.nextNode(), clone = copy.nextNode()
  ) {
    const element = original as Element;
    const picture = clone as Element;

    if (element.scrollTop || element.scrollLeft) {
      picture.scrollTop = element.scrollTop;
      picture.scrollLeft = element.scrollLeft;
    }

    if (element instanceof HTMLInputElement && picture instanceof HTMLInputElement) {
      if (element.type !== 'file') picture.value = element.value;
      picture.checked = element.checked;
    } else if (
      (element instanceof HTMLTextAreaElement && picture instanceof HTMLTextAreaElement) ||
      (element instanceof HTMLSelectElement && picture instanceof HTMLSelectElement)
    ) {
      picture.value = element.value;
    }
  }
}

function showActiveTab(picture: HTMLElement, target: string) {
  for (const link of picture.querySelectorAll<HTMLAnchorElement>(TAB_LINK_SELECTOR)) {
    const tab = link.querySelector('.mantine-Tabs-tab');
    if (!tab) continue;

    const active = normalize(link.pathname) === target;
    tab.toggleAttribute('data-active', active);
    tab.setAttribute('aria-selected', String(active));
  }
}

/** The parent got a position for the picture, it gets its own back once no picture is left in it. */
function restoreParent(parent: HTMLElement) {
  if (parent.dataset.pteroHoldPosition === undefined || parent.querySelector(`:scope > .${PICTURE_CLASS}`)) return;

  parent.style.position = parent.dataset.pteroHoldPosition;
  delete parent.dataset.pteroHoldPosition;
}

function removePicture(picture: HTMLElement) {
  const parent = picture.parentElement;
  picture.remove();
  if (parent) restoreParent(parent);
}

/** What comes after the tab bar on its page (the content of the tab), not the header or the tabs. */
function contentBelowTabs(root: HTMLElement): Element[] | null {
  const tabs = root.querySelector('.mantine-Tabs-list:has(> a[href])')?.closest('.mantine-Tabs-root');
  const page = tabs ? [...root.querySelectorAll(ROOT_PAGE_SELECTOR)].find((element) => element.contains(tabs)) : null;
  if (!tabs || !page) return null;

  const content: Element[] = [];
  for (let element: Element | null = tabs; element && element !== page; element = element.parentElement) {
    for (let next = element.nextElementSibling; next; next = next.nextElementSibling) content.push(next);
  }

  return content;
}

/**
 * Swaps the picture for the page at once. When the new tab opened, its header and its tabs stay still and
 * only the content below the tabs fades in (with the animations on). When another page was opened, that
 * page fades in as a whole like always. What stayed from the page before (e.g. an alert) doesn't fade.
 */
function endHold(arrived: boolean) {
  const current = hold;
  if (!current) return;

  hold = null;
  window.clearTimeout(current.timer);

  // the new page rendered without its fade while it was hidden behind the picture
  const pages = [...current.root.querySelectorAll(ROOT_PAGE_SELECTOR)].filter(
    (page) => !current.previousPages.includes(page),
  );
  for (const page of pages) page.setAttribute('data-ptero-page', 'still');

  const content = arrived ? contentBelowTabs(current.root) : null;
  for (const element of content ?? []) element.removeAttribute('data-ptero-tab-content');

  // the browser has to see them without the fade once, otherwise it would not start again
  current.root.getBoundingClientRect();
  if (content) {
    for (const element of content) element.setAttribute('data-ptero-tab-content', '');
  } else {
    for (const page of pages) page.setAttribute('data-ptero-page', '');
  }

  current.root.style.visibility = current.rootVisibility;
  current.root.style.minHeight = current.rootMinHeight;
  removePicture(current.picture);
}

function checkHold() {
  const current = hold;
  if (!current) return;

  // Another page was opened (sub navigation, back button), the picture goes once that page is rendered,
  // or the panel kept the page (unsaved changes), then it goes right away.
  const path = normalize(window.location.pathname);
  if (path !== current.target) {
    if (renderedPath === path || performance.now() - current.start >= MAX_HOLD) {
      endHold(false);
    } else {
      current.timer = window.setTimeout(checkHold, 16);
    }
    return;
  }

  // the new tab is rendered and nothing in it is loading, twice in a row in case a request starts late
  const ready =
    renderedPath === current.target &&
    current.root.querySelector(ROOT_PAGE_SELECTOR) !== null &&
    current.root.querySelector(LOADER_SELECTOR) === null;
  current.readyChecks = ready ? current.readyChecks + 1 : 0;

  if (current.readyChecks >= 2 || performance.now() - current.start >= MAX_HOLD) {
    endHold(true);
    return;
  }

  current.timer = window.setTimeout(checkHold, 16);
}

function startHold(root: HTMLElement, target: string) {
  const parent = root.parentElement;
  if (!parent) return;

  if (parent.dataset.pteroHoldPosition === undefined) {
    parent.dataset.pteroHoldPosition = parent.style.position;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  }

  // positioned against the parent, otherwise the picture would not sit where the page is
  if (root.offsetParent !== parent) {
    restoreParent(parent);
    return;
  }

  const picture = root.cloneNode(true) as HTMLElement;
  picture.classList.add(PICTURE_CLASS);
  picture.setAttribute('aria-hidden', 'true');
  Object.assign(picture.style, {
    position: 'absolute',
    top: `${root.offsetTop}px`,
    left: `${root.offsetLeft}px`,
    width: `${root.offsetWidth}px`,
    height: `${root.offsetHeight}px`,
    margin: '0',
    zIndex: '1',
  });

  // after the page, so lookups by id still find the page itself first
  root.after(picture);
  copyLiveState(root, picture);
  showActiveTab(picture, target);

  hold = {
    root,
    picture,
    previousPages: [...root.querySelectorAll(ROOT_PAGE_SELECTOR)],
    target,
    start: performance.now(),
    readyChecks: 0,
    timer: 0,
    rootVisibility: root.style.visibility,
    rootMinHeight: root.style.minHeight,
  };

  // the page keeps its height while the new tab renders hidden under the picture
  root.style.minHeight = `${root.offsetHeight}px`;
  root.style.visibility = 'hidden';

  hold.timer = window.setTimeout(checkHold, 16);
}

const isModified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

function onClick(event: MouseEvent) {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;

  const link = element.closest(TAB_LINK_SELECTOR);

  // the picture only stands in for the page: its tabs switch on, everything else waits for the new tab
  if (element.closest(`.${PICTURE_CLASS}`)) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const current = hold;
    if (!current || !(link instanceof HTMLAnchorElement) || isModified(event)) return;

    const next = normalize(link.pathname);
    if (next === current.target) return;

    if (!navigateTo) {
      endHold(false);
      return;
    }

    tabTarget = next;
    current.target = next;
    current.start = performance.now();
    current.readyChecks = 0;
    showActiveTab(current.picture, next);
    navigateTo(`${link.pathname}${link.search}${link.hash}`);
    return;
  }

  if (!(link instanceof HTMLAnchorElement)) return;

  const target = normalize(link.pathname);

  // clicks the browser handles itself (new tab or window) and the tab that is already open
  if (isModified(event)) return;
  if (link.target && link.target !== '_self') return;
  if (target === normalize(window.location.pathname)) return;

  tabTarget = target;

  // the panel's link navigates as usual, the picture covers the page meanwhile
  const root = link.closest<HTMLElement>(ROOT_SELECTOR);
  if (!root || resolvePteroArea(window.location.pathname) === null) return;
  if (!root.parentElement?.querySelector(':scope > [data-ptero-nav]')) return;

  endHold(false);
  startHold(root, target);
}

/** Remembers which page a tab click opens and keeps the current page up while it loads. */
export function trackTabNavigation() {
  document.addEventListener('click', onClick, true);
}

export default function PteroPageTransitions() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigateTo = navigate;

    return () => {
      if (navigateTo === navigate) navigateTo = null;
    };
  }, [navigate]);

  // runs after the new page is in the DOM but before it is painted, so a skipped fade never shows
  useLayoutEffect(() => {
    renderedPath = normalize(pathname);

    const tabSwitch = tabTarget === renderedPath;
    tabTarget = null;

    for (const page of document.querySelectorAll(PAGE_SELECTOR)) {
      // elements that stay on screen across pages (e.g. alerts) were marked when they appeared
      if (page.hasAttribute('data-ptero-page')) continue;

      page.setAttribute('data-ptero-page', tabSwitch ? 'still' : '');
    }
  }, [pathname]);

  return null;
}
