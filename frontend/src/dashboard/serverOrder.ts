import { z } from 'zod';
import { useUserSetting } from '@/lib/userSettings.ts';

/** Order of the dragged servers of All Servers, a user setting. Unmoved servers keep the panel order. */
const SERVER_ORDER_KEY = 'dev.lovinoes.pterodactyl::server_order';
const serverOrderSchema = z.array(z.string());
const EMPTY_ORDER: string[] = [];
// shortcut: deleted servers can't be told apart from other users' ones, so the order is capped instead of
// cleaned up, raise it if accounts ever see more servers than this
const MAX_ORDER = 500;

export const useServerOrder = () => useUserSetting(SERVER_ORDER_KEY, serverOrderSchema, EMPTY_ORDER);

export function sortByOrder<T extends { uuid: string }>(servers: T[], order: string[]): T[] {
  const positions = new Map(order.map((uuid, index) => [uuid, index]));

  // stable sort: servers without a position keep the panel's order
  return [...servers].sort((a, b) => {
    const positionA = positions.get(a.uuid);
    const positionB = positions.get(b.uuid);

    if (positionA === undefined && positionB === undefined) return 0;
    if (positionA === undefined) return 1;
    if (positionB === undefined) return -1;
    return positionA - positionB;
  });
}

/** Writes a reordered page into the saved order, other pages' servers stay put. */
export function mergeOrder(order: string[], shown: string[], reordered: string[]): string[] {
  const merged = [...order];
  for (const uuid of shown) {
    if (!merged.includes(uuid)) merged.push(uuid);
  }

  const reorderedSet = new Set(reordered);
  const slots = merged.flatMap((uuid, index) => (reorderedSet.has(uuid) ? [index] : []));
  slots.forEach((slot, index) => {
    merged[slot] = reordered[index];
  });

  // the shown page keeps its order even past the cap
  const shownSet = new Set(shown);
  return merged.filter((uuid, index) => index < MAX_ORDER || shownSet.has(uuid));
}
