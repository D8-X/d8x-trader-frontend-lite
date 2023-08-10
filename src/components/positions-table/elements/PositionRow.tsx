import { Button, TableCell, TableRow, Typography } from '@mui/material';

import { parseSymbol } from 'helpers/parseSymbol';
import type { MarginAccountI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

interface PositionRowPropsI {
  position: MarginAccountI;
  handlePositionModify: (position: MarginAccountI) => void;
}

export const PositionRow = ({ position, handlePositionModify }: PositionRowPropsI) => {
  const parsedSymbol = parseSymbol(position.symbol);
  const pnlColor =
    position.unrealizedPnlQuoteCCY > 0
      ? 'rgba(var(--d8x-background-buy-rgb), 1)'
      : 'rgba(var(--d8x-background-sell-rgb), 1)';

  return (
    <TableRow>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(position.positionNotionalBaseCCY, parsedSymbol?.baseCurrency)}
        </Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">{position.side}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(position.entryPrice, parsedSymbol?.quoteCurrency)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {position.liquidationPrice[0] < 0
            ? `- ${parsedSymbol?.quoteCurrency}`
            : formatToCurrency(position.liquidationPrice[0], parsedSymbol?.quoteCurrency)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(position.collateralCC, '')}({Math.round(position.leverage * 100) / 100}x)
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall" style={{ color: pnlColor }}>
          {formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Button variant="primary" size="tableSmall" onClick={() => handlePositionModify(position)}>
          Modify
        </Button>
      </TableCell>
    </TableRow>
  );
};
