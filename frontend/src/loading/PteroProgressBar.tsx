import type { AxiosInstance } from 'axios';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { resolvePteroArea } from '../scope.tsx';
import { usePteroThemeSettings } from '../settings/store.ts';

// a request that never settles (no response, no error) must not keep the bar up forever
const WATCHDOG = 30_000;
const TRACKING_KEY = '__pteroProgressId';

let pendingRequests = 0;
let nextRequestId = 1;
const requestTimers = new Map<number, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const isLoading = () => pendingRequests > 0;

type TrackableConfig = {
  url?: string;
  onUploadProgress?: unknown;
  onDownloadProgress?: unknown;
  [TRACKING_KEY]?: number;
};

function shouldTrack(config: TrackableConfig) {
  // Pterodactyl skips the resource polling as well; transfers with their own progress are skipped too
  if (config.url?.includes('/resources')) return false;
  if (config.onUploadProgress || config.onDownloadProgress) return false;

  return true;
}

function finishRequest(id: number | undefined) {
  if (id === undefined) return;

  const timer = requestTimers.get(id);
  if (!timer) return;

  clearTimeout(timer);
  requestTimers.delete(id);
  pendingRequests = Math.max(0, pendingRequests - 1);
  emit();
}

function startRequest(config: TrackableConfig) {
  if (!shouldTrack(config) || config[TRACKING_KEY] !== undefined) return;

  const id = nextRequestId++;
  config[TRACKING_KEY] = id;
  requestTimers.set(
    id,
    setTimeout(() => finishRequest(id), WATCHDOG),
  );
  pendingRequests++;
  emit();
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
 * Pterodactyl's loading bar (components/elements/ProgressBar.tsx): a 2px cyan bar at the top of the
 * page that starts at 20-30% while API requests are running, creeps towards 90% and fills up when
 * they are done. Unlike Pterodactyl it only appears once a request takes longer than the delay an
 * admin set (250ms by default), as Calagopus refreshes some data in the background, which would
 * otherwise make it flicker. Admins can turn it off as well.
 */
export default function PteroProgressBar() {
  const { pathname } = useLocation();
  const { loadingBar, loadingBarDelay } = usePteroThemeSettings();
  const loading = useSyncExternalStore(subscribe, isLoading) && loadingBar;
  const [progress, setProgress] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

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
