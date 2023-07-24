import { useAtom } from 'jotai';
import type { ChangeEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount, useChainId } from 'wagmi';

import {
  Box,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import { EmptyTableRow } from 'components/empty-table-row/EmptyTableRow';
import { getTradesHistory } from 'network/history';
import { openOrdersAtom, perpetualsAtom, tradesHistoryAtom } from 'store/pools.store';
import { AlignE, TableTypeE } from 'types/enums';
import type { TableHeaderI } from 'types/types';

import { TradeHistoryBlock } from './elements/trade-history-block/TradeHistoryBlock';
import { TradeHistoryRow } from './elements/TradeHistoryRow';

import { tableRefreshHandlersAtom } from 'store/tables.store';

import styles from './TradeHistoryTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 900;

export const TradeHistoryTable = memo(() => {
  const [tradesHistory, setTradesHistory] = useAtom(tradesHistoryAtom);
  const [perpetuals] = useAtom(perpetualsAtom);
  const [openOrders] = useAtom(openOrdersAtom);
  const [, setTableRefreshHandlers] = useAtom(tableRefreshHandlersAtom);

  const updateTradesHistoryRef = useRef(false);

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { width, ref } = useResizeDetector();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const refreshTradesHistory = useCallback(() => {
    if (updateTradesHistoryRef.current || !address || !isConnected) {
      return;
    }

    updateTradesHistoryRef.current = true;
    getTradesHistory(chainId, address)
      .then((data) => {
        setTradesHistory(data.length > 0 ? data : []);
      })
      .catch(console.error)
      .finally(() => {
        updateTradesHistoryRef.current = false;
      });
  }, [chainId, address, isConnected, setTradesHistory]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.TRADE_HISTORY]: refreshTradesHistory }));
  }, [refreshTradesHistory, setTableRefreshHandlers]);

  useEffect(() => {
    refreshTradesHistory();
  }, [openOrders, refreshTradesHistory]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  }, []);

  const tradeHistoryHeaders: TableHeaderI[] = useMemo(
    () => [
      { label: 'Time', align: AlignE.Left },
      { label: 'Perpetual', align: AlignE.Left },
      { label: 'Side', align: AlignE.Left },
      // { label: 'Type', align: AlignE.Left },
      { label: 'Price', align: AlignE.Right },
      { label: 'Quantity', align: AlignE.Right },
      { label: 'Fee', align: AlignE.Right },
      { label: 'Realized Profit', align: AlignE.Right },
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
                {tradeHistoryHeaders.map((header) => (
                  <TableCell key={header.label.toString()} align={header.align}>
                    <Typography variant="bodySmall">{header.label}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                tradesHistory
                  .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tradeHistory) => (
                    <TradeHistoryRow
                      key={tradeHistory.orderId}
                      headers={tradeHistoryHeaders}
                      perpetuals={perpetuals}
                      tradeHistory={tradeHistory}
                    />
                  ))}
              {(!address || tradesHistory.length === 0) && (
                <EmptyTableRow
                  colSpan={tradeHistoryHeaders.length}
                  text={!address ? 'Please connect your wallet' : 'No trade history'}
                />
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {(!width || width < MIN_WIDTH_FOR_TABLE) && (
        <Box>
          {address &&
            tradesHistory
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((tradeHistory) => (
                <TradeHistoryBlock
                  key={tradeHistory.orderId}
                  headers={tradeHistoryHeaders}
                  perpetuals={perpetuals}
                  tradeHistory={tradeHistory}
                />
              ))}
          {(!address || tradesHistory.length === 0) && (
            <Box className={styles.noData}>{!address ? 'Please connect your wallet' : 'No trade history'}</Box>
          )}
        </Box>
      )}
      {address && tradesHistory.length > 5 && (
        <Box className={styles.paginationHolder}>
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={tradesHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </div>
  );
});
