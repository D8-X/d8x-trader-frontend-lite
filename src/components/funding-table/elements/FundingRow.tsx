import { format } from 'date-fns';

import { TableCell, TableRow, Typography } from '@mui/material';

import type { FundingI, PerpetualDataI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

interface FundingRowPropsI {
  headers: TableHeaderI[];
  perpetuals: PerpetualDataI[];
  funding: FundingI;
}

export const FundingRow = ({ headers, perpetuals, funding }: FundingRowPropsI) => {
  const perpetual = perpetuals.find(({ id }) => id === funding.perpetualId);
  const time = format(new Date(funding.timestamp), 'yyyy-MM-dd HH:mm:ss');

  return (
    <TableRow>
      <TableCell align={headers[0].align}>
        <Typography variant="cellSmall">{time}</Typography>
      </TableCell>
      <TableCell align={headers[1].align}>
        <Typography variant="cellSmall">
          {perpetual ? `${perpetual.baseCurrency}-${perpetual.quoteCurrency}` : ''}
        </Typography>
      </TableCell>
      <TableCell align={headers[2].align}>
        <Typography variant="cellSmall">
          {perpetual ? formatToCurrency(funding.amount, perpetual.poolName, true) : ''}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
