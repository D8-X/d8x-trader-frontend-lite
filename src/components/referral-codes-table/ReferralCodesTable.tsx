import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Table, TableBody, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material';

import { EmptyRow } from 'components/table/empty-row/EmptyRow';
import { SortableHeaders } from 'components/table/sortable-header/SortableHeaders';
import { getComparator, stableSort } from 'helpers/tableSort';
import { AlignE, SortOrderE } from 'types/enums';
import type { ReferrerDataI, TableHeaderI } from 'types/types';

import { ReferralCodesRow } from './elements/referral-codes-row/ReferralCodesRow';

import styles from './ReferralCodesTable.module.scss';

interface ReferralCodesTablePropsI {
  isAgency: boolean;
  codes: ReferrerDataI[];
}

export const ReferralCodesTable = memo(({ isAgency, codes }: ReferralCodesTablePropsI) => {
  const { t } = useTranslation();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Desc);
  const [orderBy, setOrderBy] = useState<keyof ReferrerDataI>('createdOn');

  const referralCodesHeaders = useMemo(() => {
    const headers: TableHeaderI<ReferrerDataI>[] = [
      { field: 'code', label: t('pages.refer.referrer-tab.codes'), align: AlignE.Left },
    ];

    if (!isAgency) {
      headers.push({ label: '', align: AlignE.Right });
    }

    headers.push({
      field: 'referrerRebatePerc',
      label: t('pages.refer.referrer-tab.referrer-rebate-rate'),
      align: AlignE.Right,
    });
    headers.push({
      field: 'traderRebatePerc',
      label: t('pages.refer.referrer-tab.trader-rebate-rate'),
      align: AlignE.Right,
    });

    if (isAgency) {
      headers.push({
        field: 'agencyRebatePerc',
        label: t('pages.refer.referrer-tab.agency-rebate-rate'),
        align: AlignE.Right,
      });
      headers.push({ label: t('pages.refer.referrer-tab.modify'), align: AlignE.Center });
    }
    return headers;
  }, [isAgency, t]);

  const visibleRows = stableSort(codes, getComparator(order, orderBy)).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow className={styles.headerLabel}>
            <SortableHeaders<ReferrerDataI>
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
            <ReferralCodesRow key={data.code} data={data} isAgency={isAgency} />
          ))}
          {codes.length === 0 && (
            <EmptyRow colSpan={referralCodesHeaders.length} text={t('pages.refer.referrer-tab.no-codes')} />
          )}
        </TableBody>
      </Table>
      {codes.length > 5 && (
        <Box>
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
    </TableContainer>
  );
});
