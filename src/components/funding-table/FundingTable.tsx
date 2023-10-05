import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';
import { useAccount, useChainId } from 'wagmi';

import { Box, Table as MuiTable, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { FilterI, FilterPopup } from 'components/table/filter-popup/FilterPopup';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { getComparator, stableSort } from 'helpers/tableSort';
import { getFundingRatePayments } from 'network/history';
import { fundingListAtom, perpetualsAtom, positionsAtom } from 'store/pools.store';
import { AlignE, FieldTypeE, SortOrderE, TableTypeE } from 'types/enums';
import type { FundingWithSymbolDataI, TableHeaderI } from 'types/types';

import { FundingBlock } from './elements/funding-block/FundingBlock';
import { FundingRow } from './elements/FundingRow';

import { tableRefreshHandlersAtom } from 'store/tables.store';

import styles from './FundingTable.module.scss';

const MIN_WIDTH_FOR_TABLE = 788;

export const FundingTable = memo(() => {
  const { t } = useTranslation();

  const [fundingList, setFundingList] = useAtom(fundingListAtom);
  const [perpetuals] = useAtom(perpetualsAtom);
  const [positions] = useAtom(positionsAtom);
  const setTableRefreshHandlers = useSetAtom(tableRefreshHandlersAtom);

  const updateTradesHistoryRef = useRef(false);

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { width, ref } = useResizeDetector();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof FundingWithSymbolDataI>('timestamp');
  const [filter, setFilter] = useState<FilterI<FundingWithSymbolDataI>>({});

  const refreshFundingList = useCallback(() => {
    if (updateTradesHistoryRef.current || !address || !isConnected) {
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

      return {
        ...funding,
        symbol: perpetual ? `${perpetual.baseCurrency}/${perpetual.quoteCurrency}/${perpetual.poolName}` : '',
        perpetual: perpetual ?? null,
      };
    });
  }, [fundingList, perpetuals]);

  const filteredRows = useMemo(() => {
    if (filter.field && filter.value) {
      const checkStr = filter.value.toLowerCase();
      const fieldType = filter.fieldType;

      return fundingListWithSymbol.filter((fundingRecord) => {
        // eslint-disable-next-line
        // @ts-ignore
        const filterField = fundingRecord[filter.field];

        if (fieldType === FieldTypeE.Number) {
          const filterType = filter.filterType;
          if (filterType === '=') {
            return filterField === Number(checkStr);
          } else if (filterType === '>') {
            return filterField >= Number(checkStr);
          } else if (filterType === '<') {
            return filterField <= Number(checkStr);
          }
        } else if (fieldType === FieldTypeE.Date) {
          const filterType = filter.filterType;
          if (filterType === '=') {
            return filterField === Number(checkStr);
          } else if (filterType === '>') {
            return filterField >= Number(checkStr);
          } else if (filterType === '<') {
            return filterField <= Number(checkStr);
          }
        }

        return String(filterField).toLowerCase().includes(checkStr);
      });
    }
    return fundingListWithSymbol;
  }, [fundingListWithSymbol, filter]);

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
        <TableContainer className={styles.root}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow className={styles.tableHolder}>
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
        <Box>
          {address &&
            visibleRows.map((funding) => (
              <FundingBlock
                key={`${funding.perpetualId}-${funding.timestamp}`}
                headers={fundingListHeaders}
                funding={funding}
              />
            ))}
          {(!address || fundingList.length === 0) && (
            <Box className={styles.noData}>
              {!address
                ? t('pages.trade.funding-table.table-content.connect')
                : t('pages.trade.funding-table.table-content.no-open')}
            </Box>
          )}
        </Box>
      )}
      {address && fundingList.length > 5 && (
        <Box className={styles.paginationHolder}>
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
        </Box>
      )}
      <FilterPopup headers={fundingListHeaders} filter={filter} setFilter={setFilter} />
    </div>
  );
});
