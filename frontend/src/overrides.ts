// Core components replaced by this theme. The panel's build reads the `defineOverride(original, replacement)`
// calls in this file (it is never executed) and resolves every import of `original` to `replacement`.
// Inside the replacement, importing the original path still gives the stock component.
import Copyright from '@/elements/Copyright.tsx';
import DashboardHomeAll from '@/pages/dashboard/home/DashboardHomeAll.tsx';
import ServerItem from '@/pages/dashboard/home/ServerItem.tsx';
import PteroDashboardHomeAll from './dashboard/PteroDashboardHomeAll.tsx';
import PteroServerItem from './dashboard/PteroServerItem.tsx';
import PteroCopyright from './footer/PteroCopyright.tsx';

function defineOverride<T>(original: T, replacement: NoInfer<T>) {
  return { original, replacement };
}

export default [
  defineOverride(ServerItem, PteroServerItem),
  // the "All Servers" list, its servers can be dragged into an order
  defineOverride(DashboardHomeAll, PteroDashboardHomeAll),
  // the footer, its text can be set in the theme settings
  defineOverride(Copyright, PteroCopyright),
];
