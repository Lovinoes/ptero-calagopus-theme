import { z } from 'zod';
import { useUserSetting } from '@/lib/userSettings.ts';

/**
 * The order the servers of "All Servers" were dragged into, a user setting so it follows the account to
 * every device. Only the servers that were moved are in it, the others keep the order of the panel.
 */
const SERVER_ORDER_KEY = 'dev.lovinoes.pterodactyl::server_order';
const serverOrderSchema = z.array(z.string());
const EMPTY_ORDER: string[] = [];

export const useServerOrder = () => useUserSetting(SERVER_ORDER_KEY, serverOrderSchema, EMPTY_ORDER);

/** The servers in the saved order, the ones without a saved position after them in the panel's order. */
export function sortByOrder<T extends { uuid: string }>(servers: T[], order: string[]): T[] {
  const positions = new Map(order.map((uuid, index) => [uuid, index]));

  // Array.prototype.sort is stable, so servers without a saved position keep the panel's order
  return [...servers].sort((a, b) => {
    const positionA = positions.get(a.uuid);
    const positionB = positions.get(b.uuid);

    if (positionA === undefined && positionB === undefined) return 0;
    if (positionA === undefined) return 1;
    if (positionB === undefined) return -1;
    return positionA - positionB;
  });
}

/**
 * Writes the new order of the shown servers (one page of the list) into the saved order: the shown
 * servers take the places the shown servers had, the servers of other pages stay put.
 */
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

  return merged;
}
