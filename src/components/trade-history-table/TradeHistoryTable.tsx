import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const MIN_WIDTH_FOR_TABLE = 788;

export const TradeHistoryTable = memo(() => {
  const { t } = useTranslation();
  const [tradesHistory, setTradesHistory] = useAtom(tradesHistoryAtom);
  const [perpetuals] = useAtom(perpetualsAtom);
  const [openOrders] = useAtom(openOrdersAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);

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

  const tradeHistoryHeaders: TableHeaderI[] = useMemo(
    () => [
      { label: t('pages.trade.history-table.table-header.time'), align: AlignE.Left },
      { label: t('pages.trade.history-table.table-header.perpetual'), align: AlignE.Left },
      { label: t('pages.trade.history-table.table-header.side'), align: AlignE.Left },
      { label: t('pages.trade.history-table.table-header.price'), align: AlignE.Right },
      { label: t('pages.trade.history-table.table-header.quantity'), align: AlignE.Right },
      { label: t('pages.trade.history-table.table-header.fee'), align: AlignE.Right },
      { label: t('pages.trade.history-table.table-header.realized-profit'), align: AlignE.Right },
    ],
    [t]
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
                  .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
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
                  text={
                    !address
                      ? t('pages.trade.history-table.table-content.connect')
                      : t('pages.trade.history-table.table-content.no-open')
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
            <Box className={styles.noData}>
              {!address
                ? t('pages.trade.history-table.table-content.connect')
                : t('pages.trade.history-table.table-content.no-open')}
            </Box>
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
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(+event.target.value);
              setPage(0);
            }}
            labelRowsPerPage={t('common.pagination.per-page')}
          />
        </Box>
      )}
    </div>
  );
});
