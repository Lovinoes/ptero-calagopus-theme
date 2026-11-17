import getUserActivity from '@/api/me/getUserActivity.ts';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import { queryKeys } from '@/lib/queryKeys.ts';
// the stock one here, see overrides.ts
import DashboardActivity from '@/pages/dashboard/activity/DashboardActivity.tsx';
import { useSearchablePaginatedTable } from '@/plugins/resource/useSearchablePaginatedTable.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { usePteroThemeActive } from '../core/scope.tsx';
import { PteroActivityEntry, PteroActivityLog } from './PteroActivityLog.tsx';

/** Account activity as Pterodactyl's log, the stock page off the themed pages. */
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
    setPerPage,
    refetch,
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
      <PteroActivityLog
        activities={activities}
        loading={loading}
        error={error}
        onPageSelect={setPage}
        onRetry={refetch}
        onPerPageSelect={setPerPage}
      >
        {activities?.data.map((activity, index) => (
          <PteroActivityEntry
            key={`${activity.created.toISOString()}-${index}`}
            activity={activity}
            actorName={user?.username ?? t('common.system', {})}
            avatar={activity.impersonator ?? user}
          />
        ))}
      </PteroActivityLog>
    </AccountContentContainer>
  );
}
