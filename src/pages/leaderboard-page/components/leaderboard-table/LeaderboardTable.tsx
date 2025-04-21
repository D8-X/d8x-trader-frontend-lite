// src/pages/leaderboard-page/components/leaderboard-table/LeaderboardTable.tsx
import React, { useMemo, useState } from 'react';

import {
  Box,
  CircularProgress,
  Table as MuiTable,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import { AllTimeLeaderboardEntryI, PaginationMetadataI, WeeklyLeaderboardEntryI } from '../../../../types/types';
import { SortableHeaders } from '../../../../components/table/sortable-header/SortableHeaders';
import { stableSort } from '../../../../helpers/tableSort';
import { AlignE, FieldTypeE, SortOrderE } from '../../../../types/enums';

import { LeaderboardRow } from './LeaderboardRow';

import styles from './LeaderboardTable.module.scss';

// Define a more specific type for our entries that includes all possible fields
type LeaderboardEntryT = {
  rank?: number;
  trader?: string;
  address?: string;
  pnl?: number;
  vol?: number;
  timeWeightedOI?: string;
  points?: number;
  numWeeks?: number;
  volumeRank?: number;
  isHighestOI?: boolean;
  isLowestPnL?: boolean;
};

interface LeaderboardTablePropsI {
  entries: LeaderboardEntryT[];
  isLoading: boolean;
  isWeekly: boolean;
  paginationMetadata?: PaginationMetadataI;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface TableHeaderI<T> {
  field: keyof T;
  label: string;
  align: AlignE;
  fieldType: FieldTypeE;
}

export const LeaderboardTable = ({
  entries,
  isLoading,
  isWeekly,
  paginationMetadata,
  onPageChange,
  onPageSizeChange,
}: LeaderboardTablePropsI) => {
  const [order, setOrder] = useState<SortOrderE>(SortOrderE.Asc);
  const [orderBy, setOrderBy] = useState<keyof LeaderboardEntryT>('rank');

  const headers = useMemo(() => {
    const baseHeaders: TableHeaderI<LeaderboardEntryT>[] = [
      {
        field: isWeekly ? 'volumeRank' : 'rank',
        label: isWeekly ? 'Volume Rank' : 'Rank',
        align: AlignE.Left,
        fieldType: FieldTypeE.Number,
      },
      {
        field: isWeekly ? 'trader' : 'address',
        label: 'Address',
        align: AlignE.Left,
        fieldType: FieldTypeE.String,
      },
    ];

    if (isWeekly) {
      baseHeaders.push(
        {
          field: 'pnl',
          label: 'PNL',
          align: AlignE.Right,
          fieldType: FieldTypeE.Number,
        },
        {
          field: 'vol',
          label: 'Volume',
          align: AlignE.Right,
          fieldType: FieldTypeE.Number,
        },
        {
          field: 'timeWeightedOI',
          label: 'OI',
          align: AlignE.Right,
          fieldType: FieldTypeE.Number,
        }
      );
    } else {
      baseHeaders.push({
        field: 'points',
        label: 'Points',
        align: AlignE.Right,
        fieldType: FieldTypeE.Number,
      });
    }

    return baseHeaders;
  }, [isWeekly]);

  // Derived state
  const sortedEntries = useMemo(() => {
    if (!entries?.length) return [];

    const sorted = stableSort(entries, (a: LeaderboardEntryT, b: LeaderboardEntryT) => {
      if (orderBy === 'timeWeightedOI') {
        const aValue = parseFloat(a.timeWeightedOI || '0');
        const bValue = parseFloat(b.timeWeightedOI || '0');
        return order === SortOrderE.Desc ? bValue - aValue : aValue - bValue;
      }
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (aValue === undefined || bValue === undefined) return 0;

      if (order === SortOrderE.Desc) {
        if (bValue > aValue) return 1;
        if (bValue < aValue) return -1;
        return 0;
      } else {
        if (aValue > bValue) return 1;
        if (aValue < bValue) return -1;
        return 0;
      }
    });

    if (paginationMetadata) {
      const start = paginationMetadata.currentPage * paginationMetadata.pageSize;
      const end = start + paginationMetadata.pageSize;
      return sorted.slice(start, end);
    }

    return sorted;
  }, [entries, order, orderBy, paginationMetadata]);

  // Style for the table container to make it more readable
  const tableContainerStyles = {
    borderRadius: '8px',
    border: '1px solid var(--d8x-color-border)',
    overflow: 'hidden',
    mb: 3,
  };

  return (
    <Box className={styles.root}>
      {isLoading && (
        <div className={styles.loadingWrapper}>
          <CircularProgress />
        </div>
      )}

      {!isLoading && sortedEntries?.length === 0 && (
        <div className={styles.noData}>
          <Typography variant="h6" className={styles.noDataTitle}>
            No Data Available
          </Typography>
          <Typography variant="body1" className={styles.noDataText}>
            There is no leaderboard data to display at this time.
          </Typography>
          <button className={styles.refreshButton} onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      )}

      {!isLoading && sortedEntries?.length > 0 && (
        <>
          <TableContainer sx={tableContainerStyles} className={styles.tableContainer}>
            <MuiTable>
              <TableHead className={styles.tableHead}>
                <TableRow>
                  <SortableHeaders
                    headers={headers}
                    order={order}
                    orderBy={orderBy}
                    setOrder={setOrder}
                    setOrderBy={setOrderBy}
                  />
                </TableRow>
              </TableHead>
              <TableBody className={styles.tableBody}>
                {sortedEntries.map((entry: LeaderboardEntryT) => {
                  const entryKey = isWeekly
                    ? `${(entry as WeeklyLeaderboardEntryI).trader}-${entry.rank}`
                    : `${(entry as AllTimeLeaderboardEntryI).address}-${entry.rank}`;

                  return <LeaderboardRow key={entryKey} entry={entry} showPoints={!isWeekly} />;
                })}
              </TableBody>
            </MuiTable>
          </TableContainer>

          {paginationMetadata && onPageChange && (
            <div className={styles.paginationHolder}>
              <TablePagination
                component="div"
                count={paginationMetadata.totalEntries}
                page={paginationMetadata.currentPage}
                onPageChange={(_: React.MouseEvent<HTMLButtonElement> | null, page: number) => onPageChange(page)}
                rowsPerPage={paginationMetadata.pageSize}
                rowsPerPageOptions={[10, 25, 50, 100]}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  if (onPageSizeChange) {
                    onPageSizeChange(parseInt(event.target.value, 10));
                  }
                }}
                labelRowsPerPage={'Rows per page'}
              />
            </div>
          )}
        </>
      )}
    </Box>
  );
};
