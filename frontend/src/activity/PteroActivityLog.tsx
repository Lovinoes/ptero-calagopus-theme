import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';
import type { To } from 'react-router';
import { z } from 'zod';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton.tsx';
import Avatar from '@/elements/data-display/Avatar.tsx';
import { ErrorItems, NoItems, Pagination } from '@/elements/data-display/Table.tsx';
import TableLink from '@/elements/data-display/TableLink.tsx';
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

interface PteroActivityLogProps {
  activities: Pagination<unknown> | undefined;
  loading: boolean;
  error: string | null | undefined;
  onPageSelect: (page: number) => void;
  children: ReactNode;
}

/**
 * Pterodactyl's activity log (ActivityLogContainer): one gray box with an entry below the other instead
 * of a table, the pages below it. Loading, errors and an empty log look like the panel's tables.
 */
export function PteroActivityLog({ activities, loading, error, onPageSelect, children }: PteroActivityLogProps) {
  const empty = !loading && activities?.total === 0;

  return (
    <>
      <div className='ptero-activity' data-loading={loading || undefined}>
        {error ? (
          <div className='ptero-activity__message'>
            <ErrorItems error={error} />
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

      {!error && activities && <Pagination data={activities} mt='md' onPageSelect={onPageSelect} />}
    </>
  );
}

interface PteroActivityEntryProps {
  activity: Activity;
  /** who did it, the panel's "System" or "Schedule" when nobody did */
  actorName: string;
  /** filters the log by that user */
  actorLink?: To | null;
  avatar: { avatar?: string | null; username?: string | null } | null;
  actions?: ReactNode;
}

/**
 * One entry of Pterodactyl's activity log (ActivityLogEntry): the avatar, "user — event" with an icon when
 * it came through the API, the IP and how long ago below it, the details button on the right.
 */
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
            <span className='ptero-activity-entry__separator'>&nbsp;&mdash;&nbsp;</span>
            {/* the icon follows the event inline, so it stays next to it when the line wraps */}
            <span className='ptero-activity-entry__event'>
              {activity.event}
              {activity.isApi && (
                <span className='ptero-activity-entry__icons'>
                  <Tooltip label={t('common.api', {})}>
                    <FontAwesomeIcon icon={faTerminal} />
                  </Tooltip>
                </span>
              )}
            </span>
          </div>

          <div className='ptero-activity-entry__meta'>
            {activity.ip && (
              <>
                <RedactedText value={activity.ip} />
                <span className='ptero-activity-entry__separator'>&nbsp;|&nbsp;</span>
              </>
            )}
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
