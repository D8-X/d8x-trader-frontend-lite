// src/pages/leaderboard-page/components/leaderboard-table/LeaderboardRow.tsx
import { TableCell, TableRow, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

import { AllTimeLeaderboardEntryI, WeeklyLeaderboardEntryI } from 'types/types';

import styles from './LeaderboardRow.module.scss';

// Type guards to help with TypeScript narrowing
function isWeeklyEntry(entry: LeaderboardEntryT): entry is WeeklyLeaderboardEntryI {
  return 'trader' in entry;
}
// Format PNL with appropriate sign and percentage
const formatPnl = (pnl: number | undefined): string => {
  if (typeof pnl !== 'number') return '-';
  return pnl > 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
};

type LeaderboardEntryT = WeeklyLeaderboardEntryI | AllTimeLeaderboardEntryI;

interface LeaderboardRowPropsI {
  entry: LeaderboardEntryT;
  showPoints?: boolean;
}

export const LeaderboardRow = ({ entry }: LeaderboardRowPropsI) => {
  const { address } = useAccount();

  // Handle both formats: trader (weekly) or address (all-time)
  const addressToDisplay = isWeeklyEntry(entry) ? entry.trader : entry.address;

  // Determine if this row belongs to the connected user
  const isUserRow = address && addressToDisplay && addressToDisplay.toLowerCase() === address.toLowerCase();

  // Determine PNL styling
  const getPnlClass = (pnl?: number) => {
    if (typeof pnl !== 'number') return styles.positive; // Handles undefined, null, and non-number values
    return pnl >= 0 ? styles.positive : styles.negative; // Handles all number cases including 0
  };

  const isWeekly = isWeeklyEntry(entry);

  return (
    <TableRow className={`${styles.row} ${isUserRow ? styles.userRow : ''}`}>
      <TableCell className={styles.rankCell} align="left">
        <Typography variant="body2">{isWeekly ? (entry.volumeRank ?? '-') : (entry.rank ?? '-')}</Typography>
      </TableCell>

      <TableCell className={styles.addressCell} align="left">
        <Typography
          variant="body2"
          noWrap
          component="div"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            display: 'block',
            fontSize: '0.85rem',
          }}
        >
          {addressToDisplay || '-'}
        </Typography>
      </TableCell>

      {isWeekly ? (
        <>
          <TableCell className={styles.pnlCell} align="right">
            <Typography variant="body2" className={getPnlClass(entry.pnl)}>
              {formatPnl(entry.pnl)}
            </Typography>
          </TableCell>
          <TableCell className={styles.volCell} align="right">
            <Typography variant="body2">{entry.vol !== undefined ? `$${entry.vol.toFixed(2)}` : '-'}</Typography>
          </TableCell>
          <TableCell className={styles.volCell} align="right">
            <Typography variant="body2">
              {entry.timeWeightedOI !== undefined ? `$${parseFloat(entry.timeWeightedOI).toFixed(2)}` : '-'}
            </Typography>
          </TableCell>
        </>
      ) : (
        <TableCell className={styles.pointsCell} align="right">
          <Typography variant="body2">{entry.points !== undefined ? entry.points.toLocaleString() : '-'}</Typography>
        </TableCell>
      )}
    </TableRow>
  );
};
