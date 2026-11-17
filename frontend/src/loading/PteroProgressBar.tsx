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

const pendingRequests = createStore(0);
const requestTimers = new Map<number, ReturnType<typeof setTimeout>>();
let nextRequestId = 1;

function shouldTrack(config: TrackableConfig): boolean {
  // like Pterodactyl, resource polling does not count
  if (config.url?.includes('/resources')) return false;
  if (config.onUploadProgress || config.onDownloadProgress) return false;
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
 * Pterodactyl's 2px loading bar. Unlike Pterodactyl it waits for the admin's delay (250ms default),
 * so Calagopus' background refreshes don't make it flicker.
 */
export default function PteroProgressBar() {
  const { pathname } = useLocation();
  const { loadingBar, loadingBarDelay } = usePteroThemeSettings();
  const requesting = useStore(pendingRequests, (count) => count > 0);
  // a pending navigation counts as loading too
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

  // timers barely run in hidden tabs, a finishing bar could still be up on return
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

  // only the loading state starts and finishes the bar, the effect below drives the progress
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
