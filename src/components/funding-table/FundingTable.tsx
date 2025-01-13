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
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getFundingRatePayments } from 'network/history';
import { collateralToSettleConversionAtom, fundingListAtom, perpetualsAtom, positionsAtom } from 'store/pools.store';
import { AlignE, FieldTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { FundingWithSymbolDataI, TableHeaderI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

import { FundingBlock } from './elements/funding-block/FundingBlock';
import { FundingRow } from './elements/FundingRow';

import { tableRefreshHandlersAtom } from 'store/tables.store';

import styles from './FundingTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const FundingTable = memo(() => {
  const { t } = useTranslation();

  const [fundingList, setFundingList] = useAtom(fundingListAtom);
  const perpetuals = useAtomValue(perpetualsAtom);
  const positions = useAtomValue(positionsAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);
  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const { address, isConnected, chainId } = useAccount();
  const { width, ref } = useResizeDetector();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof FundingWithSymbolDataI>('timestamp');

  const updateTradesHistoryRef = useRef(false);

  const refreshFundingList = useCallback(() => {
    if (updateTradesHistoryRef.current) {
      return;
    }
    if (!address || !isConnected || !isEnabledChain(chainId)) {
      setFundingList([]);
      return;
    }

    updateTradesHistoryRef.current = true;
    getFundingRatePayments(chainId, address)
      .then((data) => {
        setFundingList(data.length > 0 ? data : []);
      })
      .catch(console.error)
      .finally(() => {
        updateTradesHistoryRef.current = false;
      });
  }, [chainId, address, isConnected, setFundingList]);

  useEffect(() => {
    setTableRefreshHandlers((prev) => ({ ...prev, [TableTypeE.FUNDING]: refreshFundingList }));
  }, [refreshFundingList, setTableRefreshHandlers]);

  useEffect(() => {
    refreshFundingList();
  }, [positions, refreshFundingList]); // "positions" change should affect refresh for Funding table

  const fundingListHeaders: TableHeaderI<FundingWithSymbolDataI>[] = useMemo(
    () => [
      {
        field: 'timestamp',
        label: t('pages.trade.funding-table.table-header.time'),
        align: AlignE.Left,
        fieldType: FieldTypeE.Date,
      },
      {
        field: 'symbol',
        label: t('pages.trade.funding-table.table-header.perpetual'),
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
      {
        field: 'amount',
        label: t('pages.trade.funding-table.table-header.funding-payment'),
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      },
    ],
    [t]
  );

  const fundingListWithSymbol = useMemo(() => {
    return fundingList.map((funding): FundingWithSymbolDataI => {
      const perpetual = perpetuals.find(({ id }) => id === funding.perpetualId);
      const settleSymbol = perpetual?.poolName ? (c2s.get(perpetual?.poolName)?.settleSymbol ?? '') : '';
      return {
        ...funding,
        amount: -funding.amount,
        symbol: perpetual ? `${perpetual.baseCurrency}/${perpetual.quoteCurrency}/${settleSymbol}` : '',
        settleSymbol,
        perpetual: perpetual ?? null,
      };
    });
  }, [fundingList, perpetuals, c2s]);

  const { filter, setFilter, filteredRows } = useFilter(fundingListWithSymbol, fundingListHeaders);

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
                <SortableHeaders<FundingWithSymbolDataI>
                  headers={fundingListHeaders}
                  order={order}
                  orderBy={orderBy}
                  setOrder={setOrder}
                  setOrderBy={setOrderBy}
                />
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                visibleRows.map((funding) => (
                  <FundingRow
                    key={`${funding.perpetualId}-${funding.timestamp}`}
                    headers={fundingListHeaders}
                    funding={funding}
                  />
                ))}
              {(!address || fundingList.length === 0) && (
                <EmptyRow
                  colSpan={fundingListHeaders.length}
                  text={
                    !address
                      ? t('pages.trade.funding-table.table-content.connect')
                      : t('pages.trade.funding-table.table-content.no-open')
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
            visibleRows.map((funding) => (
              <FundingBlock
                key={`${funding.perpetualId}-${funding.timestamp}`}
                headers={fundingListHeaders}
                funding={funding}
              />
            ))}
          {(!address || fundingList.length === 0) && (
            <div className={styles.noData}>
              {!address
                ? t('pages.trade.funding-table.table-content.connect')
                : t('pages.trade.funding-table.table-content.no-open')}
            </div>
          )}
        </div>
      )}
      {address && fundingList.length > 5 && (
        <div
          className={classnames(styles.paginationHolder, {
            [styles.withBackground]: width && width >= MIN_WIDTH_FOR_TABLE,
          })}
        >
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={fundingList.length}
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

      <FilterModal headers={fundingListHeaders} filter={filter} setFilter={setFilter} />
    </div>
  );
});
