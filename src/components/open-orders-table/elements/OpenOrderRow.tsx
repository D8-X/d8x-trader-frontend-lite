import { format } from 'date-fns';

import { Button, TableCell, TableRow, Typography } from '@mui/material';

import { parseSymbol } from 'helpers/parseSymbol';
import type { OrderWithIdI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { typeToLabelMap } from '../typeToLabelMap';

interface OpenOrderRowPropsI {
  order: OrderWithIdI;
  handleOrderCancel: (order: OrderWithIdI) => void;
}

export const OpenOrderRow = ({ order, handleOrderCancel }: OpenOrderRowPropsI) => {
  const parsedSymbol = parseSymbol(order.symbol);
  const deadlineDate = order.deadline ? format(new Date(order.deadline * 1000), 'MMM dd yyyy') : '';
  const leverage = order.leverage === undefined ? order.leverage : Math.round(100 * order.leverage) / 100;

  return (
    <TableRow>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}
        </Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">{order.side}</Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">{typeToLabelMap[order.type]}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">{formatToCurrency(order.quantity, parsedSymbol?.baseCurrency)}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {order.limitPrice && order.limitPrice < Infinity
            ? formatToCurrency(order.limitPrice, parsedSymbol?.quoteCurrency)
            : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {order.stopPrice ? formatToCurrency(order.stopPrice, parsedSymbol?.quoteCurrency) : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">{leverage}x</Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">{deadlineDate}</Typography>
      </TableCell>
      <TableCell align="center">
        <Button variant="primary" size="tableSmall" onClick={() => handleOrderCancel(order)}>
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
};
