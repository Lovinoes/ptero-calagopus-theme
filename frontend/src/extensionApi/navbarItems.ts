import { isValidElement, type ReactNode } from 'react';
import { LOG_PREFIX } from '../core/constants.ts';
import { createStore, useStore } from '../core/createStore.ts';

/**
 * Icons other extensions add to the top navigation bar (see EXTENSIONS.md), shown after the theme's
 * own icons and before the account avatar, sorted by `order` and then by when they were added.
 */
export interface PteroNavbarItem {
  /** unique, prefix it with your extension (e.g. `yourname_yourextension_bell`), the same id replaces */
  id: string;
  /** the tooltip and the accessible name */
  label: string;
  /** a React element (usually a FontAwesomeIcon) or text */
  icon: ReactNode;
  /** a page of the panel, e.g. `/notifications` */
  to?: string;
  /** an outside address, opened in a new tab */
  href?: string;
  /** a click handler instead of a link */
  onClick?: () => void;
  /** whether the icon is underlined as active, by default the page of `to` and the pages below it */
  isActive?: (pathname: string) => boolean;
  /** lower numbers come first, 0 when left out */
  order?: number;
}

const items = createStore<PteroNavbarItem[]>([]);
// when an id was first added, it keeps its place when the item is replaced
const insertion = new Map<string, number>();
let addedCount = 0;

const sortItems = (list: PteroNavbarItem[]) =>
  [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (insertion.get(a.id) ?? 0) - (insertion.get(b.id) ?? 0));

function reject(message: string): null {
  console.warn(`${LOG_PREFIX} navbar item not added: ${message}`);
  return null;
}

/** Checks what another extension passed in, a broken item must not take the navigation bar down with it. */
export function parseNavbarItem(value: unknown): PteroNavbarItem | null {
  if (typeof value !== 'object' || value === null) return reject('expected an object');

  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || item.id.trim() === '') return reject('`id` must be a non-empty string');
  if (typeof item.label !== 'string' || item.label.trim() === '') {
    return reject(`\`label\` of "${item.id}" must be a non-empty string`);
  }

  const textIcon = (typeof item.icon === 'string' && item.icon.trim() !== '') || Number.isFinite(item.icon);
  if (!isValidElement(item.icon) && !textIcon) {
    return reject(`\`icon\` of "${item.id}" must be a React element or text`);
  }

  const targets = [item.to, item.href, item.onClick].filter((target) => target !== undefined);
  if (targets.length !== 1) {
    return reject(`"${item.id}" needs exactly one of \`to\`, \`href\` or \`onClick\``);
  }
  // `//host` would be an outside address for the router, those go in `href`
  if (item.to !== undefined && (typeof item.to !== 'string' || !/^\/(?![/\\])/.test(item.to))) {
    return reject(`\`to\` of "${item.id}" must be a panel path starting with /`);
  }
  if (item.href !== undefined && (typeof item.href !== 'string' || !/^https?:\/\//i.test(item.href))) {
    return reject(`\`href\` of "${item.id}" must be an http(s) address`);
  }
  if (item.onClick !== undefined && typeof item.onClick !== 'function') {
    return reject(`\`onClick\` of "${item.id}" must be a function`);
  }
  if (item.isActive !== undefined && typeof item.isActive !== 'function') {
    return reject(`\`isActive\` of "${item.id}" must be a function`);
  }
  if (item.order !== undefined && (typeof item.order !== 'number' || !Number.isFinite(item.order))) {
    return reject(`\`order\` of "${item.id}" must be a number`);
  }

  return {
    id: item.id,
    label: item.label,
    icon: item.icon as ReactNode,
    to: item.to as string | undefined,
    href: item.href as string | undefined,
    onClick: item.onClick as (() => void) | undefined,
    isActive: item.isActive as ((pathname: string) => boolean) | undefined,
    order: item.order as number | undefined,
  };
}

/** Adds (or replaces) an item, the returned function removes it again. */
export function addNavbarItem(item: PteroNavbarItem): () => void {
  if (!insertion.has(item.id)) insertion.set(item.id, addedCount++);

  items.set(sortItems([...items.get().filter((existing) => existing.id !== item.id), item]));

  return () => {
    // only the item added here, a later replacement with the same id stays
    if (items.get().includes(item)) removeNavbarItem(item.id);
  };
}

export function removeNavbarItem(id: string) {
  if (!items.get().some((item) => item.id === id)) return;

  insertion.delete(id);
  items.set(items.get().filter((item) => item.id !== id));
}

export const useNavbarItems = (): PteroNavbarItem[] => useStore(items);
