import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount, useChainId } from 'wagmi';

import { Box, Table as MuiTable, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { FilterI, FilterPopup } from 'components/table/filter-popup/FilterPopup';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getTradesHistory } from 'network/history';
import { openOrdersAtom, perpetualsAtom, tradesHistoryAtom } from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { AlignE, SortOrderE, TableTypeE } from 'types/enums';
import type { TableHeaderI, TradeHistoryWithSymbolDataI } from 'types/types';

import { TradeHistoryBlock } from './elements/trade-history-block/TradeHistoryBlock';
import { TradeHistoryRow } from './elements/TradeHistoryRow';

import { SortableHeaders } from '../table/sortable-header/SortableHeaders';
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
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof TradeHistoryWithSymbolDataI>('timestamp');
  const [filter, setFilter] = useState<FilterI<TradeHistoryWithSymbolDataI>>({});

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

  const tradeHistoryHeaders: TableHeaderI<TradeHistoryWithSymbolDataI>[] = useMemo(
    () => [
      {
        field: 'timestamp',
        label: t('pages.trade.history-table.table-header.time'),
        align: AlignE.Left,
      },
      {
        field: 'symbol',
        label: t('pages.trade.history-table.table-header.perpetual'),
        align: AlignE.Left,
      },
      {
        field: 'side',
        label: t('pages.trade.history-table.table-header.side'),
        align: AlignE.Left,
      },
      {
        field: 'price',
        label: t('pages.trade.history-table.table-header.price'),
        align: AlignE.Right,
      },
      {
        field: 'quantity',
        label: t('pages.trade.history-table.table-header.quantity'),
        align: AlignE.Right,
      },
      { field: 'fee', label: t('pages.trade.history-table.table-header.fee'), align: AlignE.Right },
      {
        field: 'realizedPnl',
        label: t('pages.trade.history-table.table-header.realized-profit'),
        align: AlignE.Right,
      },
    ],
    [t]
  );

  const tradesHistoryWithSymbol: TradeHistoryWithSymbolDataI[] = useMemo(() => {
    return tradesHistory.map((tradeHistory) => {
      const perpetual = perpetuals.find(({ id }) => id === tradeHistory.perpetualId);

      return {
        ...tradeHistory,
        symbol: perpetual ? `${perpetual.baseCurrency}/${perpetual.quoteCurrency}/${perpetual.poolName}` : '',
        perpetual: perpetual ?? null,
      };
    });
  }, [tradesHistory, perpetuals]);

  const filteredRows = useMemo(() => {
    if (filter.field && filter.value) {
      const checkStr = filter.value.toLowerCase();
      return tradesHistoryWithSymbol.filter((position) => {
        // eslint-disable-next-line
        // @ts-ignore
        return String(position[filter.field]).toLowerCase().includes(checkStr);
      });
    }
    return tradesHistoryWithSymbol;
  }, [tradesHistoryWithSymbol, filter]);

  const visibleRows = useMemo(
    () =>
      address
        ? stableSort(filteredRows, getComparator(order, orderBy)).slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
          )
        : [],
    [address, filteredRows, order, orderBy, page, rowsPerPage]
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow className={styles.tableHolder}>
                <SortableHeaders<TradeHistoryWithSymbolDataI>
                  headers={tradeHistoryHeaders}
                  order={order}
                  orderBy={orderBy}
                  setOrder={setOrder}
                  setOrderBy={setOrderBy}
                />
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                visibleRows.map((tradeHistory) => (
                  <TradeHistoryRow
                    key={tradeHistory.orderId}
                    headers={tradeHistoryHeaders}
                    tradeHistory={tradeHistory}
                  />
                ))}
              {(!address || tradesHistory.length === 0) && (
                <EmptyRow
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
            visibleRows.map((tradeHistory) => (
              <TradeHistoryBlock key={tradeHistory.orderId} headers={tradeHistoryHeaders} tradeHistory={tradeHistory} />
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
      <FilterPopup headers={tradeHistoryHeaders} filter={filter} setFilter={setFilter} />
    </div>
  );
});
