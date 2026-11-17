import { faCodeBranch, faSkull } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink, useSearchParams } from 'react-router';
import getServerActivity from '@/api/server/getServerActivity.ts';
import ClearUserFilterButton from '@/elements/activity/ClearUserFilterButton.tsx';
import ActionIcon from '@/elements/buttons/ActionIcon.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import { queryKeys } from '@/lib/queryKeys.ts';
// the stock one here, see overrides.ts
import ServerActivity from '@/pages/server/activity/ServerActivity.tsx';
import { useSearchablePaginatedTable } from '@/plugins/resource/useSearchablePaginatedTable.ts';
import { useServerCan } from '@/plugins/usePermissions.ts';
import { buildUserFilterSearch, useUserFilter } from '@/plugins/useUserFilter.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import { usePteroThemeActive } from '../core/scope.tsx';
import { PteroActivityEntry, PteroActivityLog } from './PteroActivityLog.tsx';

/** Server activity as Pterodactyl's log, the stock page off the themed pages. */
export default function PteroServerActivity() {
  return usePteroThemeActive() ? <PteroServerActivityLog /> : <ServerActivity />;
}

function PteroServerActivityLog() {
  const { t } = useTranslations();
  const server = useServerStore((state) => state.server);
  const [searchParams] = useSearchParams();
  const { filterUserUuid, setFilterUserUuid } = useUserFilter();
  const canReadConsole = useServerCan('control.read-console');

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
    queryKey: queryKeys.server(server.uuid).activity.all(filterUserUuid),
    fetcher: (page, search, perPage) => getServerActivity(server.uuid, filterUserUuid, page, search, perPage),
  });

  // diff and crash pages link back to the log with its filters
  const backTo = `/server/${server.uuidShort}/activity${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`;

  return (
    <ServerContentContainer
      title={t('pages.server.activity.title', {})}
      search={search}
      setSearch={setSearch}
      contentRight={filterUserUuid ? <ClearUserFilterButton onClick={() => setFilterUserUuid(null)} /> : null}
      registry={window.extensionContext.extensionRegistry.pages.server.activity.container}
    >
      <PteroActivityLog
        activities={activities}
        loading={loading}
        error={error}
        onPageSelect={setPage}
        onRetry={refetch}
        onPerPageSelect={setPerPage}
      >
        {activities?.data.map((activity, index) => {
          const fileWriteData = activity.data as { file?: string; revision_id?: string } | null;
          const diffHref =
            activity.event === 'server:file.write' && fileWriteData?.file && fileWriteData?.revision_id
              ? `/server/${server.uuidShort}/files/diff?file=${encodeURIComponent(fileWriteData.file)}&revision=${fileWriteData.revision_id}`
              : null;
          const crashData = activity.data as { crash?: number | null } | null;
          const crashHref =
            canReadConsole && activity.event === 'server:crash.detected' && typeof crashData?.crash === 'number'
              ? `/server/${server.uuidShort}/console/crashes?crash=${crashData.crash}`
              : null;
          const actionHref = diffHref ?? crashHref;

          return (
            <PteroActivityEntry
              key={`${activity.created.toISOString()}-${index}`}
              activity={activity}
              actorName={
                activity.user?.username ?? (activity.isSchedule ? t('common.schedule', {}) : t('common.system', {}))
              }
              actorLink={activity.user ? { search: buildUserFilterSearch(searchParams, activity.user.uuid) } : null}
              avatar={activity.user}
              actions={
                actionHref ? (
                  <NavLink to={actionHref} state={{ backTo }}>
                    <ActionIcon>
                      <FontAwesomeIcon icon={diffHref ? faCodeBranch : faSkull} />
                    </ActionIcon>
                  </NavLink>
                ) : null
              }
            />
          );
        })}
      </PteroActivityLog>
    </ServerContentContainer>
  );
}
