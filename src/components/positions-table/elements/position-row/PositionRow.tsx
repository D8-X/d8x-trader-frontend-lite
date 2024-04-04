import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteForeverOutlined, ModeEditOutlineOutlined, ShareOutlined } from '@mui/icons-material';
import { TableCell, TableRow, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { parseSymbol } from 'helpers/parseSymbol';
import type { MarginAccountWithAdditionalDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { TpSlValue } from '../tp-sl-value/TpSlValue';

import styles from './PositionRow.module.scss';

interface PositionRowPropsI {
  position: MarginAccountWithAdditionalDataI;
  handlePositionClose: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionModify: (position: MarginAccountWithAdditionalDataI) => void;
  handlePositionShare: (position: MarginAccountWithAdditionalDataI) => void;
  handleTpSlModify: (position: MarginAccountWithAdditionalDataI) => void;
}

export const PositionRow = memo(
  ({
    position,
    handlePositionClose,
    handlePositionModify,
    handlePositionShare,
    handleTpSlModify,
  }: PositionRowPropsI) => {
    const { t } = useTranslation();

    const parsedSymbol = parseSymbol(position.symbol);

    return (
      <TableRow key={position.symbol}>
        <TableCell align="left">
          <Typography variant="cellSmall">
            {parsedSymbol?.baseCurrency}/{parsedSymbol?.quoteCurrency}/{parsedSymbol?.poolSymbol}
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
            {position.liqPrice < 0
              ? `- ${parsedSymbol?.quoteCurrency}`
              : formatToCurrency(position.liqPrice, parsedSymbol?.quoteCurrency, true)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="cellSmall">
            {formatToCurrency(position.collateralCC, parsedSymbol?.poolSymbol, true)} (
            {Math.round(position.leverage * 100) / 100}x)
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography
            variant="cellSmall"
            className={position.unrealizedPnlQuoteCCY >= 0 ? styles.pnlPositive : styles.pnlNegative}
          >
            {formatToCurrency(position.unrealizedPnlQuoteCCY, parsedSymbol?.quoteCurrency, true)}
          </Typography>
        </TableCell>
        <TableCell align="right" className={styles.tpSlCell}>
          <TpSlValue position={position} handleTpSlModify={handleTpSlModify} />
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
            aria-label={t('pages.trade.positions-table.table-content.close')}
            title={t('pages.trade.positions-table.modify-modal.close')}
            onClick={() => handlePositionClose(position)}
          >
            <DeleteForeverOutlined className={styles.actionIcon} />
          </IconButton>
          <IconButton
            aria-label={t('pages.trade.positions-table.table-content.share')}
            title={t('pages.trade.positions-table.modify-modal.share')}
            onClick={() => handlePositionShare(position)}
          >
            <ShareOutlined className={styles.actionIcon} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);
