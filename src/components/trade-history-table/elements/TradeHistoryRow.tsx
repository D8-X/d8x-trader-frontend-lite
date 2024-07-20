import { format } from 'date-fns';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { TableCell, TableRow, Typography } from '@mui/material';

import { DATETIME_FORMAT } from 'appConstants';
import { collateralToSettleConversionAtom } from 'store/pools.store';
import type { TableHeaderI, TradeHistoryWithSymbolDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';
import { priceToProb } from '@d8x/perpetuals-sdk';

interface TradeHistoryRowPropsI {
  headers: TableHeaderI<TradeHistoryWithSymbolDataI>[];
  tradeHistory: TradeHistoryWithSymbolDataI;
}

export const TradeHistoryRow = ({ headers, tradeHistory }: TradeHistoryRowPropsI) => {
  const { t } = useTranslation();

  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const perpetual = tradeHistory.perpetual;
  const time = format(new Date(tradeHistory.timestamp), DATETIME_FORMAT);
  const pnlColor = tradeHistory.realizedPnl > 0 ? 'var(--d8x-color-buy-rgba)' : 'var(--d8x-color-sell-rgba)';

  const displayPrice = perpetual?.isPredictionMarket ? priceToProb(tradeHistory.price) : tradeHistory.price;
  const displayCcy = perpetual?.isPredictionMarket ? perpetual?.quoteCurrency : perpetual?.quoteCurrency;

  return (
    <TableRow key={tradeHistory.transactionHash}>
      <TableCell align={headers[0].align}>
        <Typography variant="cellSmall">{time}</Typography>
      </TableCell>
      <TableCell align={headers[1].align}>
        <Typography variant="cellSmall">{tradeHistory.symbol}</Typography>
      </TableCell>
      <TableCell align={headers[2].align}>
        <Typography variant="cellSmall">
          {tradeHistory.side === 'BUY'
            ? t('pages.trade.positions-table.table-content.buy')
            : t('pages.trade.positions-table.table-content.sell')}
        </Typography>
      </TableCell>
      {/*<TableCell align={headers[3].align} style={{ display: 'none' }}>
        <Typography variant="cellSmall">TYPE</Typography>
      </TableCell>*/}
      <TableCell align={headers[3].align}>
        <Typography variant="cellSmall">{perpetual ? formatToCurrency(displayPrice, displayCcy, true) : ''}</Typography>
      </TableCell>
      <TableCell align={headers[4].align}>
        <Typography variant="cellSmall">
          {perpetual ? formatToCurrency(Math.abs(tradeHistory.quantity), perpetual.baseCurrency, true) : ''}
        </Typography>
      </TableCell>
      <TableCell align={headers[5].align}>
        <Typography variant="cellSmall">
          {perpetual
            ? formatToCurrency(
                tradeHistory.fee * (c2s.get(perpetual.poolName)?.value ?? 1),
                tradeHistory.settleSymbol,
                true
              )
            : ''}
        </Typography>
      </TableCell>
      <TableCell align={headers[6].align}>
        <Typography variant="cellSmall" style={{ color: pnlColor }}>
          {perpetual
            ? formatToCurrency(
                tradeHistory.realizedPnl * (c2s.get(perpetual.poolName)?.value ?? 1),
                tradeHistory.settleSymbol,
                true
              )
            : ''}
        </Typography>
      </TableCell>
      {/* <TableCell align={headers[7].align} /> */}
    </TableRow>
  );
};
