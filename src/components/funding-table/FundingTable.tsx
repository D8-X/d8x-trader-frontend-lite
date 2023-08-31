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
import { getFundingRatePayments } from 'network/history';
import { fundingListAtom, perpetualsAtom, positionsAtom } from 'store/pools.store';
import { AlignE, TableTypeE } from 'types/enums';
import type { TableHeaderI } from 'types/types';

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

  const fundingListHeaders: TableHeaderI[] = useMemo(
    () => [
      { label: t('pages.trade.funding-table.table-header.time'), align: AlignE.Left },
      { label: t('pages.trade.funding-table.table-header.perpetual'), align: AlignE.Left },
      { label: t('pages.trade.funding-table.table-header.funding-payment'), align: AlignE.Right },
    ],
    [t]
  );

  return (
    <div className={styles.root} ref={ref}>
      {width && width >= MIN_WIDTH_FOR_TABLE && (
        <TableContainer className={styles.root}>
          <MuiTable>
            <TableHead className={styles.tableHead}>
              <TableRow>
                {fundingListHeaders.map((header) => (
                  <TableCell key={header.label.toString()} align={header.align}>
                    <Typography variant="bodySmall">{header.label}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className={styles.tableBody}>
              {address &&
                fundingList
                  .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((funding) => (
                    <FundingRow
                      key={`${funding.perpetualId}-${funding.timestamp}`}
                      headers={fundingListHeaders}
                      perpetuals={perpetuals}
                      funding={funding}
                    />
                  ))}
              {(!address || fundingList.length === 0) && (
                <EmptyTableRow
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
            fundingList
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((funding) => (
                <FundingBlock
                  key={`${funding.perpetualId}-${funding.timestamp}`}
                  headers={fundingListHeaders}
                  perpetuals={perpetuals}
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
    </div>
  );
});
