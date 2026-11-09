import {
  faAdd,
  faCheckCircle,
  faCircleXmark,
  faEllipsisVertical,
  faEthernet,
  faHdd,
  faInfoCircle,
  faMemory,
  faMicrochip,
  faMinus,
  faPlay,
  faRotateRight,
  faServer,
  faSkull,
  faStop,
  faUsers,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { type ComponentProps, useCallback, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import { z } from 'zod';
import ActionIcon from '@/elements/buttons/ActionIcon.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import Spinner from '@/elements/feedback/Spinner.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import ContextMenu, { type ContextMenuItem } from '@/elements/overlays/ContextMenu.tsx';
import Tooltip from '@/elements/overlays/Tooltip.tsx';
import RedactedText from '@/elements/typography/RedactedText.tsx';
import { formatAllocation, serverStatusInfo } from '@/lib/domain/server.ts';
import { bytesToString, mbToBytes } from '@/lib/format/size.ts';
import { serverPowerAction } from '@/lib/schemas/server/server.ts';
import ServerAddGroupModal from '@/pages/dashboard/home/modals/ServerAddGroupModal.tsx';
// inside this file the path resolves to the stock component, see overrides.ts
import ServerItem from '@/pages/dashboard/home/ServerItem.tsx';
import { useBulkPowerActions } from '@/plugins/server/useBulkPowerActions.ts';
import { useServerListShowOthers } from '@/plugins/server/useServerListShowOthers.ts';
import { useServerStats, useServerStatsUnavailable } from '@/plugins/server/useServerStats.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import { usePteroThemeActive } from '../core/scope.tsx';
import { useExtTranslations } from '../translations.ts';

type Props = ComponentProps<typeof ServerItem>;
type Server = Props['server'];

// Pterodactyl shows a resource in red once it reaches 90% of its limit
const ALARM_THRESHOLD = 0.9;

const isAlarmState = (currentBytes: number, limitMiB: number) =>
  limitMiB > 0 && currentBytes / mbToBytes(limitMiB) >= ALARM_THRESHOLD;

/**
 * The stock server card of the dashboard, replaced by Pterodactyl's ServerRow. When the theme is not
 * active (extension disabled without a rebuild) the stock card is rendered instead.
 */
export default function PteroServerItem(props: Props) {
  return usePteroThemeActive() ? <PteroServerRow {...props} /> : <ServerItem {...props} />;
}

/** Suspended, maintenance, transferring or installing: shown in place of the resources. */
function useStateBadge(server: Server): { color: string; label: string } | null {
  const { t } = useTranslations();

  if (server.isSuspended) return { color: 'red', label: t('common.server.state.suspended', {}) };
  if (server.nodeMaintenanceEnabled) return { color: 'yellow', label: t('common.server.state.nodeMaintenance', {}) };
  if (server.isTransferring) return { color: 'gray', label: t('common.server.state.transferring', {}) };
  if (server.status) {
    const status = serverStatusInfo[server.status];
    return { color: status.failed ? 'red' : 'gray', label: status.label() };
  }

  return null;
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <div className='ptero-server-row__badge-wrapper'>
      <span className='ptero-server-row__badge' data-color={color}>
        {label}
      </span>
    </div>
  );
}

function ResourceStat({
  icon,
  value,
  limit,
  alarm,
}: {
  icon: IconDefinition;
  value: string;
  limit: string;
  alarm: boolean;
}) {
  const { t: tExt } = useExtTranslations();

  return (
    <div className='ptero-server-row__stat'>
      <div className='ptero-server-row__stat-line'>
        <FontAwesomeIcon icon={icon} className='ptero-server-row__stat-icon' data-alarm={alarm || undefined} />
        <p className='ptero-server-row__stat-value' data-alarm={alarm || undefined}>
          {value}
        </p>
      </div>
      <p className='ptero-server-row__stat-limit'>{tExt('serverRow.ofLimit', { limit })}</p>
    </div>
  );
}

function RowAction({
  label,
  icon,
  color,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  icon: IconDefinition;
  color: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip label={label}>
      <ActionIcon size='sm' variant='subtle' color={color} disabled={disabled} loading={loading} onClick={onClick}>
        <FontAwesomeIcon icon={icon} />
      </ActionIcon>
    </Tooltip>
  );
}

function PteroServerRow({
  server,
  to,
  showGroupAddButton = false,
  showForeignServerBadge = false,
  showContextMenu = false,
  onGroupRemove,
  isSelected = false,
  onSelectionChange,
  onClick,
  showSelection = true,
  sKeyPressedRef,
}: Props) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const serverGroups = useUserStore((state) => state.serverGroups);
  const [serverListShowOthers] = useServerListShowOthers();
  const badge = useStateBadge(server);

  const [openModal, setOpenModal] = useState<'add-group' | 'kill' | null>(null);
  const stats = useServerStats(server);
  // the node of the server can't be reached, its stats will not come
  const statsUnavailable = useServerStatsUnavailable(server);

  const availableServerGroups = useMemo(
    () => serverGroups.filter((group) => !group.serverOrder.includes(server.uuid)),
    [serverGroups, server.uuid],
  );
  const inNoGroup = availableServerGroups.length === serverGroups.length;

  const { handleBulkPowerAction, bulkActionLoading } = useBulkPowerActions();

  const state = stats?.state;
  const powerBlocked = !!server.status || server.isSuspended || server.isTransferring || server.nodeMaintenanceEnabled;
  const powerBusy = powerBlocked || bulkActionLoading !== null;

  const permissionSet = useMemo(
    () => new Set([...server.permissions, ...(user?.role?.serverPermissions ?? [])]),
    [server.permissions, user?.role?.serverPermissions],
  );
  const canPower = useCallback(
    (action: string) => permissionSet.has('*') || permissionSet.has(action),
    [permissionSet],
  );

  const doPowerAction = useCallback(
    (action: z.infer<typeof serverPowerAction>) => handleBulkPowerAction([server.uuid], action),
    [handleBulkPowerAction, server.uuid],
  );

  const unlimited = t('common.unlimited', {});
  const limits = {
    cpu: server.limits.cpu !== 0 ? `${server.limits.cpu} %` : unlimited,
    memory: server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : unlimited,
    disk: server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : unlimited,
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        type: 'action' as const,
        icon: faPlay,
        label: t('common.enum.serverPowerAction.start', {}),
        color: 'gray',
        canAccess: canPower('control.start'),
        disabled: powerBusy || state !== 'offline',
        onClick: () => doPowerAction('start'),
      },
      {
        type: 'action' as const,
        icon: faRotateRight,
        label: t('common.enum.serverPowerAction.restart', {}),
        canAccess: canPower('control.restart'),
        disabled: powerBusy || !state,
        onClick: () => doPowerAction('restart'),
      },
      {
        type: 'action' as const,
        icon: faStop,
        label: t('common.enum.serverPowerAction.stop', {}),
        color: 'red',
        canAccess: canPower('control.stop'),
        disabled: powerBusy || !state || state === 'offline',
        onClick: () => doPowerAction('stop'),
      },
      {
        type: 'action' as const,
        icon: faSkull,
        label: t('common.enum.serverPowerAction.kill', {}),
        color: 'red',
        hidden: state !== 'stopping',
        canAccess: canPower('control.stop'),
        disabled: powerBusy,
        onClick: () => setOpenModal('kill'),
      },
    ],
    [t, doPowerAction, canPower, powerBusy, state],
  );

  return (
    <>
      <ServerAddGroupModal server={server} opened={openModal === 'add-group'} onClose={() => setOpenModal(null)} />

      <ConfirmationModal
        opened={openModal === 'kill'}
        onClose={() => setOpenModal(null)}
        title={t('pages.server.console.power.modal.forceStop.title', {})}
        confirm={t('common.button.continue', {})}
        onConfirmed={() => doPowerAction('kill')}
      >
        {t('pages.server.console.power.modal.forceStop.content', {}).md()}
      </ConfirmationModal>

      <ContextMenu enabled={showContextMenu} items={contextMenuItems}>
        {({ items, openMenu }) => (
          <div className='ptero-server-row-wrapper'>
            <div
              onClick={onClick}
              onContextMenu={(e) => {
                e.preventDefault();
                openMenu(e.clientX, e.clientY);
              }}
            >
              <NavLink
                to={to ?? `/server/${server.uuidShort}`}
                className={classNames('ptero-server-row', isSelected && 'ptero-server-row--selected')}
                data-status={state ?? 'offline'}
                onClick={(e) => {
                  if (sKeyPressedRef?.current) {
                    e.preventDefault();
                  }
                }}
              >
                <div className='ptero-server-row__main'>
                  <div className='ptero-server-row__icon'>
                    <FontAwesomeIcon icon={faServer} />
                  </div>
                  <div className='ptero-server-row__details'>
                    <p className='ptero-server-row__name'>
                      {server.name}
                      {showForeignServerBadge && !server.isOwner && (
                        <Tooltip label={t('pages.account.home.tooltip.foreign', {})}>
                          <FontAwesomeIcon size='xs' icon={faUsers} className='ptero-server-row__hint' />
                        </Tooltip>
                      )}
                      {!serverListShowOthers && inNoGroup && (
                        <Tooltip label={t('pages.account.home.tooltip.noGroup', {})}>
                          <FontAwesomeIcon size='xs' icon={faInfoCircle} className='ptero-server-row__hint' />
                        </Tooltip>
                      )}
                    </p>
                    {!!server.description && <p className='ptero-server-row__description'>{server.description}</p>}
                  </div>

                  <div className='ptero-server-row__actions'>
                    {showSelection && (
                      <RowAction
                        label={
                          isSelected
                            ? t('pages.account.home.bulkActions.deselect', {})
                            : t('pages.account.home.bulkActions.select', {})
                        }
                        icon={isSelected ? faCheckCircle : faCircleXmark}
                        color={isSelected ? 'blue' : 'gray'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectionChange?.(!isSelected);
                        }}
                      />
                    )}
                    {showGroupAddButton && (
                      <RowAction
                        label={
                          availableServerGroups.length === 0
                            ? t('pages.account.home.tooltip.noGroups', {})
                            : t('pages.account.home.tooltip.addToGroup', {})
                        }
                        icon={faAdd}
                        color='gray'
                        disabled={availableServerGroups.length === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenModal('add-group');
                        }}
                      />
                    )}
                    {onGroupRemove && (
                      <RowAction
                        label={t('pages.account.home.tooltip.removeFromGroup', {})}
                        icon={faMinus}
                        color='red'
                        onClick={(e) => {
                          e.preventDefault();
                          onGroupRemove();
                        }}
                      />
                    )}
                    {showContextMenu && items.some((item) => !item.hidden && item.canAccess !== false) && (
                      <RowAction
                        label={t('common.form.powerAction', {})}
                        icon={faEllipsisVertical}
                        color='gray'
                        loading={bulkActionLoading !== null}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          openMenu(rect.left, rect.bottom);
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className='ptero-server-row__allocation'>
                  <div className='ptero-server-row__stat-line'>
                    <FontAwesomeIcon icon={faEthernet} className='ptero-server-row__stat-icon' />
                    {server.allocation ? (
                      <CopyOnClick content={formatAllocation(server.allocation)}>
                        <p className='ptero-server-row__stat-value'>
                          <RedactedText value={formatAllocation(server.allocation)} />
                        </p>
                      </CopyOnClick>
                    ) : (
                      <p className='ptero-server-row__stat-value'>{t('common.server.noAllocation', {})}</p>
                    )}
                  </div>
                </div>

                <div className='ptero-server-row__resources'>
                  {badge ? (
                    <Badge {...badge} />
                  ) : stats ? (
                    <>
                      <ResourceStat
                        icon={faMicrochip}
                        value={`${stats.cpuAbsolute.toFixed(2)} %`}
                        limit={limits.cpu}
                        alarm={server.limits.cpu !== 0 && stats.cpuAbsolute >= server.limits.cpu * ALARM_THRESHOLD}
                      />
                      <ResourceStat
                        icon={faMemory}
                        value={bytesToString(stats.memoryBytes)}
                        limit={limits.memory}
                        alarm={isAlarmState(stats.memoryBytes, server.limits.memory)}
                      />
                      <ResourceStat
                        icon={faHdd}
                        value={bytesToString(stats.diskBytes)}
                        limit={limits.disk}
                        alarm={isAlarmState(stats.diskBytes, server.limits.disk)}
                      />
                    </>
                  ) : statsUnavailable ? (
                    <Badge color='yellow' label={t('common.server.state.resourcesUnavailable', {})} />
                  ) : (
                    <Spinner size={16} />
                  )}
                </div>

                <div className='ptero-server-row__status-bar' />
              </NavLink>
            </div>
          </div>
        )}
      </ContextMenu>
    </>
  );
}
