import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

import { ReactComponent as ViewChartIcon } from 'assets/icons/viewChart.svg';

import type { StatDataI } from 'components/stats-line/types';
import { StatsLine } from 'components/stats-line/StatsLine';
import { perpetualStatisticsAtom, showChartForMobileAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PerpetualStats.module.scss';

export const PerpetualStats = () => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);
  const [showChartForMobile, setShowChartForMobile] = useAtom(showChartForMobileAtom);

  const midPrice: StatDataI = useMemo(
    () => ({
      id: 'midPrice',
      label: t('pages.trade.stats.mid-price'),
      value: perpetualStatistics
        ? formatToCurrency(perpetualStatistics.midPrice, perpetualStatistics.quoteCurrency, true)
        : '--',
      numberOnly: perpetualStatistics
        ? formatToCurrency(perpetualStatistics.midPrice, '', true, undefined, true)
        : '--',
      currencyOnly: perpetualStatistics ? perpetualStatistics.quoteCurrency : '--',
    }),
    [t, perpetualStatistics]
  );

  const items: StatDataI[] = useMemo(
    () => [
      {
        id: 'markPrice',
        label: t('pages.trade.stats.mark-price'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.markPrice, perpetualStatistics.quoteCurrency, true)
          : '--',
        numberOnly: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.markPrice, '', true, undefined, true)
          : '--',
      },
      {
        id: 'indexPrice',
        label: t('pages.trade.stats.index-price'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.indexPrice, perpetualStatistics.quoteCurrency, true)
          : '--',
        numberOnly: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.indexPrice, '', true, undefined, true)
          : '--',
      },
      {
        id: 'fundingRate',
        label: t('pages.trade.stats.funding-rate'),
        value: perpetualStatistics ? `${(perpetualStatistics.currentFundingRateBps / 100).toFixed(2)} %` : '--',
        numberOnly: perpetualStatistics ? (perpetualStatistics.currentFundingRateBps / 100).toFixed(2) : '--',
        currencyOnly: perpetualStatistics ? '%' : '',
      },
      {
        id: 'openInterestBC',
        label: t('pages.trade.stats.open-interest'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.openInterestBC, perpetualStatistics.baseCurrency, true)
          : '--',
        numberOnly: perpetualStatistics ? formatToCurrency(perpetualStatistics.openInterestBC, '', true) : '--',
        currencyOnly: perpetualStatistics ? perpetualStatistics.baseCurrency : '',
      },
    ],
    [t, perpetualStatistics]
  );

  if (isMobileScreen) {
    return (
      <div className={styles.statContainer}>
        <div className={styles.mainMobileLine}>
          <div>
            <div className={styles.statMainLabel}>{midPrice.label}</div>
            <span className={styles.statMainValue}>{midPrice.numberOnly}</span>{' '}
            <span className={styles.statValue}>{midPrice.currencyOnly}</span>
          </div>
          <div>
            <Box className={styles.viewChart} onClick={() => setShowChartForMobile(!showChartForMobile)}>
              <ViewChartIcon className={styles.viewChartIcon} />
              <Typography variant="bodyTiny">
                {t(showChartForMobile ? 'pages.trade.stats.hide-graph' : 'pages.trade.stats.view-graph')}
              </Typography>
            </Box>
          </div>
        </div>
        <div className={styles.statsBlock}>
          {items.map((item) => (
            <div key={item.id}>
              <div className={styles.statLabel}>{item.label}</div>
              <span className={styles.statValue}>{item.numberOnly}</span>{' '}
              <span className={styles.statCurrency}>{item.currencyOnly}</span>
            </div>
          ))}
        </div>
      </div>
    );

    // TODO: VOV: Make StatsLineMobile common
    // return <StatsLineMobile items={items} />;
  }

  return <StatsLine items={[midPrice, ...items]} />;
};
