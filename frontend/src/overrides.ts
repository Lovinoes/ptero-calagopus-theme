// The panel components this theme replaces. The panel's build reads the defineOverride() calls (this file
// never runs) and resolves every import of the original to the replacement. Inside a replacement the
// original path still gives the stock component, which it renders off the themed pages.
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
  // the rows of the server lists as Pterodactyl's server rows
  defineOverride(ServerItem, PteroServerItem),
  // the "All Servers" list, its servers can be dragged into an order
  defineOverride(DashboardHomeAll, PteroDashboardHomeAll),
  // the footer, its text can be set in the theme settings
  defineOverride(Copyright, PteroCopyright),
  // the stat cards of the console, the value is cut off instead of scrolling, the details get their own line
  defineOverride(StatCard, PteroStatCard),
  // the activity pages of a server and the account as Pterodactyl's activity log
  defineOverride(ServerActivity, PteroServerActivity),
  defineOverride(DashboardActivity, PteroDashboardActivity),
];
