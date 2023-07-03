import { useAtom } from 'jotai';
import { useMemo } from 'react';

import type { StatDataI } from 'components/stats-line/types';
import { StatsLine } from 'components/stats-line/StatsLine';
import { perpetualStatisticsAtom } from 'store/pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

export const PerpetualStats = () => {
  const [perpetualStatistics] = useAtom(perpetualStatisticsAtom);

  const items: StatDataI[] = useMemo(
    () => [
      {
        id: 'midPrice',
        label: 'Mid Price',
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.midPrice, perpetualStatistics.quoteCurrency)
          : '--',
      },
      {
        id: 'markPrice',
        label: 'Mark Price',
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.markPrice, perpetualStatistics.quoteCurrency)
          : '--',
      },
      {
        id: 'indexPrice',
        label: 'Index Price',
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.indexPrice, perpetualStatistics.quoteCurrency)
          : '--',
      },
      {
        id: 'fundingRate',
        label: 'Funding Price',
        value: perpetualStatistics ? `${(perpetualStatistics.currentFundingRateBps / 100).toFixed(2)} %` : '--',
      },
      {
        id: 'openInterestBC',
        label: 'Open Interest',
        value: perpetualStatistics
          ? formatToCurrency(perpetualStatistics.openInterestBC, perpetualStatistics.baseCurrency)
          : '--',
      },
    ],
    [perpetualStatistics]
  );

  return <StatsLine items={items} />;
};
