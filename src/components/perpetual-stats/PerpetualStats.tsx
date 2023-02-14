import { useAtom } from 'jotai';

import { Box, Typography } from '@mui/material';

import { perpetualStatisticsAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PerpetualStats.module.scss';

export const PerpetualStats = () => {
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);

  return (
    <Box className={styles.root}>
      <Box key="midPrice" className={styles.statContainer}>
        <Typography variant="bodySmall">Mid Price</Typography>
        <Typography variant="bodySmall" className={styles.statValue}>
          {perpetualStatistics
            ? formatToCurrency(perpetualStatistics.midPrice, perpetualStatistics.quoteCurrency)
            : '--'}
        </Typography>
      </Box>
      <Box key="markPrice" className={styles.statContainer}>
        <Typography variant="bodySmall">Mark Price</Typography>
        <Typography variant="bodySmall" className={styles.statValue}>
          {perpetualStatistics
            ? formatToCurrency(perpetualStatistics.markPrice, perpetualStatistics.quoteCurrency)
            : '--'}
        </Typography>
      </Box>
      <Box key="indexPrice" className={styles.statContainer}>
        <Typography variant="bodySmall">Index Price</Typography>
        <Typography variant="bodySmall" className={styles.statValue}>
          {perpetualStatistics
            ? formatToCurrency(perpetualStatistics.indexPrice, perpetualStatistics.quoteCurrency)
            : '--'}
        </Typography>
      </Box>
      <Box key="fundingRate" className={styles.statContainer}>
        <Typography variant="bodySmall">Funding Rate</Typography>
        <Typography variant="bodySmall" className={styles.statValue}>
          {perpetualStatistics ? `${(perpetualStatistics.currentFundingRateBps / 100).toFixed(2)} %` : '--'}
        </Typography>
      </Box>
      <Box key="openInterestBC" className={styles.statContainer}>
        <Typography variant="bodySmall">Open Interest</Typography>
        <Typography variant="bodySmall" className={styles.statValue}>
          {perpetualStatistics
            ? formatToCurrency(perpetualStatistics.openInterestBC, perpetualStatistics.baseCurrency)
            : '--'}
        </Typography>
      </Box>
    </Box>
  );
};
