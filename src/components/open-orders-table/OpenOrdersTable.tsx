import { LOB_ABI, PROXY_ABI } from '@d8x/perpetuals-sdk';
import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { toast } from 'react-toastify';
import { type Address, decodeEventLog, encodeEventTopics } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

import {
  Button,
  CircularProgress,
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

import { HashZero } from 'appConstants';
import { cancelOrder } from 'blockchain-api/contract-interactions/cancelOrder';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { FilterModal } from 'components/table/filter-modal/FilterModal';
import { useFilter } from 'components/table/filter-modal/useFilter';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getCancelOrder, getOpenOrders } from 'network/network';
import { tradingClientAtom } from 'store/app.store';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { clearOpenOrdersAtom, openOrdersAtom, traderAPIAtom, traderAPIBusyAtom } from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { AlignE, FieldTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { OrderWithIdI, TableHeaderI, TemporaryAnyT } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { OpenOrderRow } from './elements/OpenOrderRow';
import { OpenOrderBlock } from './elements/open-order-block/OpenOrderBlock';

import styles from './OpenOrdersTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;
const TOPIC_CANCEL_SUCCESS = encodeEventTopics({ abi: PROXY_ABI, eventName: 'PerpetualLimitOrderCancelled' })[0];
const TOPIC_CANCEL_FAIL = encodeEventTopics({ abi: LOB_ABI, eventName: 'ExecutionFailed' })[0];

export const OpenOrdersTable = memo(() => {
  const { t } = useTranslation();

  const { chain, chainId, address, isDisconnected, isConnected } = useAccount();
  const { width, ref } = useResizeDetector();

  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const isSDKConnected = useAtomValue(sdkConnectedAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const clearOpenOrders = useSetAtom(clearOpenOrdersAtom);
  const setAPIBusy = useSetAtom(traderAPIBusyAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithIdI | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof OrderWithIdI>('executionTimestamp');
  const [txHash, setTxHash] = useState<Address>();
  const [loading, setLoading] = useState(false);

  const isAPIBusyRef = useRef(false);

  const handleOrderCancel = useCallback((orderToCancel: OrderWithIdI) => {
    setCancelModalOpen(true);
    setSelectedOrder(orderToCancel);
  }, []);

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedOrder(null);
  };

  const refreshOpenOrders = useCallback(async () => {
    if (
      isAPIBusyRef.current ||
      !address ||
      !traderAPI ||
      traderAPI.chainId !== chainId ||
      !isConnected ||
      !isEnabledChain(chainId) ||
      !isSDKConnected
    ) {
      return;
    }

    setAPIBusy(true);
    isAPIBusyRef.current = true;

    await getOpenOrders(chainId, traderAPI, address, Date.now())
      .then(({ data }) => {
        clearOpenOrders();
        if (data?.length > 0) {
          data.map(setOpenOrders);
        }
      })
      .catch(console.error)
      .finally(() => {
        isAPIBusyRef.current = false;
        setAPIBusy(false);
      });
  }, [chainId, address, isConnected, isSDKConnected, setAPIBusy, setOpenOrders, clearOpenOrders, traderAPI]);

  const {
    data: receipt,
    isSuccess,
    isError,
    error,
    isFetched,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && isEnabledChain(chainId) && !!txHash },
  });

  useEffect(() => {
    if (!isFetched) {
      return;
    }
    setTxHash(undefined);
    setLoading(false);
    refreshOpenOrders().then();
    setLatestOrderSentTimestamp(Date.now());
  }, [isFetched, setTxHash, refreshOpenOrders, setLatestOrderSentTimestamp]);

  useEffect(() => {
    if (!error || !isError) {
      return;
    }
    toast.error(
      <ToastContent
        title={t('pages.trade.orders-table.toasts.tx-failed.title')}
        bodyLines={[{ label: t('pages.trade.orders-table.toasts.tx-failed.body'), value: error.message }]}
      />
    );
  }, [error, isError, t]);

  useEffect(() => {
    if (!receipt || !isSuccess) {
      return;
    }

    const cancelEventIdx = receipt.logs.findIndex((log) => log.topics[0] === TOPIC_CANCEL_SUCCESS);
    if (cancelEventIdx >= 0) {
      toast.success(
        <ToastContent
          title={t('pages.trade.orders-table.toasts.order-cancelled.title')}
          bodyLines={[
            {
              label: t('pages.trade.orders-table.toasts.order-cancelled.body'),
              value: '',
            },
            {
              label: '',
              value: (
                <a
                  href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.shareLink}
                >
                  {txHash}
                </a>
              ),
            },
          ]}
        />
      );
    } else {
      const execFailedIdx = receipt.logs.findIndex((log) => log.topics[0] === TOPIC_CANCEL_FAIL);
      const { args } = decodeEventLog({
        abi: LOB_ABI as readonly string[],
        data: receipt.logs[execFailedIdx].data,
        topics: receipt.logs[execFailedIdx].topics,
      });
      toast.error(
        <ToastContent
          title={t('pages.trade.orders-table.toasts.tx-failed.title')}
          bodyLines={[
            {
              label: t('pages.trade.orders-table.toasts.tx-failed.body'),
              value: (args as unknown as { reason: string }).reason,
            },
          ]}
        />
      );
    }
  }, [receipt, isSuccess, t, chain, txHash]);

  const handleCancelOrderConfirm = () => {
    if (!selectedOrder) {
      return;
    }

    if (requestSent) {
      return;
    }

    if (isDisconnected || !tradingClient || !traderAPI || !chainId || !isEnabledChain(chainId)) {
      return;
    }

    setLoading(true);
    setRequestSent(true);
    getCancelOrder(chainId, traderAPI, selectedOrder.symbol, selectedOrder.id)
      .then((data) => {
        if (data.data.digest) {
          cancelOrder(tradingClient, HashZero, data.data, selectedOrder.id)
            .then(({ hash }) => {
              setCancelModalOpen(false);
              setSelectedOrder(null);
              setRequestSent(false);
              toast.success(
                <ToastContent title={t('pages.trade.orders-table.toasts.cancel-order.title')} bodyLines={[]} />
              );
              setTxHash(hash);
            })
            .catch((e) => {
              console.error(e);
              setRequestSent(false);
              setLoading(false);
            });
        } else {
          setLoading(false);
          setRequestSent(false);
        }
      })
      .catch((e) => {
        console.error(e);
        setRequestSent(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.OPEN_ORDERS]: refreshOpenOrders }));
  }, [refreshOpenOrders, setTableRefreshHandlers]);

  const openOrdersHeaders: TableHeaderI<OrderWithIdI>[] = useMemo(
    () => [
      {
        field: 'symbol',
        label: t('pages.trade.orders-table.table-header.symbol'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'side',
        label: t('pages.trade.orders-table.table-header.side'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'type',
        label: t('pages.trade.orders-table.table-header.type'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'quantity',
        label: t('pages.trade.orders-table.table-header.order-size'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'limitPrice',
        label: t('pages.trade.orders-table.table-header.limit-price'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'stopPrice',
        label: t('pages.trade.orders-table.table-header.stop-price'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'reduceOnly',
        label: t('pages.trade.orders-table.table-header.reduce-only'),
        align: AlignE.Left,
        fieldType: FieldTypeE.Boolean,
      },
      {
        field: 'leverage',
        label: t('pages.trade.orders-table.table-header.leverage'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'deadline',
        label: t('pages.trade.orders-table.table-header.good-until'),
        align: AlignE.Left,
        fieldType: FieldTypeE.Date,
      },
    ],
    [t]
  );

  const { filter, setFilter, filteredRows } = useFilter(openOrders, openOrdersHeaders);

  const visibleRows = useMemo(
    () =>
      // FIXME: VOV: Get rid from `<TemporaryAnyT>` later
      stableSort(filteredRows, getComparator<TemporaryAnyT>(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredRows, order, orderBy, page, rowsPerPage]
  );

  useEffect(() => {
    if (filteredRows.length > 0 && filteredRows.length <= page * rowsPerPage) {
      setPage((prevPage) => Math.max(0, prevPage - 1));
    }
  }, [filteredRows.length, page, rowsPerPage]);

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={classnames(styles.tableHolder, styles.withBackground)}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                <SortableHeaders<OrderWithIdI>
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
        <div className={styles.blocksHolder}>
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
            <div className={styles.noData}>
              {!address
                ? t('pages.trade.orders-table.table-content.connect')
                : t('pages.trade.orders-table.table-content.no-open')}
            </div>
          )}
        </div>
      )}
      {address && filteredRows.length > 5 && (
        <div
          className={classnames(styles.paginationHolder, {
            [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE,
          })}
        >
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(+event.target.value);
              setPage(0);
            }}
            labelRowsPerPage={t('common.pagination.per-page')}
          />
        </div>
      )}
      <div className={classnames(styles.footer, { [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE })} />

      <FilterModal headers={openOrdersHeaders} filter={filter} setFilter={setFilter} />
      <Dialog open={isCancelModalOpen} className={styles.dialog}>
        <DialogTitle>{t('pages.trade.orders-table.cancel-modal.title')}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          {t('pages.trade.orders-table.cancel-modal.content')}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelModal} variant="secondary" size="small">
            {t('pages.trade.orders-table.cancel-modal.back')}
          </Button>
          <GasDepositChecker>
            <Button onClick={handleCancelOrderConfirm} variant="primary" size="small" disabled={loading || requestSent}>
              {loading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
              {t('pages.trade.orders-table.cancel-modal.confirm')}
            </Button>
          </GasDepositChecker>
        </DialogActions>
      </Dialog>
    </div>
  );
});
