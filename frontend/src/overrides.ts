// Panel components this theme replaces. The build reads defineOverride() (this file never runs) and
// resolves every import of the original to the replacement; inside a replacement the original path is
// still the stock component. Two extensions can't replace the same one, keep EXTENSIONS.md in step.
import Copyright from '@/elements/Copyright.tsx';
import StatCard from '@/elements/data-display/StatCard.tsx';
import DashboardActivity from '@/pages/dashboard/activity/DashboardActivity.tsx';
import DashboardHomeAll from '@/pages/dashboard/home/DashboardHomeAll.tsx';
import ServerItem from '@/pages/dashboard/home/ServerItem.tsx';
import ServerActivity from '@/pages/server/activity/ServerActivity.tsx';
import PteroDashboardActivity from './activity/PteroDashboardActivity.tsx';
import PteroServerActivity from './activity/PteroServerActivity.tsx';
import PteroStatCard from './console/PteroStatCard.tsx';
import PteroDashboardHomeAll from './dashboard/PteroDashboardHomeAll.tsx';
import PteroServerItem from './dashboard/PteroServerItem.tsx';
import PteroCopyright from './footer/PteroCopyright.tsx';

function defineOverride<T>(original: T, replacement: NoInfer<T>) {
  return { original, replacement };
}

export default [
  defineOverride(ServerItem, PteroServerItem),
  defineOverride(DashboardHomeAll, PteroDashboardHomeAll),
  defineOverride(Copyright, PteroCopyright),
  defineOverride(StatCard, PteroStatCard),
  defineOverride(ServerActivity, PteroServerActivity),
  defineOverride(DashboardActivity, PteroDashboardActivity),
];
