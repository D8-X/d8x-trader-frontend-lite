import { LOB_ABI, PROXY_ABI } from '@d8x/perpetuals-sdk';
import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { toast } from 'react-toastify';
import { type Address, decodeEventLog, encodeEventTopics } from 'viem';
import { useAccount, useChainId, useWaitForTransaction, useWalletClient } from 'wagmi';

import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table as MuiTable,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';

import { HashZero } from 'app-constants';
import { cancelOrder } from 'blockchain-api/contract-interactions/cancelOrder';
import { Dialog } from 'components/dialog/Dialog';
import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getCancelOrder, getOpenOrders } from 'network/network';
import { clearOpenOrdersAtom, openOrdersAtom, traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { AlignE, SortOrderE, TableTypeE } from 'types/enums';
import type { OrderI, OrderWithIdI, TableHeaderI } from 'types/types';

import { OpenOrderRow } from './elements/OpenOrderRow';
import { OpenOrderBlock } from './elements/open-order-block/OpenOrderBlock';

import styles from './OpenOrdersTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;
const TOPIC_CANCEL_SUCCESS = encodeEventTopics({ abi: PROXY_ABI, eventName: 'PerpetualLimitOrderCancelled' })[0];
const TOPIC_CANCEL_FAIL = encodeEventTopics({ abi: LOB_ABI, eventName: 'ExecutionFailed' })[0];

export const OpenOrdersTable = memo(() => {
  const { t } = useTranslation();

  const { address, isDisconnected, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient({ chainId: chainId });
  const { width, ref } = useResizeDetector();

  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithIdI | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof OrderI>('executionTimestamp');
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

  const isAPIBusyRef = useRef(isAPIBusy);

  useEffect(() => {
    if (isDisconnected || traderAPI?.chainId !== chainId) {
      clearOpenOrders();
    }
  }, [isDisconnected, chainId, clearOpenOrders, traderAPI]);

  const handleOrderCancel = useCallback((orderWithId: OrderWithIdI) => {
    setCancelModalOpen(true);
    setSelectedOrder(orderWithId);
  }, []);

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedOrder(null);
  };

  const refreshOpenOrders = useCallback(async () => {
    if (address && isConnected && chainId && isSDKConnected) {
      if (isAPIBusyRef.current || chainId !== traderAPI?.chainId) {
        return;
      }
      setAPIBusy(true);
      await getOpenOrders(chainId, traderAPI, address, Date.now())
        .then(({ data }) => {
          setAPIBusy(false);
          clearOpenOrders();
          if (data?.length > 0) {
            data.map(setOpenOrders);
          }
        })
        .catch((err) => {
          console.error(err);
          setAPIBusy(false);
        });
    }
  }, [chainId, address, isConnected, isSDKConnected, setAPIBusy, setOpenOrders, clearOpenOrders, traderAPI]);

  useWaitForTransaction({
    hash: txHash,
    onSuccess(receipt) {
      const cancelEventIdx = receipt.logs.findIndex((log) => log.topics[0] === TOPIC_CANCEL_SUCCESS);
      if (cancelEventIdx >= 0) {
        const { args } = decodeEventLog({
          abi: PROXY_ABI,
          data: receipt.logs[cancelEventIdx].data,
          topics: receipt.logs[cancelEventIdx].topics,
        });
        toast.success(
          <ToastContent
            title={t('pages.trade.orders-table.toasts.order-cancelled.title')}
            bodyLines={[
              {
                label: t('pages.trade.orders-table.toasts.order-cancelled.body'),
                value: traderAPI?.getSymbolFromPerpId((args as { perpetualId: number }).perpetualId),
              },
            ]}
          />
        );
      } else {
        const execFailedIdx = receipt.logs.findIndex((log) => log.topics[0] === TOPIC_CANCEL_FAIL);
        const { args } = decodeEventLog({
          abi: LOB_ABI,
          data: receipt.logs[execFailedIdx].data,
          topics: receipt.logs[execFailedIdx].topics,
        });
        toast.error(
          <ToastContent
            title={t('pages.trade.orders-table.toasts.tx-failed.title')}
            bodyLines={[
              {
                label: t('pages.trade.orders-table.toasts.tx-failed.body'),
                value: (args as { reason: string }).reason,
              },
            ]}
          />
        );
      }
    },
    onError(reason) {
      toast.error(
        <ToastContent
          title={t('pages.trade.orders-table.toasts.tx-failed.title')}
          bodyLines={[{ label: t('pages.trade.orders-table.toasts.tx-failed.body'), value: reason.message }]}
        />
      );
    },
    onSettled() {
      setTxHash(undefined);
      refreshOpenOrders().then();
    },
    enabled: !!address && !!txHash,
  });

  const handleCancelOrderConfirm = () => {
    if (!selectedOrder) {
      return;
    }

    if (requestSent) {
      return;
    }

    if (isDisconnected || !walletClient) {
      return;
    }

    setRequestSent(true);
    getCancelOrder(chainId, traderAPI, selectedOrder.symbol, selectedOrder.id)
      .then((data) => {
        if (data.data.digest) {
          cancelOrder(walletClient, HashZero, data.data, selectedOrder.id)
            .then((tx) => {
              setCancelModalOpen(false);
              setSelectedOrder(null);
              setRequestSent(false);
              console.log(`cancelOrder tx hash: ${tx.hash}`);
              toast.success(
                <ToastContent title={t('pages.trade.orders-table.toasts.cancel-order.title')} bodyLines={[]} />
              );
              setTxHash(tx.hash);
            })
            .catch((error) => {
              console.error(error);
              setRequestSent(false);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        setRequestSent(false);
      });
  };

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.OPEN_ORDERS]: refreshOpenOrders }));
  }, [refreshOpenOrders, setTableRefreshHandlers]);

  const openOrdersHeaders: TableHeaderI<OrderI>[] = useMemo(
    () => [
      { id: 'symbol', numeric: false, label: t('pages.trade.orders-table.table-header.symbol'), align: AlignE.Left },
      { id: 'side', numeric: false, label: t('pages.trade.orders-table.table-header.side'), align: AlignE.Left },
      { id: 'type', numeric: false, label: t('pages.trade.orders-table.table-header.type'), align: AlignE.Left },
      {
        id: 'quantity',
        numeric: true,
        label: t('pages.trade.orders-table.table-header.order-size'),
        align: AlignE.Right,
      },
      {
        id: 'limitPrice',
        numeric: true,
        label: t('pages.trade.orders-table.table-header.limit-price'),
        align: AlignE.Right,
      },
      {
        id: 'stopPrice',
        numeric: true,
        label: t('pages.trade.orders-table.table-header.stop-price'),
        align: AlignE.Right,
      },
      {
        id: 'leverage',
        numeric: true,
        label: t('pages.trade.orders-table.table-header.leverage'),
        align: AlignE.Right,
      },
      {
        id: 'deadlineDate',
        numeric: false,
        label: t('pages.trade.orders-table.table-header.good-until'),
        align: AlignE.Left,
      },
    ],
    [t]
  );

  const visibleRows = stableSort(openOrders, getComparator(order, orderBy)).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={styles.tableHolder}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                <SortableHeaders<OrderI>
                  headers={openOrdersHeaders}
                  order={order}
                  orderBy={orderBy}
                  setOrder={setOrder}
                  setOrderBy={setOrderBy}
                />
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                visibleRows.map((openOrder) => (
                  <OpenOrderRow key={openOrder.id} order={openOrder} handleOrderCancel={handleOrderCancel} />
                ))}
              {(!address || openOrders.length === 0) && (
                <EmptyRow
                  colSpan={openOrdersHeaders.length}
                  text={
                    !address
                      ? t('pages.trade.orders-table.table-content.connect')
                      : t('pages.trade.orders-table.table-content.no-open')
                  }
                />
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {(!width || width < MIN_WIDTH_FOR_TABLE) && (
        <Box>
          {address &&
            visibleRows.map((openOrder) => (
              <OpenOrderBlock
                key={openOrder.id}
                headers={openOrdersHeaders}
                order={openOrder}
                handleOrderCancel={handleOrderCancel}
              />
            ))}
          {(!address || openOrders.length === 0) && (
            <Box className={styles.noData}>
              {!address
                ? t('pages.trade.orders-table.table-content.connect')
                : t('pages.trade.orders-table.table-content.no-open')}
            </Box>
          )}
        </Box>
      )}
      {address && openOrders.length > 5 && (
        <Box className={styles.paginationHolder}>
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={openOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(+event.target.value);
              setPage(0);
            }}
            labelRowsPerPage={t('common.pagination.per-page')}
          />
        </Box>
      )}
      <Dialog open={isCancelModalOpen} className={styles.dialog}>
        <DialogTitle>{t('pages.trade.orders-table.cancel-modal.title')}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          {t('pages.trade.orders-table.cancel-modal.content')}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelModal} variant="secondary" size="small">
            {t('pages.trade.orders-table.cancel-modal.back')}
          </Button>
          <Button onClick={handleCancelOrderConfirm} variant="primary" size="small" disabled={requestSent}>
            {t('pages.trade.orders-table.cancel-modal.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
