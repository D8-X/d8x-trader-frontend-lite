// src/pages/leaderboard-page/components/leaderboard-table/LeaderboardRow.tsx
import { TableCell, TableRow, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

import { AllTimeLeaderboardEntryI, WeeklyLeaderboardEntryI } from 'types/types';

import styles from './LeaderboardRow.module.scss';

// Type guards to help with TypeScript narrowing
function isWeeklyEntry(entry: LeaderboardEntryT): entry is WeeklyLeaderboardEntryI {
  return 'trader' in entry;
}

function isAllTimeEntry(entry: LeaderboardEntryT): entry is AllTimeLeaderboardEntryI {
  return 'points' in entry && 'address' in entry;
}

// Format PNL with appropriate sign and percentage
const formatPnl = (pnl: number | undefined): string => {
  if (typeof pnl !== 'number') return '-';
  const formattedValue = pnl.toFixed(2);
  return pnl > 0 ? `+${formattedValue}%` : `${formattedValue}%`;
};

type LeaderboardEntryT = WeeklyLeaderboardEntryI | AllTimeLeaderboardEntryI;

interface LeaderboardRowPropsI {
  entry: LeaderboardEntryT;
  showPoints?: boolean;
}

export const LeaderboardRow = ({ entry, showPoints = false }: LeaderboardRowPropsI) => {
  const { address } = useAccount();

  // Handle both formats: trader (weekly) or address (all-time)
  const addressToDisplay = isWeeklyEntry(entry) ? entry.trader : entry.address;

  // Determine if this row belongs to the connected user
  const isUserRow = address && addressToDisplay && addressToDisplay.toLowerCase() === address.toLowerCase();

  // Determine PNL styling
  const getPnlClass = () => {
    if (typeof entry.pnl !== 'number') return '';
    if (entry.pnl > 0) return styles.positive;
    if (entry.pnl < 0) return styles.negative;
    return '';
  };

  return (
    <TableRow className={`${styles.row} ${isUserRow ? styles.userRow : ''}`}>
      <TableCell className={styles.rankCell} align="center">
        <Typography variant="body2">{entry.rank !== undefined ? entry.rank : '-'}</Typography>
      </TableCell>

      <TableCell className={styles.addressCell}>
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

      <TableCell className={styles.pnlCell} align="right">
        <Typography variant="body2" className={getPnlClass()}>
          {formatPnl(entry.pnl)}
        </Typography>
      </TableCell>

      {showPoints && isAllTimeEntry(entry) && (
        <TableCell className={styles.pointsCell} align="right">
          <Typography variant="body2">{entry.points !== undefined ? entry.points.toLocaleString() : '-'}</Typography>
        </TableCell>
      )}
    </TableRow>
  );
};
