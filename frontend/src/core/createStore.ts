import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  /** Replaces the value and lets the subscribers know, unless it is the same value. */
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

/** A value outside of React that components can follow with useStore(). */
export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;

      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The value of a store, or what `select` makes of it, the component renders again when that changes. */
export function useStore<T, S = T>(store: Store<T>, select?: (value: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => (select ? select(store.get()) : (store.get() as unknown as S)));
}
