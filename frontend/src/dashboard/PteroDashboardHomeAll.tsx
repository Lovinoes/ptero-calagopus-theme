import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios.ts';
import getServerGroups from '@/api/me/servers/groups/getServerGroups.ts';
import getServers from '@/api/server/getServers.ts';
import { AdminCan } from '@/elements/Can.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import { Pagination } from '@/elements/data-display/Table.tsx';
import { DndContainer, SortableItem } from '@/elements/dnd/DragAndDrop.tsx';
import Spinner from '@/elements/feedback/Spinner.tsx';
import Checkbox from '@/elements/input/Checkbox.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Divider from '@/elements/layout/Divider.tsx';
import Group from '@/elements/layout/Group.tsx';
import { ObjectSet } from '@/lib/objectSet.ts';
import { queryKeys } from '@/lib/queryKeys.ts';
import { eventKeyMatches } from '@/lib/quickActions/shortcuts.ts';
import { serverPowerAction, serverSchema } from '@/lib/schemas/server/server.ts';
import { useUserSetting } from '@/lib/userSettings.ts';
import BulkActionBar from '@/pages/dashboard/home/BulkActionBar.tsx';
import DashboardHomeAll from '@/pages/dashboard/home/DashboardHomeAll.tsx';
import DashboardHomeTitle from '@/pages/dashboard/home/DashboardHomeTitle.tsx';
import ServerItem from '@/pages/dashboard/home/ServerItem.tsx';
import { useSearchablePaginatedTable } from '@/plugins/resource/useSearchablePaginatedTable.ts';
import { useBulkPowerActions } from '@/plugins/server/useBulkPowerActions.ts';
import { useServerListShowOthers } from '@/plugins/server/useServerListShowOthers.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import { usePteroThemeActive } from '../scope.tsx';

type Server = z.infer<typeof serverSchema>;

/**
 * The "All Servers" page of the panel (pages/dashboard/home/DashboardHomeAll.tsx) with one addition:
 * the servers can be dragged into an order, like the servers inside a group. The order is a user
 * setting, so it follows the account to every device. Servers that were never moved keep the order
 * of the panel after the moved ones. With more servers than fit on one page, they are ordered within
 * their page.
 */
const SERVER_ORDER_KEY = 'dev.lovinoes.pterodactyl::server_order';
const serverOrderSchema = z.array(z.string());
const EMPTY_ORDER: string[] = [];

function sortByOrder(servers: Server[], order: string[]) {
  const positions = new Map(order.map((uuid, index) => [uuid, index]));

  // Array.prototype.sort is stable, so servers without a saved position keep the panel's order
  return [...servers].sort((a, b) => {
    const positionA = positions.get(a.uuid);
    const positionB = positions.get(b.uuid);

    if (positionA === undefined && positionB === undefined) return 0;
    if (positionA === undefined) return 1;
    if (positionB === undefined) return -1;
    return positionA - positionB;
  });
}

/** Writes the new order of the shown servers into the saved order, the servers of other pages stay put. */
function mergeOrder(order: string[], shown: string[], reordered: string[]) {
  const merged = [...order];
  for (const uuid of shown) {
    if (!merged.includes(uuid)) merged.push(uuid);
  }

  const reorderedSet = new Set(reordered);
  const slots = merged.flatMap((uuid, index) => (reorderedSet.has(uuid) ? [index] : []));
  slots.forEach((slot, index) => {
    merged[slot] = reordered[index];
  });

  return merged;
}

/** The panel's own page when the theme is turned off, this replacement is compiled in either way. */
export default function PteroDashboardHomeAll() {
  return usePteroThemeActive() ? <PteroServerList /> : <DashboardHomeAll />;
}

