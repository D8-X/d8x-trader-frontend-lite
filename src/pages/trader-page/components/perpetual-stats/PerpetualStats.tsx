import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery, useTheme } from '@mui/material';

import type { StatDataI } from 'components/stats-line/types';
import { StatsLine } from 'components/stats-line/StatsLine';
import { StatsLineMobile } from 'components/stats-line/StatsLineMobile';
import { perpetualStatisticsAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

export const PerpetualStats = () => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);

  const digits = useMemo(() => {
    if (!perpetualStatistics?.indexPrice) {
      return 1;
    }
    return Math.max(0, Math.ceil(2.5 - Math.log10(perpetualStatistics?.indexPrice)));
  }, [perpetualStatistics?.indexPrice]);

  const digitsInv = useMemo(() => {
    if (!perpetualStatistics?.indexPrice) {
      return 1;
    }
    return Math.max(0, Math.ceil(-0.5 + Math.log10(perpetualStatistics?.indexPrice)));
  }, [perpetualStatistics?.indexPrice]);

  const items: StatDataI[] = useMemo(
    () => [
      {
        id: 'midPrice',
        label: t('pages.trade.stats.mid-price'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.midPrice, perpetualStatistics.quoteCurrency, true, digits)
          : '--',
        numberOnly: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.midPrice, perpetualStatistics.quoteCurrency, true, digits, true)
          : '--',
        currencyOnly: perpetualStatistics ? perpetualStatistics.quoteCurrency : '--',
      },
      {
        id: 'markPrice',
        label: t('pages.trade.stats.mark-price'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.markPrice, perpetualStatistics.quoteCurrency, true, digits)
          : '--',
        numberOnly: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.markPrice, perpetualStatistics.quoteCurrency, true, digits, true)
          : '--',
        grouped: true,
        columnNr: 1,
      },
      {
        id: 'indexPrice',
        label: t('pages.trade.stats.index-price'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.indexPrice, perpetualStatistics.quoteCurrency, true, digits)
          : '--',
        numberOnly: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.indexPrice, perpetualStatistics.quoteCurrency, true, digits, true)
          : '--',
        grouped: true,
        columnNr: 1,
      },
      {
        id: 'fundingRate',
        label: t('pages.trade.stats.funding-rate'),
        value: perpetualStatistics ? `${(perpetualStatistics.currentFundingRateBps / 100).toFixed(2)} %` : '--',
        grouped: true,
        columnNr: 2,
      },
      {
        id: 'openInterestBC',
        label: t('pages.trade.stats.open-interest'),
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.openInterestBC, perpetualStatistics.baseCurrency, true, digitsInv)
          : '--',
        grouped: true,
        columnNr: 2,
      },
    ],
    [t, perpetualStatistics]
  );

  if (isMobileScreen) {
    return <StatsLineMobile items={items} />;
  }

  return <StatsLine items={items} />;
};
