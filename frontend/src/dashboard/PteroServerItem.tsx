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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import { z } from 'zod';
import ActionIcon from '@/elements/buttons/ActionIcon.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import Spinner from '@/elements/feedback/Spinner.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import ContextMenu, { ContextMenuItem } from '@/elements/overlays/ContextMenu.tsx';
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
import { useServerStats } from '@/plugins/server/useServerStats.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import { isPteroThemeActive } from '../scope.tsx';
import { useExtTranslations } from '../translations.ts';

type Props = ComponentProps<typeof ServerItem>;

// Pterodactyl shows a resource in red once it reaches 90% of its limit
const isAlarmState = (current: number, limitMiB: number) => limitMiB > 0 && current / mbToBytes(limitMiB) >= 0.9;

/**
 * The stock server card on the dashboard, replaced by Pterodactyl's ServerRow. When the theme is not
 * active (extension disabled without a rebuild) the stock card is rendered instead.
 */
export default function PteroServerItem(props: Props) {
  if (!isPteroThemeActive()) {
    return <ServerItem {...props} />;
  }

  return <PteroServerRow {...props} />;
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
  const { t: tExt } = useExtTranslations();
  const { user } = useAuth();
  const serverGroups = useUserStore((state) => state.serverGroups);
  const [serverListShowOthers] = useServerListShowOthers();

  const [openModal, setOpenModal] = useState<'add-group' | 'kill' | null>(null);
  const stats = useServerStats(server);

  const availableServerGroups = useMemo(
    () => serverGroups.filter((g) => !g.serverOrder.includes(server.uuid)),
    [serverGroups, server.uuid],
  );

  const { handleBulkPowerAction, bulkActionLoading } = useBulkPowerActions();

  const state = stats?.state;
  const powerBlocked = !!server.status || server.isSuspended || server.isTransferring || server.nodeMaintenanceEnabled;

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

  const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : t('common.unlimited', {});
  const memoryLimit =
    server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : t('common.unlimited', {});
  const cpuLimit = server.limits.cpu !== 0 ? `${server.limits.cpu} %` : t('common.unlimited', {});

  const alarms = {
    cpu: !!stats && server.limits.cpu !== 0 && stats.cpuAbsolute >= server.limits.cpu * 0.9,
    memory: !!stats && isAlarmState(stats.memoryBytes, server.limits.memory),
    disk: !!stats && isAlarmState(stats.diskBytes, server.limits.disk),
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        type: 'action' as const,
        icon: faPlay,
        label: t('common.enum.serverPowerAction.start', {}),
        color: 'gray',
        canAccess: canPower('control.start'),
        disabled: powerBlocked || bulkActionLoading !== null || state !== 'offline',
        onClick: () => doPowerAction('start'),
      },
      {
        type: 'action' as const,
        icon: faRotateRight,
        label: t('common.enum.serverPowerAction.restart', {}),
        canAccess: canPower('control.restart'),
        disabled: powerBlocked || bulkActionLoading !== null || !state,
        onClick: () => doPowerAction('restart'),
      },
      {
        type: 'action' as const,
        icon: faStop,
        label: t('common.enum.serverPowerAction.stop', {}),
        color: 'red',
        canAccess: canPower('control.stop'),
        disabled: powerBlocked || bulkActionLoading !== null || !state || state === 'offline',
        onClick: () => doPowerAction('stop'),
      },
      {
        type: 'action' as const,
        icon: faSkull,
        label: t('common.enum.serverPowerAction.kill', {}),
        color: 'red',
        hidden: state !== 'stopping',
        canAccess: canPower('control.stop'),
        disabled: powerBlocked || bulkActionLoading !== null,
        onClick: () => setOpenModal('kill'),
      },
    ],
    [t, doPowerAction, canPower, powerBlocked, bulkActionLoading, state],
  );

  const badge = server.isSuspended
    ? { color: 'red', label: t('common.server.state.suspended', {}) }
    : server.nodeMaintenanceEnabled
      ? { color: 'yellow', label: t('common.server.state.nodeMaintenance', {}) }
      : server.isTransferring
        ? { color: 'gray', label: t('common.server.state.transferring', {}) }
        : server.status
          ? {
              color: serverStatusInfo[server.status].failed ? 'red' : 'gray',
              label: serverStatusInfo[server.status].label(),
            }
          : null;

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
                      {!serverListShowOthers && serverGroups.every((g) => !g.serverOrder.includes(server.uuid)) && (
                        <Tooltip label={t('pages.account.home.tooltip.noGroup', {})}>
                          <FontAwesomeIcon size='xs' icon={faInfoCircle} className='ptero-server-row__hint' />
                        </Tooltip>
                      )}
                    </p>
                    {!!server.description && <p className='ptero-server-row__description'>{server.description}</p>}
                  </div>

                  <div className='ptero-server-row__actions'>
                    {showSelection && (
                      <Tooltip
                        label={
                          isSelected
                            ? t('pages.account.home.bulkActions.deselect', {})
                            : t('pages.account.home.bulkActions.select', {})
                        }
                      >
                        <ActionIcon
                          size='sm'
                          variant='subtle'
                          color={isSelected ? 'blue' : 'gray'}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectionChange?.(!isSelected);
                          }}
                        >
                          <FontAwesomeIcon icon={isSelected ? faCheckCircle : faCircleXmark} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {showGroupAddButton && (
                      <Tooltip
                        label={
                          availableServerGroups.length === 0
                            ? t('pages.account.home.tooltip.noGroups', {})
                            : t('pages.account.home.tooltip.addToGroup', {})
                        }
                      >
                        <ActionIcon
                          size='sm'
                          variant='subtle'
                          color='gray'
                          disabled={availableServerGroups.length === 0}
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenModal('add-group');
                          }}
                        >
                          <FontAwesomeIcon icon={faAdd} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {onGroupRemove && (
                      <Tooltip label={t('pages.account.home.tooltip.removeFromGroup', {})}>
                        <ActionIcon
                          size='sm'
                          variant='subtle'
                          color='red'
                          onClick={(e) => {
                            e.preventDefault();
                            onGroupRemove();
                          }}
                        >
                          <FontAwesomeIcon icon={faMinus} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {showContextMenu && items.some((item) => !item.hidden && item.canAccess !== false) && (
                      <Tooltip label={t('common.form.powerAction', {})}>
                        <ActionIcon
                          size='sm'
                          variant='subtle'
                          color='gray'
                          loading={bulkActionLoading !== null}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            openMenu(rect.left, rect.bottom);
                          }}
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </ActionIcon>
                      </Tooltip>
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
                    <div className='ptero-server-row__badge-wrapper'>
                      <span className='ptero-server-row__badge' data-color={badge.color}>
                        {badge.label}
                      </span>
                    </div>
                  ) : !stats ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      <div className='ptero-server-row__stat'>
                        <div className='ptero-server-row__stat-line'>
                          <FontAwesomeIcon
                            icon={faMicrochip}
                            className='ptero-server-row__stat-icon'
                            data-alarm={alarms.cpu || undefined}
                          />
                          <p className='ptero-server-row__stat-value' data-alarm={alarms.cpu || undefined}>
                            {stats.cpuAbsolute.toFixed(2)} %
                          </p>
                        </div>
                        <p className='ptero-server-row__stat-limit'>{tExt('serverRow.ofLimit', { limit: cpuLimit })}</p>
                      </div>
                      <div className='ptero-server-row__stat'>
                        <div className='ptero-server-row__stat-line'>
                          <FontAwesomeIcon
                            icon={faMemory}
                            className='ptero-server-row__stat-icon'
                            data-alarm={alarms.memory || undefined}
                          />
                          <p className='ptero-server-row__stat-value' data-alarm={alarms.memory || undefined}>
                            {bytesToString(stats.memoryBytes)}
                          </p>
                        </div>
                        <p className='ptero-server-row__stat-limit'>
                          {tExt('serverRow.ofLimit', { limit: memoryLimit })}
                        </p>
                      </div>
                      <div className='ptero-server-row__stat'>
                        <div className='ptero-server-row__stat-line'>
                          <FontAwesomeIcon
                            icon={faHdd}
                            className='ptero-server-row__stat-icon'
                            data-alarm={alarms.disk || undefined}
                          />
                          <p className='ptero-server-row__stat-value' data-alarm={alarms.disk || undefined}>
                            {bytesToString(stats.diskBytes)}
                          </p>
                        </div>
                        <p className='ptero-server-row__stat-limit'>
                          {tExt('serverRow.ofLimit', { limit: diskLimit })}
                        </p>
                      </div>
                    </>
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