function PteroServerList() {
  const { t } = useTranslations();
  const { setServerGroups } = useUserStore();
  const [serverListShowOthers, setServerListShowOthers] = useServerListShowOthers();
  const [serverOrder, setServerOrder] = useUserSetting(SERVER_ORDER_KEY, serverOrderSchema, EMPTY_ORDER);
  const { addToast } = useToast();

  const [selectedServers, setSelectedServers] = useState(new ObjectSet<Server, 'uuid'>('uuid'));
  const sKeyPressedRef = useRef(false);

  const { handleBulkPowerAction, bulkActionLoading } = useBulkPowerActions();

  useEffect(() => {
    getServerGroups()
      .then((response) => {
        setServerGroups(response);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [addToast, setServerGroups]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (eventKeyMatches(e, 's')) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          sKeyPressedRef.current = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (eventKeyMatches(e, 's')) {
        sKeyPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const {
    data: servers,
    loading,
    search,
    setSearch,
    setPage,
  } = useSearchablePaginatedTable({
    queryKey: queryKeys.user.servers.all(),
    fetcher: (page, search) => getServers(page, search, serverListShowOthers),
    deps: [serverListShowOthers],
  });

  // the saved order is parsed anew on every render, so its content (serverOrderKey) decides when the
  // list changes, a new list would reset the drag and drop state
  const serverOrderKey = serverOrder.join(',');
  const sortableServers = useMemo(
    () => sortByOrder(servers?.data ?? [], serverOrder).map((server) => ({ id: server.uuid, server })),
    [servers?.data, serverOrderKey],
  );

  const selectedPageCount = servers?.data.filter((server) => selectedServers.has(server)).length ?? 0;
  const allSelected = selectedPageCount > 0 && selectedPageCount === servers?.data.length;

  const handleServerSelectionChange = (server: Server, selected: boolean) => {
    setSelectedServers((prev) => {
      const newSet = prev.clone();
      if (selected) {
        newSet.add(server);
      } else {
        newSet.delete(server);
      }
      return newSet;
    });
  };

  const handleServerClick = (server: Server, event: React.MouseEvent) => {
    if (sKeyPressedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      handleServerSelectionChange(server, !selectedServers.has(server));
    }
  };

  const onBulkAction = async (action: z.infer<typeof serverPowerAction>) => {
    await handleBulkPowerAction(selectedServers.keys(), action);
    setSelectedServers(new ObjectSet('uuid'));
  };

  const renderServer = (server: Server) => (
    <ServerItem
      server={server}
      showContextMenu
      showGroupAddButton
      showForeignServerBadge
      isSelected={selectedServers.has(server.uuid)}
      onSelectionChange={(selected) => handleServerSelectionChange(server, selected)}
      onClick={(e) => handleServerClick(server, e)}
      sKeyPressedRef={sKeyPressedRef}
    />
  );

  return (
    <AccountContentContainer
      title={t('pages.account.home.title', {})}
      registry={window.extensionContext.extensionRegistry.pages.dashboard.home.containerAll}
    >
      <DashboardHomeTitle />

      <Group mb='md' justify='space-between'>
        <Group wrap='nowrap' className='w-full md:w-auto'>
          <Checkbox
            aria-label={t('common.button.selectAll', {})}
            title={t('common.button.selectAll', {})}
            className='shrink-0'
            checked={allSelected}
            indeterminate={selectedPageCount > 0 && !allSelected}
            disabled={loading || !servers?.data.length}
            onChange={(e) => {
              const checked = e.currentTarget.checked;
              setSelectedServers((previous) => {
                const next = previous.clone();
                for (const server of servers?.data ?? []) {
                  if (checked) {
                    next.add(server);
                  } else {
                    next.delete(server);
                  }
                }
                return next;
              });
            }}
          />
          <TextInput
            placeholder={t('common.input.search', {})}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='flex-1 min-w-0 md:w-62.5'
          />
        </Group>
        <AdminCan action='servers.read'>
          <Switch
            label={t('pages.account.home.tabs.allServers.page.input.showOtherUsersServers', {})}
            checked={serverListShowOthers}
            onChange={(e) => {
              setPage(1);
              setServerListShowOthers(e.currentTarget.checked);
            }}
          />
        </AdminCan>
      </Group>
      {(servers?.total ?? 0) > (servers?.perPage ?? 0) && (
        <>
          <Pagination data={servers ?? getEmptyPaginationSet()} onPageSelect={setPage} />
          <Divider my='md' />
        </>
      )}
      {loading ? (
        <Spinner.Centered />
      ) : (servers?.total ?? 0) === 0 ? (
        <p className='text-(--mantine-color-dimmed)'>{t('pages.account.home.noServers', {})}</p>
      ) : (
        <DndContainer
          items={sortableServers}
          getItemLabel={(item) => item.server.name}
          callbacks={{
            onDragEnd: (items) => {
              setServerOrder((previous) =>
                mergeOrder(
                  previous,
                  sortableServers.map((item) => item.id),
                  items.map((item) => item.id),
                ),
              );
            },
          }}
          renderOverlay={(item) =>
            item && (
              <div style={{ cursor: 'grabbing', opacity: 0.95 }} className='shadow-xl rounded'>
                {renderServer(item.server)}
              </div>
            )
          }
        >
          {(items) => (
            <div className='gap-4 grid md:grid-cols-2'>
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id} data={{ server: item.server }}>
                  {renderServer(item.server)}
                </SortableItem>
              ))}
            </div>
          )}
        </DndContainer>
      )}
      <BulkActionBar
        selectedCount={selectedServers.size}
        onClear={() => setSelectedServers(new ObjectSet('uuid'))}
        onAction={onBulkAction}
        loading={bulkActionLoading}
      />
      {(servers?.total ?? 0) > (servers?.perPage ?? 0) && (
        <>
          <Divider my='md' />
          <Pagination data={servers ?? getEmptyPaginationSet()} onPageSelect={setPage} />
        </>
      )}
    </AccountContentContainer>
  );
}
