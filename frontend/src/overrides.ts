// Core components replaced by this theme. The panel's build reads the `defineOverride(original, replacement)`
// calls in this file (it is never executed) and resolves every import of `original` to `replacement`.
// Inside the replacement, importing the original path still gives the stock component.
import ServerItem from '@/pages/dashboard/home/ServerItem.tsx';
import PteroServerItem from './dashboard/PteroServerItem.tsx';

function defineOverride<T>(original: T, replacement: NoInfer<T>) {
  return { original, replacement };
}

export default [defineOverride(ServerItem, PteroServerItem)];
