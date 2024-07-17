import classNames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography, useMediaQuery, useTheme } from '@mui/material';

import ViewChartIcon from 'assets/icons/viewChart.svg?react';

import type { StatDataI } from 'components/stats-line/types';
import { StatsLine } from 'components/stats-line/StatsLine';
import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';
import { perpetualStaticInfoAtom, perpetualStatisticsAtom, showChartForMobileAtom } from 'store/pools.store';
import { abbreviateNumber } from 'utils/abbreviateNumber';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PerpetualStats.module.scss';
import { priceToProb, TraderInterface } from '@d8x/perpetuals-sdk';

export const PerpetualStats = () => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isDesktopScreen = useMediaQuery(theme.breakpoints.down('xl'));
  const isTabletScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isMiddleScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const perpetualStatistics = useAtomValue(perpetualStatisticsAtom);
  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);

  const [showChartForMobile, setShowChartForMobile] = useAtom(showChartForMobileAtom);

  let midPriceClass = styles.statMainValuePositive;
  if (perpetualStatistics?.midPriceDiff != null) {
    midPriceClass =
      perpetualStatistics?.midPriceDiff >= 0 ? styles.statMainValuePositive : styles.statMainValueNegative;
  }

  const [displayMidPrice, displayIndexPrice, displayMarkPrice, displayCcy] = useMemo(() => {
    if (!!perpetualStatistics && !!perpetualStaticInfo) {
      return TraderInterface.isPredictiveMarket(perpetualStaticInfo)
        ? [
            100 * priceToProb(perpetualStatistics.midPrice),
            100 * priceToProb(perpetualStatistics.indexPrice),
            100 * priceToProb(perpetualStatistics.markPrice),
            '%',
          ]
        : [
            perpetualStatistics.midPrice,
            perpetualStatistics.indexPrice,
            perpetualStatistics.markPrice,
            perpetualStatistics.quoteCurrency,
          ];
    }
    return [undefined, undefined];
  }, [perpetualStatistics, perpetualStaticInfo]);

  const midPrice: StatDataI = useMemo(
    () => ({
      id: 'midPrice',
      label: t('pages.trade.stats.mid-price'),
      tooltip: t('pages.trade.stats.mid-price-tooltip'),
      value: displayCcy ? formatToCurrency(displayMidPrice, displayCcy, true) : '--',
      numberOnly: displayCcy ? formatToCurrency(displayMidPrice, '', true, undefined, true) : '--',
      className: midPriceClass, // Add the custom class here
      // currencyOnly: perpetualStatistics ? perpetualStatistics.quoteCurrency : '--',
    }),
    [midPriceClass, t, displayMidPrice, displayCcy]
  );

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
        label: t('pages.trade.stats.open-interest'),
        tooltip: t('pages.trade.stats.open-interest-tooltip'),
        value: perpetualStatistics
          ? abbreviateNumber(perpetualStatistics.openInterestBC) + perpetualStatistics.baseCurrency
          : '--',
        numberOnly: perpetualStatistics ? abbreviateNumber(perpetualStatistics.openInterestBC) : '--',
        currencyOnly: perpetualStatistics ? perpetualStatistics.baseCurrency : '',
      },
    ],
    [t, perpetualStatistics, displayIndexPrice, displayMarkPrice, displayCcy]
  );

  if (isMobileScreen) {
    return (
      <div className={styles.statContainer}>
        <div className={styles.mainMobileLine}>
          <div>
            {midPrice.tooltip && perpetualStatistics?.midPriceDiff ? (
              <TooltipMobile tooltip={midPrice.tooltip}>
                <div
                  className={
                    perpetualStatistics?.midPriceDiff >= 0
                      ? styles.statMainValuePositiveMobile
                      : styles.statMainValueNegativeMobile
                  }
                >
                  {midPrice.numberOnly}
                </div>
              </TooltipMobile>
            ) : (
              <div className={styles.statMainValuePositiveMobile}>{midPrice.numberOnly}</div>
            )}
          </div>
          <div>
            <div className={styles.viewChart} onClick={() => setShowChartForMobile(!showChartForMobile)}>
              <ViewChartIcon className={styles.viewChartIcon} />
              <Typography variant="bodyTiny">
                {t(showChartForMobile ? 'pages.trade.stats.hide-graph' : 'pages.trade.stats.view-graph')}
              </Typography>
            </div>
          </div>
        </div>
        <div className={styles.statsBlock}>
          {items.map((item) => (
            <div key={item.id}>
              {item.tooltip ? (
                <TooltipMobile tooltip={item.tooltip}>
                  <div className={classNames(styles.statLabel, styles.tooltip)}>{item.label}</div>
                </TooltipMobile>
              ) : (
                <div className={styles.statLabel}>{item.label}</div>
              )}
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

  if ((isDesktopScreen && !isTabletScreen) || (isMiddleScreen && !isMobileScreen)) {
    return (
      <div className={styles.statContainer}>
        <div className={styles.statsBlock}>
          {midPrice.tooltip && perpetualStatistics?.midPriceDiff ? (
            <TooltipMobile tooltip={midPrice.tooltip}>
              <div
                className={
                  perpetualStatistics?.midPriceDiff >= 0
                    ? styles.statMainValuePositiveTablet
                    : styles.statMainValueNegativeTablet
                }
              >
                {midPrice.numberOnly}
              </div>
            </TooltipMobile>
          ) : (
            <div className={`${styles.statMainValueContainer} ${styles.statMainValuePositiveTablet}`}>
              {midPrice.numberOnly}
            </div>
          )}
          {[...items].map((item) => (
            <div key={item.id}>
              {item.tooltip ? (
                <TooltipMobile tooltip={item.tooltip}>
                  <div className={classNames(styles.statLabel, styles.tooltip)}>{item.label}</div>
                </TooltipMobile>
              ) : (
                <div className={styles.statLabel}>{item.label}</div>
              )}
              <span className={styles.statValue}>{item.numberOnly}</span>{' '}
              <span className={styles.statCurrency}>{item.currencyOnly}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <StatsLine items={[midPrice, ...items]} />;
};
