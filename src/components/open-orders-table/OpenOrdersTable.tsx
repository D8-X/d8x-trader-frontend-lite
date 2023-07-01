import { useAtom } from 'jotai';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useSigner } from 'wagmi';
import { useResizeDetector } from 'react-resize-detector';

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
import { clearOpenOrdersAtom, openOrdersAtom, selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { AlignE, TableTypeE } from 'types/enums';
import { OrderWithIdI, TableHeaderI } from 'types/types';

import { OpenOrderRow } from './elements/OpenOrderRow';
import { OpenOrderBlock } from './elements/open-order-block/OpenOrderBlock';

import { sdkConnectedAtom } from 'store/liquidity-pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';

import styles from './OpenOrdersTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 900;

export const OpenOrdersTable = memo(() => {
  const { address, isDisconnected } = useAccount();
  const chainId = useChainId();
  const { data: signer } = useSigner();
  const { width, ref } = useResizeDetector();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [openOrders, setOpenOrders] = useAtom(openOrdersAtom);
  const [, clearOpenOrders] = useAtom(clearOpenOrdersAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [, setTableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithIdI | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const traderAPIRef = useRef(traderAPI);
  const openOrdersRefreshedRef = useRef(false);

  useEffect(() => {
    if (isDisconnected) {
      clearOpenOrders();
    }
  }, [isDisconnected, clearOpenOrders]);

  const handleOrderCancel = useCallback((order: OrderWithIdI) => {
    setCancelModalOpen(true);
    setSelectedOrder(order);
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const handleCancelOrderConfirm = useCallback(() => {
    if (!selectedOrder) {
      return;
    }

    if (requestSent) {
      return;
    }

    if (isDisconnected || !signer) {
      return;
    }

    setRequestSent(true);
    getCancelOrder(chainId, traderAPIRef.current, selectedOrder.symbol, selectedOrder.id)
      .then((data) => {
        if (data.data.digest) {
          signMessages(signer, [data.data.digest])
            .then((signatures) => {
              cancelOrder(signer, signatures[0], data.data, selectedOrder.id)
                .then((tx) => {
                  setCancelModalOpen(false);
                  setSelectedOrder(null);
                  setRequestSent(false);
                  console.log(`cancelOrder tx hash: ${tx.hash}`);
                  toast.success(<ToastContent title="Cancel order processed" bodyLines={[]} />);
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .catch((error: any) => {
                  console.error(error);
                  setRequestSent(false);
                });
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
  }, [selectedOrder, requestSent, isDisconnected, signer, chainId]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }, []);

  const refreshOpenOrders = useCallback(() => {
    if (selectedPool !== null && address && !isDisconnected) {
      getOpenOrders(chainId, isSDKConnected ? traderAPIRef.current : null, selectedPool.poolSymbol, address, Date.now())
        .then(({ data }) => {
          if (data) {
            data.map((o) => setOpenOrders(o));
          } else {
            clearOpenOrders();
          }
        })
        .catch((err) => console.log(err));
    }
  }, [chainId, address, selectedPool, isDisconnected, isSDKConnected, setOpenOrders, clearOpenOrders]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.OPEN_ORDERS]: refreshOpenOrders }));
  }, [refreshOpenOrders, setTableRefreshHandlers]);

  useEffect(() => {
    if (!openOrdersRefreshedRef.current) {
      openOrdersRefreshedRef.current = true;
      refreshOpenOrders();
    }
  });

  const openOrdersHeaders: TableHeaderI[] = useMemo(
    () => [
      { label: 'Symbol', align: AlignE.Left },
      { label: 'Side', align: AlignE.Left },
      { label: 'Type', align: AlignE.Left },
      { label: 'Position Size', align: AlignE.Right },
      { label: 'Limit Price', align: AlignE.Right },
      { label: 'Stop Price', align: AlignE.Right },
      { label: 'Leverage', align: AlignE.Right },
      { label: 'Good until', align: AlignE.Left },
    ],
    []
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
                openOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => <OpenOrderRow key={order.id} order={order} handleOrderCancel={handleOrderCancel} />)}
              {(!address || openOrders.length === 0) && (
                <EmptyTableRow
                  colSpan={openOrdersHeaders.length}
                  text={!address ? 'Please connect your wallet' : 'No open orders'}
                />
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {(!width || width < MIN_WIDTH_FOR_TABLE) && (
        <Box>
          {address &&
            openOrders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                <OpenOrderBlock
                  key={order.id}
                  headers={openOrdersHeaders}
                  order={order}
                  handleOrderCancel={handleOrderCancel}
                />
              ))}
          {(!address || openOrders.length === 0) && (
            <Box className={styles.noData}>{!address ? 'Please connect your wallet' : 'No open orders'}</Box>
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
      <Dialog open={isCancelModalOpen} className={styles.dialog}>
        <DialogTitle>Cancel Open Order</DialogTitle>
        <DialogContent className={styles.dialogContent}>Are you sure you want to cancel this order?</DialogContent>
        <DialogActions>
          <Button onClick={closeCancelModal} variant="secondary" size="small">
            Back
          </Button>
          <Button onClick={handleCancelOrderConfirm} variant="primary" size="small" disabled={requestSent}>
            Cancel order
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
