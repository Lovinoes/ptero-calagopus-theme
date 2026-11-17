import type { ReactNode } from 'react';
import type { To } from 'react-router';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { z } from 'zod';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton.tsx';
import Avatar from '@/elements/data-display/Avatar.tsx';
import { NoItems, Pagination } from '@/elements/data-display/Table.tsx';
import TableLink from '@/elements/data-display/TableLink.tsx';
import ErrorState from '@/elements/feedback/ErrorState.tsx';
import Spinner from '@/elements/feedback/Spinner.tsx';
import Tooltip from '@/elements/overlays/Tooltip.tsx';
import FormattedTimestamp from '@/elements/time/FormattedTimestamp.tsx';
import RedactedText from '@/elements/typography/RedactedText.tsx';
import { activitySchema } from '@/lib/schemas/activity.ts';
import { serverActivitySchema } from '@/lib/schemas/server/activity.ts';
import { userActivitySchema } from '@/lib/schemas/user/activity.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

type Activity =
  | z.infer<typeof activitySchema>
  | z.infer<typeof userActivitySchema>
  | z.infer<typeof serverActivitySchema>;

type AvatarSource = { avatar?: string | null; username?: string | null } | null;

interface PteroActivityLogProps {
  activities: Pagination<unknown> | undefined;
  loading: boolean;
  error: string | null | undefined;
  onPageSelect: (page: number) => void;
  onRetry: () => void;
  onPerPageSelect: (perPage: number) => void;
  children: ReactNode;
}

/** Pterodactyl's activity log: one box of entries instead of a table. */
export function PteroActivityLog({
  activities,
  loading,
  error,
  onPageSelect,
  onRetry,
  onPerPageSelect,
  children,
}: PteroActivityLogProps) {
  const empty = !loading && activities?.total === 0;

  return (
    <>
      <div className='ptero-activity' data-loading={loading || undefined}>
        {error ? (
          <div className='ptero-activity__message'>
            <ErrorState error={error} onRetry={onRetry} retrying={loading} />
          </div>
        ) : empty ? (
          <div className='ptero-activity__message'>
            <NoItems />
          </div>
        ) : (
          <div className='ptero-activity__entries'>{children}</div>
        )}

        {loading && (
          <div className='ptero-activity__loader'>
            <Spinner />
          </div>
        )}
      </div>

      {!error && activities && (
        <Pagination data={activities} mt='md' onPageSelect={onPageSelect} onPerPageSelect={onPerPageSelect} />
      )}
    </>
  );
}

interface PteroActivityEntryProps {
  activity: Activity;
  /** the panel's "System" or "Schedule" when no user did it */
  actorName: string;
  actorLink?: To | null;
  avatar: AvatarSource;
  actions?: ReactNode;
}

/** One entry: avatar, "user — event", IP and time, details on the right. */
export function PteroActivityEntry({ activity, actorName, actorLink, avatar, actions }: PteroActivityEntryProps) {
  const { t } = useTranslations();
  const hasDetails = Object.keys(activity.data ?? {}).length > 0;

  return (
    <div className='ptero-activity-entry'>
      <div className='ptero-activity-entry__avatar'>
        <Avatar size={40} className='select-none' src={avatar?.avatar} name={avatar?.username ?? undefined} />
      </div>

      <div className='ptero-activity-entry__body'>
        <div className='ptero-activity-entry__content'>
          <div className='ptero-activity-entry__headline'>
            {actorLink ? (
              <TableLink to={actorLink} className='ptero-activity-entry__actor'>
                {actorName}
              </TableLink>
            ) : (
              <span className='ptero-activity-entry__actor'>{actorName}</span>
            )}
            {activity.impersonator && (
              <span className='ptero-activity-entry__impersonator'>
                &nbsp;({t('common.impersonatedBy', { username: activity.impersonator.username })})
              </span>
            )}
            <span className='ptero-activity-entry__separator'>&nbsp;&mdash;&nbsp;</span>
            <span className='ptero-activity-entry__event'>
              {activity.event}
              {activity.isApi && (
                <span className='ptero-activity-entry__icons'>
                  <Tooltip label={t('common.api', {})}>
                    <FontAwesomeIcon icon={faTerminal} title={t('common.api', {})} />
                  </Tooltip>
                </span>
              )}
            </span>
          </div>

          <div className='ptero-activity-entry__meta'>
            {/* null when the panel hides it (Admin -> Settings -> Activity -> Hide Server Activity IPs) */}
            {activity.ip ? <RedactedText value={activity.ip} /> : t('common.na', {})}
            <span className='ptero-activity-entry__separator'>&nbsp;|&nbsp;</span>
            <FormattedTimestamp timestamp={activity.created} />
          </div>
        </div>

        {(actions || hasDetails) && (
          <div className='ptero-activity-entry__actions'>
            {actions}
            {hasDetails && <ActivityInfoButton activity={activity} />}
          </div>
        )}
      </div>
    </div>
  );
}
