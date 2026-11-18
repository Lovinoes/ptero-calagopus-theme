import { useEffect, useLayoutEffect } from 'react';
import { type NavigateFunction, useLocation, useNavigate } from 'react-router';
import { normalizePath, resolvePteroArea } from '../core/paths.ts';

/**
 * A tab switch rebuilds the page (spinner or empty list first). Instead a picture of the page stays
 * on top, with the clicked tab active, until the new tab has its content (at most MAX_HOLD).
 */
const ROOT_SELECTOR = '#dashboard-root, #server-root';
const ROOT_PAGE_SELECTOR = ':scope > div > div:first-child > *';
const PAGE_SELECTOR = '[data-ptero-nav] ~ :is(#dashboard-root, #server-root) > div > div:first-child > *';
const TAB_LINK_SELECTOR = '.mantine-Tabs-list a[href]';
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';
const PICTURE_CLASS = 'ptero-tab-hold';
const MAX_HOLD = 1500;
const CHECK_INTERVAL = 16;
// list and page spinners, not server rows: those wait for stats that never come while a node is down
const LOADER_SELECTOR = '[data-testid="loader"]:not(tr *, .ptero-server-row *)';

interface Hold {
  root: HTMLElement;
  picture: HTMLElement;
  previousPages: Element[];
  target: string;
  start: number;
  readyChecks: number;
  timer: number;
  rootVisibility: string;
  rootMinHeight: string;
}

let tabTarget: string | null = null;
let renderedPath: string | null = null;
let navigateTo: NavigateFunction | null = null;
let hold: Hold | null = null;

/** A clone loses scroll positions and typed input, copy them over. */
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

    const active = normalizePath(link.pathname) === target;
    tab.toggleAttribute('data-active', active);
    tab.setAttribute('aria-selected', String(active));
  }
}

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

/** Swaps the picture for the page. A new tab fades in below its tab bar, another page fades as a whole. */
function endHold(arrived: boolean) {
  const current = hold;
  if (!current) return;

  hold = null;
  window.clearTimeout(current.timer);

  const pages = [...current.root.querySelectorAll(ROOT_PAGE_SELECTOR)].filter(
    (page) => !current.previousPages.includes(page),
  );
  for (const page of pages) page.setAttribute('data-ptero-page', 'still');

  const content = arrived ? contentBelowTabs(current.root) : null;
  for (const element of content ?? []) element.removeAttribute('data-ptero-tab-content');

  if (content || !arrived) {
    // force a style flush so the fade restarts
    current.root.getBoundingClientRect();
    if (content) {
      for (const element of content) element.setAttribute('data-ptero-tab-content', '');
    } else {
      for (const page of pages) page.setAttribute('data-ptero-page', '');
    }
  }

  current.root.style.visibility = current.rootVisibility;
  current.root.style.minHeight = current.rootMinHeight;
  removePicture(current.picture);
}

function checkHold() {
  const current = hold;
  if (!current) return;

  const timedOut = performance.now() - current.start >= MAX_HOLD;

  // another page was opened, or the panel kept this one (unsaved changes)
  const path = normalizePath(window.location.pathname);
  if (path !== current.target) {
    if (renderedPath === path || timedOut) {
      // the tab never opened (unsaved changes), a later visit of it is no tab switch
      if (tabTarget === current.target) tabTarget = null;
      endHold(false);
    } else {
      current.timer = window.setTimeout(checkHold, CHECK_INTERVAL);
    }
    return;
  }

  // rendered and nothing loading, twice in a row in case a request starts late
  const ready =
    renderedPath === current.target &&
    current.root.querySelector(ROOT_PAGE_SELECTOR) !== null &&
    current.root.querySelector(LOADER_SELECTOR) === null;
  current.readyChecks = ready ? current.readyChecks + 1 : 0;

  if (current.readyChecks >= 2 || timedOut) {
    endHold(true);
    return;
  }

  current.timer = window.setTimeout(checkHold, CHECK_INTERVAL);
}

function startHold(root: HTMLElement, target: string) {
  const parent = root.parentElement;
  if (!parent) return;

  if (parent.dataset.pteroHoldPosition === undefined) {
    parent.dataset.pteroHoldPosition = parent.style.position;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  }

  if (root.offsetParent !== parent) {
    restoreParent(parent);
    return;
  }

  const picture = root.cloneNode(true) as HTMLElement;
  picture.classList.add(PICTURE_CLASS);
  picture.setAttribute('aria-hidden', 'true');
  // the copy must not uncheck the page's radio groups or take focus; not inert, its tabs take clicks
  for (const radio of picture.querySelectorAll('input[type="radio"][name]')) radio.removeAttribute('name');
  for (const element of picture.querySelectorAll(FOCUSABLE_SELECTOR)) element.setAttribute('tabindex', '-1');
  Object.assign(picture.style, {
    position: 'absolute',
    top: `${root.offsetTop}px`,
    left: `${root.offsetLeft}px`,
    width: `${root.offsetWidth}px`,
    height: `${root.offsetHeight}px`,
    margin: '0',
    zIndex: '1',
  });

  // after the page, so id lookups still find the page first
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

  root.style.minHeight = `${root.offsetHeight}px`;
  root.style.visibility = 'hidden';

  hold.timer = window.setTimeout(checkHold, CHECK_INTERVAL);
}

const isModified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

function onPictureClick(event: MouseEvent, link: Element | null) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const current = hold;
  if (!current || !(link instanceof HTMLAnchorElement) || isModified(event)) return;

  const next = normalizePath(link.pathname);
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
}

function onClick(event: MouseEvent) {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;

  const link = element.closest(TAB_LINK_SELECTOR);

  if (element.closest(`.${PICTURE_CLASS}`)) {
    onPictureClick(event, link);
    return;
  }

  if (!(link instanceof HTMLAnchorElement)) return;

  const target = normalizePath(link.pathname);
  if (isModified(event)) return;
  if (link.target && link.target !== '_self') return;
  if (target === normalizePath(window.location.pathname)) return;

  tabTarget = target;

  const root = link.closest<HTMLElement>(ROOT_SELECTOR);
  if (!root || resolvePteroArea(window.location.pathname) === null) return;
  if (!root.parentElement?.querySelector(':scope > [data-ptero-nav]')) return;

  endHold(false);
  startHold(root, target);
}

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

  // after the DOM update, before paint, so a skipped fade never shows
  useLayoutEffect(() => {
    renderedPath = normalizePath(pathname);

    const tabSwitch = tabTarget === renderedPath;
    tabTarget = null;

    for (const page of document.querySelectorAll(PAGE_SELECTOR)) {
      // elements that stay across pages (e.g. alerts) were marked already
      if (page.hasAttribute('data-ptero-page')) continue;

      page.setAttribute('data-ptero-page', tabSwitch ? 'still' : '');
    }
  }, [pathname]);

  return null;
}
