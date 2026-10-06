import getUserActivity from '@/api/me/getUserActivity.ts';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import { queryKeys } from '@/lib/queryKeys.ts';
// inside this file the path resolves to the stock page, see overrides.ts
import DashboardActivity from '@/pages/dashboard/activity/DashboardActivity.tsx';
import { useSearchablePaginatedTable } from '@/plugins/resource/useSearchablePaginatedTable.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { usePteroThemeActive } from '../scope.tsx';
import { PteroActivityEntry, PteroActivityLog } from './PteroActivityLog.tsx';

/**
 * The account activity page (pages/dashboard/activity/DashboardActivity.tsx) as Pterodactyl's
 * activity log, every entry is the account's own. Off the themed pages the stock page is rendered.
 */
export default function PteroDashboardActivity() {
  return usePteroThemeActive() ? <PteroAccountActivityLog /> : <DashboardActivity />;
}

function PteroAccountActivityLog() {
  const { user } = useAuth();
  const { t } = useTranslations();

  const {
    data: activities,
    loading,
    error,
    search,
    setSearch,
    setPage,
  } = useSearchablePaginatedTable({
    queryKey: queryKeys.user.activity.all(),
    fetcher: getUserActivity,
  });

  return (
    <AccountContentContainer
      title={t('pages.account.activity.title', {})}
      search={search}
      setSearch={setSearch}
      registry={window.extensionContext.extensionRegistry.pages.dashboard.activity.container}
    >
      <PteroActivityLog activities={activities} loading={loading} error={error} onPageSelect={setPage}>
        {activities?.data.map((activity, index) => (
          <PteroActivityEntry
            key={`${activity.created.toISOString()}-${index}`}
            activity={activity}
            actorName={user?.username ?? t('common.system', {})}
            avatar={user}
          />
        ))}
      </PteroActivityLog>
    </AccountContentContainer>
  );
}
