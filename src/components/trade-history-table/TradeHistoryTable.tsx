import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount } from 'wagmi';

import { Table as MuiTable, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { useFilter } from 'components/table/filter-modal/useFilter';
import { FilterModal } from 'components/table/filter-modal/FilterModal';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getTradesHistory } from 'network/history';
import { openOrdersAtom, perpetualsAtom, tradesHistoryAtom } from 'store/pools.store';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { AlignE, FieldTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { TableHeaderI, TradeHistoryWithSymbolDataI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { TradeHistoryBlock } from './elements/trade-history-block/TradeHistoryBlock';
import { TradeHistoryRow } from './elements/TradeHistoryRow';

import { SortableHeaders } from '../table/sortable-header/SortableHeaders';
import styles from './TradeHistoryTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const TradeHistoryTable = memo(() => {
  const { t } = useTranslation();

  const [tradesHistory, setTradesHistory] = useAtom(tradesHistoryAtom);
  const perpetuals = useAtomValue(perpetualsAtom);
  const openOrders = useAtomValue(openOrdersAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);

  const updateTradesHistoryRef = useRef(false);

  const { address, isConnected, chainId } = useAccount();
  const { width, ref } = useResizeDetector();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof TradeHistoryWithSymbolDataI>('timestamp');

  const refreshTradesHistory = useCallback(() => {
    if (updateTradesHistoryRef.current) {
      return;
    }
    if (!address || !isConnected || !isEnabledChain(chainId)) {
      setTradesHistory([]);
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
        fieldType: FieldTypeE.Date,
      },
      {
        field: 'symbol',
        label: t('pages.trade.history-table.table-header.perpetual'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'side',
        label: t('pages.trade.history-table.table-header.side'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'price',
        label: t('pages.trade.history-table.table-header.price'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'quantity',
        label: t('pages.trade.history-table.table-header.quantity'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'fee',
        label: t('pages.trade.history-table.table-header.fee'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'realizedPnl',
        label: t('pages.trade.history-table.table-header.realized-profit'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
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

  const { filter, setFilter, filteredRows } = useFilter(tradesHistoryWithSymbol, tradeHistoryHeaders);

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
        <TableContainer className={classnames(styles.tableHolder, styles.withBackground)}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
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
        <div className={styles.blocksHolder}>
          {address &&
            visibleRows.map((tradeHistory) => (
              <TradeHistoryBlock key={tradeHistory.orderId} headers={tradeHistoryHeaders} tradeHistory={tradeHistory} />
            ))}
          {(!address || tradesHistory.length === 0) && (
            <div className={styles.noData}>
              {!address
                ? t('pages.trade.history-table.table-content.connect')
                : t('pages.trade.history-table.table-content.no-open')}
            </div>
          )}
        </div>
      )}
      {address && tradesHistory.length > 5 && (
        <div
          className={classnames(styles.paginationHolder, {
            [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE,
          })}
        >
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
        </div>
      )}
      <div
        className={classnames(styles.footer, { [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE })}
      ></div>

      <FilterModal headers={tradeHistoryHeaders} filter={filter} setFilter={setFilter} />
    </div>
  );
});
