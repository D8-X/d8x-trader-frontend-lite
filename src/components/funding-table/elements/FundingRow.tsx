import { format } from 'date-fns';

import { TableCell, TableRow, Typography } from '@mui/material';

import { DATETIME_FORMAT } from 'appConstants';
import type { FundingWithSymbolDataI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

interface FundingRowPropsI {
  headers: TableHeaderI<FundingWithSymbolDataI>[];
  funding: FundingWithSymbolDataI;
}

import styles from '../FundingTable.module.scss';

export const FundingRow = ({ headers, funding }: FundingRowPropsI) => {
  const perpetual = funding.perpetual;
  const time = format(new Date(funding.timestamp), DATETIME_FORMAT);

  return (
    <TableRow key={funding.transactionHash}>
      <TableCell align={headers[0].align}>
        <Typography variant="cellSmall">{time}</Typography>
      </TableCell>
      <TableCell align={headers[1].align}>
        <Typography variant="cellSmall">{funding.symbol}</Typography>
      </TableCell>
      <TableCell align={headers[2].align}>
        <Typography
          variant="cellSmall"
          className={funding.amount >= 0 ? styles.fundingPositive : styles.fundingNegative}
        >
          {perpetual ? formatToCurrency(funding.amount, perpetual.poolName, true) : ''}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
