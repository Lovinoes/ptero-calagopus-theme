import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink, useSearchParams } from 'react-router';
import getServerActivity from '@/api/server/getServerActivity.ts';
import ClearUserFilterButton from '@/elements/activity/ClearUserFilterButton.tsx';
import ActionIcon from '@/elements/buttons/ActionIcon.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import { queryKeys } from '@/lib/queryKeys.ts';
// inside this file the path resolves to the stock page, see overrides.ts
import ServerActivity from '@/pages/server/activity/ServerActivity.tsx';
import { useSearchablePaginatedTable } from '@/plugins/resource/useSearchablePaginatedTable.ts';
import { buildUserFilterSearch, useUserFilter } from '@/plugins/useUserFilter.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import { perPageSetter } from '../compat.ts';
import { usePteroThemeActive } from '../scope.tsx';
import { PteroActivityEntry, PteroActivityLog } from './PteroActivityLog.tsx';

// the number of entries per page is a fifth argument since Calagopus 1.2.7, 1.2.6 ignores it
const fetchServerActivity = getServerActivity as (
  ...args: [...Parameters<typeof getServerActivity>, perPage?: number]
) => ReturnType<typeof getServerActivity>;

/**
 * The activity page of a server (pages/server/activity/ServerActivity.tsx) as Pterodactyl's activity
 * log. The search, the filter by user and the file diff links work as before. Off the themed pages the
 * stock page is rendered.
 */
export default function PteroServerActivity() {
  return usePteroThemeActive() ? <PteroServerActivityLog /> : <ServerActivity />;
}

function PteroServerActivityLog() {
  const { t } = useTranslations();
  const server = useServerStore((state) => state.server);
  const [searchParams] = useSearchParams();
  const { filterUserUuid, setFilterUserUuid } = useUserFilter();

  const table = useSearchablePaginatedTable({
    queryKey: queryKeys.server(server.uuid).activity.all(filterUserUuid),
    // Calagopus 1.2.7 passes the number of entries per page, 1.2.6 neither passes nor takes it
    fetcher: (page: number, search: string, perPage?: number) =>
      fetchServerActivity(server.uuid, filterUserUuid, page, search, perPage),
  });
  const { data: activities, loading, error, search, setSearch, setPage, refetch } = table;

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
        onPerPageSelect={perPageSetter(table)}
      >
        {activities?.data.map((activity, index) => {
          const fileWriteData = activity.data as { file?: string; revision_id?: string } | null;
          const diffHref =
            activity.event === 'server:file.write' && fileWriteData?.file && fileWriteData?.revision_id
              ? `/server/${server.uuidShort}/files/diff?file=${encodeURIComponent(fileWriteData.file)}&revision=${fileWriteData.revision_id}`
              : null;

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
                diffHref ? (
                  <NavLink
                    to={diffHref}
                    state={{
                      backTo: `/server/${server.uuidShort}/activity${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
                    }}
                  >
                    <ActionIcon>
                      <FontAwesomeIcon icon={faCodeBranch} />
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
