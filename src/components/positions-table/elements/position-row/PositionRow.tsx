import { useTranslation } from 'react-i18next';

import IconButton from '@mui/material/IconButton';
import { ModeEditOutlineOutlined, DeleteForeverOutlined } from '@mui/icons-material';
import { TableCell, TableRow, Typography } from '@mui/material';

import { parseSymbol } from 'helpers/parseSymbol';
import type { MarginAccountI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PositionRow.module.scss';

interface PositionRowPropsI {
  position: MarginAccountI;
  handlePositionClose: (position: MarginAccountI) => void;
  handlePositionModify: (position: MarginAccountI) => void;
}

export const PositionRow = ({ position, handlePositionClose, handlePositionModify }: PositionRowPropsI) => {
  const { t } = useTranslation();
  const parsedSymbol = parseSymbol(position.symbol);

  return (
    <TableRow>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(position.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true)}
        </Typography>
      </TableCell>
      <TableCell align="left">
        <Typography variant="cellSmall">
          {position.side === 'BUY'
            ? t('pages.trade.positions-table.table-content.buy')
            : t('pages.trade.positions-table.table-content.sell')}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(position.entryPrice, parsedSymbol?.quoteCurrency, true)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {position.liquidationPrice[0] < 0
            ? `- ${parsedSymbol?.quoteCurrency}`
            : formatToCurrency(position.liquidationPrice[0], parsedSymbol?.quoteCurrency, true)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="cellSmall">
          {formatToCurrency(position.collateralCC, '', true)}({Math.round(position.leverage * 100) / 100}x)
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography
          variant="cellSmall"
          className={position.unrealizedPnlQuoteCCY > 0 ? styles.pnlPositive : styles.pnlNegative}
        >
          {formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <IconButton
          aria-label={t('pages.trade.positions-table.table-content.modify')}
          title={t('pages.trade.positions-table.table-content.modify')}
          onClick={() => handlePositionModify(position)}
        >
          <ModeEditOutlineOutlined className={styles.actionIcon} />
        </IconButton>
        <IconButton
          aria-label={t('pages.trade.positions-table.table-content.modify')}
          title={t('pages.trade.positions-table.modify-modal.close')}
          onClick={() => handlePositionClose(position)}
        >
          <DeleteForeverOutlined className={styles.actionIcon} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};
