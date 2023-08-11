import { useAtom } from 'jotai';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useWaitForTransaction, useWalletClient } from 'wagmi';

import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import { cancelOrder } from 'blockchain-api/contract-interactions/cancelOrder';
import { signMessages } from 'blockchain-api/signMessage';
import { Dialog } from 'components/dialog/Dialog';
import { EmptyTableRow } from 'components/empty-table-row/EmptyTableRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getCancelOrder, getOpenOrders } from 'network/network';
import {
  clearOpenOrdersAtom,
  openOrdersAtom,
  selectedPoolAtom,
  traderAPIAtom,
  traderAPIBusyAtom,
} from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { AlignE, TableTypeE } from 'types/enums';
import type { AddressT, OrderWithIdI, TableHeaderI } from 'types/types';

import { OpenOrderRow } from './elements/OpenOrderRow';
import { OpenOrderBlock } from './elements/open-order-block/OpenOrderBlock';

import styles from './OpenOrdersTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 900;

export const OpenOrdersTable = memo(() => {
  const { t } = useTranslation();

  const { address, isDisconnected, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient({ chainId: chainId });
  const { width, ref } = useResizeDetector();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const [, clearOpenOrders] = useAtom(clearOpenOrdersAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [isAPIBusy, setAPIBusy] = useAtom(traderAPIBusyAtom);
  const [, setTableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithIdI | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [txHash, setTxHash] = useState<AddressT | undefined>(undefined);

  const traderAPIRef = useRef(traderAPI);
  const isAPIBusyRef = useRef(isAPIBusy);

  useEffect(() => {
    if (isDisconnected || traderAPIRef.current?.chainId !== chainId) {
      clearOpenOrders();
    }
  }, [isDisconnected, chainId, clearOpenOrders]);

  const handleOrderCancel = useCallback((order: OrderWithIdI) => {
    setCancelModalOpen(true);
    setSelectedOrder(order);
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const refreshOpenOrders = useCallback(async () => {
    if (selectedPool?.poolSymbol && address && isConnected && chainId && isSDKConnected) {
      if (isAPIBusyRef.current || chainId !== traderAPIRef.current?.chainId) {
        return;
      }
      setAPIBusy(true);
      await getOpenOrders(chainId, traderAPIRef.current, selectedPool.poolSymbol, address, Date.now())
        .then(({ data }) => {
          setAPIBusy(false);
          clearOpenOrders();
          if (data && data.length > 0) {
            data.map((o) => setOpenOrders(o));
          }
        })
        .catch((err) => {
          console.error(err);
          setAPIBusy(false);
        });
    }
  }, [chainId, address, selectedPool, isConnected, isSDKConnected, setAPIBusy, setOpenOrders, clearOpenOrders]);

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      toast.success(
        <ToastContent
          title={t('pages.trade.orders-table.toasts.order-cancelled.title')}
          bodyLines={[
            {
              label: t('pages.trade.orders-table.toasts.order-cancelled.body'),
              value: selectedOrder?.symbol,
            },
          ]}
        />
      );
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
      refreshOpenOrders();
    },
    enabled: !!address && !!selectedOrder && !!txHash,
  });

  const handleCancelOrderConfirm = useCallback(() => {
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
    getCancelOrder(chainId, traderAPIRef.current, selectedOrder.symbol, selectedOrder.id)
      .then((data) => {
        if (data.data.digest) {
          signMessages(walletClient, [data.data.digest]).then((signatures) => {
            cancelOrder(walletClient, signatures[0], data.data, selectedOrder.id).then((tx) => {
              setCancelModalOpen(false);
              console.log(`cancelOrder tx hash: ${tx.hash}`);
              toast.success(
                <ToastContent title={t('pages.trade.orders-table.toasts.cancel-order.title')} bodyLines={[]} />
              );
              setTxHash(tx.hash);
            });
          });
        }
      })
      .catch((error) => {
        console.error(error);
        let msg = (error?.message ?? error) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.trade.orders-table.toasts.error-processing.title')}
            bodyLines={[{ label: t('pages.trade.orders-table.toasts.error-processing.body'), value: msg }]}
          />
        );
      })
      .finally(() => {
        setSelectedOrder(null);
        setRequestSent(false);
      });
  }, [selectedOrder, requestSent, isDisconnected, walletClient, chainId, t]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }, []);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.OPEN_ORDERS]: refreshOpenOrders }));
  }, [refreshOpenOrders, setTableRefreshHandlers]);

  useEffect(() => {
    if (isSDKConnected) {
      traderAPIRef.current = traderAPI;
    }
  }, [traderAPI, isSDKConnected]);

  const openOrdersHeaders: TableHeaderI[] = useMemo(
    () => [
      { label: t('pages.trade.orders-table.table-header.symbol'), align: AlignE.Left },
      { label: t('pages.trade.orders-table.table-header.side'), align: AlignE.Left },
      { label: t('pages.trade.orders-table.table-header.type'), align: AlignE.Left },
      { label: t('pages.trade.orders-table.table-header.order-size'), align: AlignE.Right },
      { label: t('pages.trade.orders-table.table-header.limit-price'), align: AlignE.Right },
      { label: t('pages.trade.orders-table.table-header.stop-price'), align: AlignE.Right },
      { label: t('pages.trade.orders-table.table-header.leverage'), align: AlignE.Right },
      { label: t('pages.trade.orders-table.table-header.good-until'), align: AlignE.Left },
    ],
    [t]
  );

  const sortedOpenOrders = useMemo(
    () =>
      openOrders.sort((order1, order2) => {
        if (!order2.executionTimestamp) {
          return -1;
        }
        if (!order1.executionTimestamp) {
          return 1;
        }
        return order2.executionTimestamp - order1.executionTimestamp;
      }),
    [openOrders]
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={styles.tableHolder}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                {openOrdersHeaders.map((header) => (
                  <TableCell key={header.label.toString()} align={header.align}>
                    <Typography variant="bodySmall">{header.label}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                sortedOpenOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => <OpenOrderRow key={order.id} order={order} handleOrderCancel={handleOrderCancel} />)}
              {(!address || sortedOpenOrders.length === 0) && (
                <EmptyTableRow
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
            sortedOpenOrders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                <OpenOrderBlock
                  key={order.id}
                  headers={openOrdersHeaders}
                  order={order}
                  handleOrderCancel={handleOrderCancel}
                />
              ))}
          {(!address || sortedOpenOrders.length === 0) && (
            <Box className={styles.noData}>
              {!address
                ? t('pages.trade.orders-table.table-content.connect')
                : t('pages.trade.orders-table.table-content.no-open')}
            </Box>
          )}
        </Box>
      )}
      {address && sortedOpenOrders.length > 5 && (
        <Box className={styles.paginationHolder}>
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={sortedOpenOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
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
