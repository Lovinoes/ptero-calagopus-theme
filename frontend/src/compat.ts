import { type Context, createContext } from 'react';

/**
 * What differs between the Calagopus versions the theme supports: the newest release and the one before
 * (1.2.7 and 1.2.6). The theme is built into both, so it can't import what only the newer one has.
 */

type Translate = (key: string, values: Record<string, string | number>) => string;

/**
 * A panel translation that only one of the versions has, null where the key doesn't exist. The panel's t()
 * throws for an unknown key, it doesn't return the key.
 */
export function optionalTranslation(
  t: unknown,
  key: string,
  values: Record<string, string | number> = {},
): string | null {
  try {
    return (t as Translate)(key, values);
  } catch {
    return null;
  }
}

// Calagopus 1.2.7 opens pages in a React transition, the old page stays until the new one is ready. Its
// context holds the path being opened meanwhile. The glob finds nothing in 1.2.6 (no build error there).
const pendingNavigationModules = import.meta.glob<{ PendingNavigationContext: Context<string | null> }>(
  '/src/providers/contexts/pendingNavigationContext.ts',
  { eager: true },
);

/** The path that is being opened (Calagopus 1.2.7), null when nothing is, always null in 1.2.6. */
export const PendingNavigationContext: Context<string | null> =
  Object.values(pendingNavigationModules)[0]?.PendingNavigationContext ?? createContext<string | null>(null);

/** Sets how many entries a list page shows (the panel's list hook, Calagopus 1.2.7), undefined in 1.2.6. */
export function perPageSetter(table: object): ((perPage: number) => void) | undefined {
  return 'setPerPage' in table && typeof table.setPerPage === 'function'
    ? (table.setPerPage as (perPage: number) => void)
    : undefined;
}
