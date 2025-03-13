import { TraderInterface } from '@d8x/perpetuals-sdk';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { StatDataI } from 'components/stats-line/types';
import { StatsLine } from 'components/stats-line/StatsLine';
import { calculateProbability } from 'helpers/calculateProbability';
import { orderBlockAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, perpetualStatisticsAtom, selectedPerpetualVolumeAtom } from 'store/pools.store';
import { OrderBlockE } from 'types/enums';
import { abbreviateNumber } from 'utils/abbreviateNumber';
import { formatToCurrency } from 'utils/formatToCurrency';

export const PerpetualStats = () => {
  const { t } = useTranslation();

  const orderBlock = useAtomValue(orderBlockAtom);
  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);
  const perpetualVolume = useAtomValue(selectedPerpetualVolumeAtom);

  const [[displayIndexPrice, displayMarkPrice], displayCcy] = useMemo(() => {
    if (!!perpetualStatistics && !!perpetualStaticInfo) {
      let isPredictionMarket = false;
      try {
        isPredictionMarket = TraderInterface.isPredictionMarketStatic(perpetualStaticInfo);
      } catch {
        // skip
      }
      const px = [perpetualStatistics.indexPrice, perpetualStatistics.markPrice];
      return isPredictionMarket
        ? [px.map((x) => calculateProbability(x, orderBlock === OrderBlockE.Short)), perpetualStatistics.quoteCurrency]
        : [px, perpetualStatistics.quoteCurrency];
    }
    return [[undefined, undefined], undefined];
  }, [perpetualStatistics, perpetualStaticInfo, orderBlock]);

  const items: StatDataI[] = useMemo(
    () => [
      {
        id: 'markPrice',
        label: t('pages.trade.stats.mark-price'),
        tooltip: t('pages.trade.stats.mark-price-tooltip'),
        value: displayCcy ? formatToCurrency(displayMarkPrice, displayCcy, true) : '--',
        numberOnly: perpetualStatistics ? formatToCurrency(displayMarkPrice, '', true, undefined, true) : '--',
        // currencyOnly: perpetualStatistics ? perpetualStatistics.quoteCurrency : '--',
      },
      {
        id: 'indexPrice',
        label: t('pages.trade.stats.index-price'),
        tooltip: t('pages.trade.stats.index-price-tooltip'),
        value: displayCcy ? formatToCurrency(displayIndexPrice, displayCcy, true) : '--',
        numberOnly: displayCcy ? formatToCurrency(displayIndexPrice, '', true, undefined, true) : '--',
        // currencyOnly: perpetualStatistics ? perpetualStatistics.quoteCurrency : '--',
      },
      {
        id: 'fundingRate',
        label: t('pages.trade.stats.funding-rate'),
        tooltip: t('pages.trade.stats.funding-rate-tooltip'),
        value: perpetualStatistics ? `${(perpetualStatistics.currentFundingRateBps / 100).toFixed(3)} %` : '--',
        numberOnly: perpetualStatistics ? (perpetualStatistics.currentFundingRateBps / 100).toFixed(3) : '--',
        currencyOnly: perpetualStatistics ? '%' : '',
      },
      {
        id: 'openInterestBC',
        label: 'Volume', // t('pages.trade.stats.open-interest'),
        tooltip: 'Traded volume in the last 24 hours', // t('pages.trade.stats.open-interest-tooltip'),
        value: abbreviateNumber(perpetualVolume) + 'USD',
        //  perpetualStatistics
        //   ? abbreviateNumber(perpetualStatistics.openInterestBC) + perpetualStatistics.baseCurrency
        //   : '--',
        numberOnly: abbreviateNumber(perpetualVolume), // perpetualStatistics ? abbreviateNumber(perpetualStatistics.openInterestBC) : '--',
        currencyOnly: 'USD', // perpetualStatistics ? perpetualStatistics.baseCurrency : '',
      },
    ],
    [t, perpetualStatistics, perpetualVolume, displayIndexPrice, displayMarkPrice, displayCcy]
  );

  return <StatsLine items={items} />;
};
