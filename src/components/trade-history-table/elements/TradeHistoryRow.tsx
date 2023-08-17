import { format } from 'date-fns';

import { TableCell, TableRow, Typography } from '@mui/material';

import type { PerpetualDataI, TableHeaderI, TradeHistoryI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

interface TradeHistoryRowPropsI {
  headers: TableHeaderI[];
  perpetuals: PerpetualDataI[];
  tradeHistory: TradeHistoryI;
}

export const TradeHistoryRow = ({ headers, perpetuals, tradeHistory }: TradeHistoryRowPropsI) => {
  const perpetual = perpetuals.find(({ id }) => id === tradeHistory.perpetualId);
  const time = format(new Date(tradeHistory.timestamp), 'yyyy-MM-dd HH:mm:ss');
  const pnlColor =
    tradeHistory.realizedPnl > 0 ? 'rgba(var(--d8x-background-buy-rgb), 1)' : 'rgba(var(--d8x-background-sell-rgb), 1)';

  return (
    <TableRow>
      <TableCell align={headers[0].align}>
        <Typography variant="cellSmall">{time}</Typography>
      </TableCell>
      <TableCell align={headers[1].align}>
        <Typography variant="cellSmall">{perpetual?.symbol}</Typography>
      </TableCell>
      <TableCell align={headers[2].align}>
        <Typography variant="cellSmall">{tradeHistory.side}</Typography>
      </TableCell>
      {/*<TableCell align={headers[3].align} style={{ display: 'none' }}>
        <Typography variant="cellSmall">TYPE</Typography>
      </TableCell>*/}
      <TableCell align={headers[3].align}>
        <Typography variant="cellSmall">
          {perpetual ? formatToCurrency(tradeHistory.price, perpetual.quoteCurrency, true) : ''}
        </Typography>
      </TableCell>
      <TableCell align={headers[4].align}>
        <Typography variant="cellSmall">
          {perpetual ? formatToCurrency(tradeHistory.quantity, perpetual.baseCurrency, true) : ''}
        </Typography>
      </TableCell>
      <TableCell align={headers[5].align}>
        <Typography variant="cellSmall">
          {perpetual ? formatToCurrency(tradeHistory.fee, perpetual.poolName, true) : ''}
        </Typography>
      </TableCell>
      <TableCell align={headers[6].align}>
        <Typography variant="cellSmall" style={{ color: pnlColor }}>
          {perpetual ? formatToCurrency(tradeHistory.realizedPnl, perpetual.poolName, true) : ''}
        </Typography>
      </TableCell>
      {/* <TableCell align={headers[7].align} /> */}
    </TableRow>
  );
};
