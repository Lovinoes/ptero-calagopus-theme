import type { AxiosInstance } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { usePendingPathname } from '@/providers/contexts/pendingNavigationContext.ts';
import { createStore, useStore } from '../core/createStore.ts';
import { resolvePteroArea } from '../core/paths.ts';
import { usePteroThemeSettings } from '../settings/store.ts';
import { isBackgroundRefresh, onTabReturn } from './backgroundRefresh.ts';

// a request that never settles (no response, no error) must not keep the bar up forever
const WATCHDOG = 30_000;
const TRACKING_KEY = '__pteroProgressId';

type TrackableConfig = {
  url?: string;
  onUploadProgress?: unknown;
  onDownloadProgress?: unknown;
  [TRACKING_KEY]?: number;
};

/** The API requests that are running and count for the loading bar. */
const pendingRequests = createStore(0);
const requestTimers = new Map<number, ReturnType<typeof setTimeout>>();
let nextRequestId = 1;

function shouldTrack(config: TrackableConfig): boolean {
  // Pterodactyl skips the resource polling as well; transfers with their own progress are skipped too
  if (config.url?.includes('/resources')) return false;
  if (config.onUploadProgress || config.onDownloadProgress) return false;
  // the refreshes of a tab that is hidden or was just shown again, see backgroundRefresh.ts
  return !isBackgroundRefresh();
}

function startRequest(config: TrackableConfig) {
  if (config[TRACKING_KEY] !== undefined || !shouldTrack(config)) return;

  const id = nextRequestId++;
  config[TRACKING_KEY] = id;
  requestTimers.set(
    id,
    setTimeout(() => finishRequest(id), WATCHDOG),
  );
  pendingRequests.set(pendingRequests.get() + 1);
}

function finishRequest(id: number | undefined) {
  if (id === undefined) return;

  const timer = requestTimers.get(id);
  if (!timer) return;

  clearTimeout(timer);
  requestTimers.delete(id);
  pendingRequests.set(Math.max(0, pendingRequests.get() - 1));
}

/** Counts the API requests of the panel for the loading bar. */
export function trackRequests(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    startRequest(config as TrackableConfig);
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      finishRequest((response.config as TrackableConfig | undefined)?.[TRACKING_KEY]);
      return response;
    },
    (error) => {
      finishRequest((error?.config as TrackableConfig | undefined)?.[TRACKING_KEY]);
      return Promise.reject(error);
    },
  );
}

const randomInt = (low: number, high: number) => Math.floor(Math.random() * (high - low) + low);

/**
 * Pterodactyl's loading bar (components/elements/ProgressBar.tsx): a 2px bar at the top of the page,
 * cyan (blue with the darker palette), that starts at 20-30% while a page opens or API requests run,
 * creeps towards 90% and fills up when they are done. Unlike Pterodactyl it only appears once loading
 * takes longer than the delay an admin set (250ms by default), as Calagopus refreshes some data in the
 * background, which would otherwise make it flicker. Admins can turn it off as well.
 */
export default function PteroProgressBar() {
  const { pathname } = useLocation();
  const { loadingBar, loadingBarDelay } = usePteroThemeSettings();
  const requesting = useStore(pendingRequests, (count) => count > 0);
  // the panel keeps the old page up while the next one loads, that is loading as well (this bar
  // replaces the panel's own one on the themed pages, see styles/loading.css)
  const navigating = usePendingPathname() !== null;
  const loading = (requesting || navigating) && loadingBar;

  const [progress, setProgress] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const clearTimers = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  // timers barely run in a hidden tab, so a bar that was finishing then could still be up on return
  useEffect(
    () =>
      onTabReturn(() => {
        if (loadingRef.current) return;

        clearTimers();
        setShown(false);
        setProgress(null);
      }),
    [],
  );

  // only the loading state starts and finishes the bar (progress and the delay are read without
  // re-running), the progress itself is driven by the effect below
  useEffect(() => {
    clearTimers();

    if (loading) {
      if (progress === null) {
        timers.current.push(
          setTimeout(() => {
            setProgress(randomInt(20, 30));
            setShown(true);
          }, loadingBarDelay),
        );
      } else {
        // a new request came in while the bar was finishing, keep it up
        setShown(true);
        setProgress((current) => Math.min(current ?? 90, 90));
      }
    } else if (progress !== null) {
      setProgress(100);
      timers.current.push(setTimeout(() => setShown(false), 500));
      timers.current.push(setTimeout(() => setProgress(null), 650));
    }
  }, [loading]);

  useEffect(() => {
    if (!loading || progress === null || progress >= 90) return;

    const timer = setTimeout(() => setProgress((current) => Math.min((current ?? 0) + randomInt(1, 5), 90)), 500);
    return () => clearTimeout(timer);
  }, [loading, progress]);

  if (resolvePteroArea(pathname) === null || progress === null) {
    return null;
  }

  return (
    <div className='ptero-progress' aria-hidden>
      <div className='ptero-progress__fill' style={{ width: `${progress}%`, opacity: shown ? 1 : 0 }} />
    </div>
  );
}
