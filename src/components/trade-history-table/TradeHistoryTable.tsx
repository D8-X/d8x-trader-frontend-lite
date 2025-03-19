import classnames from 'classnames';
import { useSetAtom } from 'jotai';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount } from 'wagmi';

import { Table as MuiTable, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { useFilter } from 'components/table/filter-modal/useFilter';
import { FilterModal } from 'components/table/filter-modal/FilterModal';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { getComparator, stableSort } from 'helpers/tableSort';
import { tableRefreshHandlersAtom } from 'store/tables.store';
import { AlignE, FieldTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { TableHeaderI, TradeHistoryWithSymbolDataI } from 'types/types';

import { TradeHistoryBlock } from './elements/trade-history-block/TradeHistoryBlock';
import { TradeHistoryRow } from './elements/TradeHistoryRow';
import { useTradesHistory } from './hooks/useTradesHistory';

import styles from './TradeHistoryTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const TradeHistoryTable = memo(() => {
  const { t } = useTranslation();

  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);

  const { address } = useAccount();
  const { width, ref } = useResizeDetector();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof TradeHistoryWithSymbolDataI>('timestamp');

  const { tradesHistory, refreshTradesHistory } = useTradesHistory();

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.TRADE_HISTORY]: refreshTradesHistory }));
  }, [refreshTradesHistory, setTableRefreshHandlers]);

  const tradeHistoryHeaders: TableHeaderI<TradeHistoryWithSymbolDataI>[] = useMemo(
    () => [
      {
        field: 'timestamp',
        label: t('pages.trade.history-table.table-header.time'),
        align: AlignE.Left,
        fieldType: FieldTypeE.Date,
        hidden: true,
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
        hidden: true,
      },
      {
        field: 'quantity',
        label: t('pages.trade.history-table.table-header.quantity'),
        align: AlignE.Left,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'price',
        label: `${t('pages.trade.history-table.table-header.price')}/${t(
          'pages.trade.history-table.table-header.fee'
        )}`,
        // label: t('pages.trade.history-table.table-header.price'),
        align: AlignE.Left,
        fieldType: FieldTypeE.Number,
      },
      {
        field: 'price',
        label: t('pages.trade.history-table.table-header.price'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
        hidden: true,
      },
      {
        field: 'fee',
        label: t('pages.trade.history-table.table-header.fee'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
        hidden: true,
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

  const { filter, setFilter, filteredRows } = useFilter(tradesHistory, tradeHistoryHeaders);

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

  const onlyTableHeaders = tradeHistoryHeaders.filter(({ hidden }) => !hidden);

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={classnames(styles.tableHolder, styles.withBackground)}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                <SortableHeaders<TradeHistoryWithSymbolDataI>
                  headers={onlyTableHeaders}
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
                  <TradeHistoryRow key={tradeHistory.orderId} headers={onlyTableHeaders} tradeHistory={tradeHistory} />
                ))}
              {(!address || tradesHistory.length === 0) && (
                <EmptyRow
                  colSpan={onlyTableHeaders.length}
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
