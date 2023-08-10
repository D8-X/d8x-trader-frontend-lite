import { format } from 'date-fns';
import { Box, Typography } from '@mui/material';

import { SidesRow } from 'components/sides-row/SidesRow';
import type { PerpetualDataI, TradeHistoryI, TableHeaderI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './TradeHistoryBlock.module.scss';

interface TradeHistoryRowPropsI {
  headers: TableHeaderI[];
  perpetuals: PerpetualDataI[];
  tradeHistory: TradeHistoryI;
}

export const TradeHistoryBlock = ({ headers, perpetuals, tradeHistory }: TradeHistoryRowPropsI) => {
  const perpetual = perpetuals.find(({ id }) => id === tradeHistory.perpetualId);
  const time = format(new Date(tradeHistory.timestamp), 'yyyy-MM-dd HH:mm:ss');
  const pnlColor = tradeHistory.realizedPnl > 0 ? styles.green : styles.red;

  return (
    <Box className={styles.root}>
      <Box className={styles.headerWrapper}>
        <Box className={styles.leftSection}>
          <Typography variant="bodySmall" component="p">
            Symbol
          </Typography>
          <Typography variant="bodySmall" component="p" className={styles.symbol}>
            {perpetual?.symbol}
          </Typography>
        </Box>
      </Box>
      <Box className={styles.dataWrapper}>
        <SidesRow
          leftSide={headers[0].label}
          rightSide={time}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[2].label}
          rightSide={tradeHistory.side}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[3].label}
          rightSide={perpetual ? formatToCurrency(tradeHistory.price, perpetual.quoteCurrency) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[4].label}
          rightSide={perpetual ? formatToCurrency(tradeHistory.quantity, perpetual.baseCurrency) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[5].label}
          rightSide={perpetual ? formatToCurrency(tradeHistory.fee, perpetual.poolName) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={styles.dataValue}
        />
        <SidesRow
          leftSide={headers[6].label}
          rightSide={perpetual ? formatToCurrency(tradeHistory.realizedPnl, perpetual.poolName) : ''}
          leftSideStyles={styles.dataLabel}
          rightSideStyles={pnlColor}
        />
      </Box>
    </Box>
  );
};
