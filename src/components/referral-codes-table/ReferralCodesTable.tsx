import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { getComparator, stableSort } from 'helpers/tableSort';
import { AlignE, SortOrderE } from 'types/enums';
import type { ReferralTableDataI, TableHeaderI } from 'types/types';

import { ReferralCodeRow } from './elements/referral-code-row/ReferralCodeRow';

import styles from './ReferralCodesTable.module.scss';
import { useResizeDetector } from 'react-resize-detector';
import { ReferralCodeBlock } from './elements/referral-code-block/ReferralCodeBlock';

interface ReferralCodesTablePropsI {
  codes: ReferralTableDataI[];
}

const MIN_WIDTH_FOR_TABLE = 678;

export const ReferralCodesTable = memo(({ codes }: ReferralCodesTablePropsI) => {
  const { t } = useTranslation();

  const { width, ref } = useResizeDetector();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof ReferralTableDataI>('referralCode');

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const referralCodesHeaders = useMemo(() => {
    const headers: TableHeaderI<ReferralTableDataI>[] = [
      { field: 'referralCode', label: t('pages.refer.referrer-tab.codes'), align: AlignE.Left },
    ];

    headers.push({
      field: 'commission',
      label: t('pages.refer.referrer-tab.referrer-rebate-rate'),
      align: AlignE.Right,
    });
    headers.push({
      field: 'discount',
      label: t('pages.refer.referrer-tab.trader-rebate-rate'),
      align: AlignE.Right,
    });

    return headers;
  }, [t]);

  const visibleRows = stableSort(codes, getComparator(order, orderBy)).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className={styles.root} ref={ref}>
      {(!isSmall || (isSmall && width && width >= MIN_WIDTH_FOR_TABLE)) && (
        <TableContainer className={styles.tableHolder}>
          <Table>
            <TableHead>
              <TableRow className={styles.headerLabel}>
                <SortableHeaders<ReferralTableDataI>
                  headers={referralCodesHeaders}
                  order={order}
                  orderBy={orderBy}
                  setOrder={setOrder}
                  setOrderBy={setOrderBy}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((data) => (
                <ReferralCodeRow key={data.referralCode} data={data} fullWidth={width} />
              ))}
              {codes.length === 0 && (
                <EmptyRow colSpan={referralCodesHeaders.length} text={t('pages.refer.referrer-tab.no-codes')} />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {isSmall && width && width < MIN_WIDTH_FOR_TABLE && (
        <Box>
          {visibleRows.map((referralCode) => (
            <ReferralCodeBlock
              key={referralCode.referralCode}
              headers={referralCodesHeaders}
              data={referralCode}
              fullWidth={width}
            />
          ))}
          {visibleRows.length === 0 && <Box className={styles.noData}>{t('pages.refer.referrer-tab.no-codes')}</Box>}
        </Box>
      )}
      {codes.length > 5 && (
        <Box className={styles.paginationHolder}>
          <TablePagination
            align="center"
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={codes.length}
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
