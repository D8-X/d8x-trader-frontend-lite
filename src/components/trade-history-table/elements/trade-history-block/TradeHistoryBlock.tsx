import { format } from 'date-fns';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { DATETIME_FORMAT } from 'appConstants';
import { SidesRow } from 'components/sides-row/SidesRow';
import { collateralToSettleConversionAtom } from 'store/pools.store';
import type { TableHeaderI, TradeHistoryWithSymbolDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './TradeHistoryBlock.module.scss';
import { priceToProb } from '@d8x/perpetuals-sdk';

interface TradeHistoryRowPropsI {
  headers: TableHeaderI<TradeHistoryWithSymbolDataI>[];
  tradeHistory: TradeHistoryWithSymbolDataI;
}

export const TradeHistoryBlock = ({ headers, tradeHistory }: TradeHistoryRowPropsI) => {
  const { t } = useTranslation();

  const c2s = useAtomValue(collateralToSettleConversionAtom);

  const perpetual = tradeHistory.perpetual;
  const time = format(new Date(tradeHistory.timestamp), DATETIME_FORMAT);
  const pnlColor = tradeHistory.realizedPnl > 0 ? styles.green : styles.red;

  const displayPrice = perpetual?.isPredictionMarket ? priceToProb(tradeHistory.price) : tradeHistory.price;
  const displayCcy = perpetual?.isPredictionMarket ? perpetual?.quoteCurrency : perpetual?.quoteCurrency;

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box>
          <Typography variant="bodySmall" component="p">
            {t('pages.trade.history-table.history-block-mobile.symbol')}
          </Typography>
          <Typography variant="bodySmall" component="p" className={styles.symbol}>
            {perpetual?.symbol}
          </Typography>
        </Box>
      </Box>
      <Box className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[0].label}
          leftSideTooltip={headers[0].tooltip}
          rightSide={time}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          leftSideTooltip={headers[2].tooltip}
          rightSide={
            tradeHistory.side === 'BUY'
              ? t('pages.trade.positions-table.table-content.buy')
              : t('pages.trade.positions-table.table-content.sell')
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[3].label}
          leftSideTooltip={headers[3].tooltip}
          rightSide={displayPrice ? formatToCurrency(displayPrice, displayCcy, true) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[4].label}
          leftSideTooltip={headers[4].tooltip}
          rightSide={perpetual ? formatToCurrency(tradeHistory.quantity, perpetual.baseCurrency, true) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[5].label}
          leftSideTooltip={headers[5].tooltip}
          rightSide={
            perpetual
              ? formatToCurrency(
                  tradeHistory.fee * (c2s.get(perpetual.poolName)?.value ?? 1),
                  tradeHistory.settleSymbol,
                  true
                )
              : ''
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[6].label}
          leftSideTooltip={headers[6].tooltip}
          rightSide={
            perpetual
              ? formatToCurrency(
                  tradeHistory.realizedPnl * (c2s.get(perpetual.poolName)?.value ?? 1),
                  tradeHistory.settleSymbol,
                  true
                )
              : ''
          }
          leftSideStyles={styles.dataLabel}
          rightSideStyles={pnlColor}
        />
      </Box>
    </Box>
  );
};
