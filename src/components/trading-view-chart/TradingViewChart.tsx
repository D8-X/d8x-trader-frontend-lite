import { useAtom, useAtomValue } from 'jotai';
import { type CandlestickData, IPriceLine, type ISeriesApi, type Time } from 'lightweight-charts';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeDetector } from 'react-resize-detector';

import { CircularProgress, useMediaQuery, useTheme, Typography } from '@mui/material';

import { MarketSelect } from 'components/market-select/MarketSelect';
import { candlesAtom, candlesDataReadyAtom, newCandleAtom } from 'store/tv-chart.store';
import { valueToFractionDigits } from 'utils/formatToCurrency';
import { selectedPerpetualAtom, selectedPerpetualDataAtom } from 'store/pools.store';

import { ONE_MINUTE_SECONDS, ONE_MINUTE_TIME, TIMEZONE_OFFSET } from './constants';
import { ChartBlock } from './elements/chart-block/ChartBlock';
import { PeriodSelector } from './elements/period-selector/PeriodSelector';

import styles from './TradingViewChart.module.scss';

interface TradingViewChartPropsI {
  onlyChart?: boolean;
  height?: number;
  takeProfitPrice?: number | null;
  stopLossPrice?: number | null;
}

export const TradingViewChart = memo(
  ({ onlyChart = false, height, takeProfitPrice, stopLossPrice }: TradingViewChartPropsI) => {
    const { t } = useTranslation();

    const theme = useTheme();
    const isUpFromMobileScreen = useMediaQuery(theme.breakpoints.up('sm'));

    const candles = useAtomValue(candlesAtom);
    const isCandleDataReady = useAtomValue(candlesDataReadyAtom);
    const [newCandle, setNewCandle] = useAtom(newCandleAtom);
    const selectedPerpetualData = useAtomValue(selectedPerpetualDataAtom);
    const selectedPerpetual = useAtomValue(selectedPerpetualAtom);

    const takeProfitPriceLineRef = useRef<IPriceLine | null>(null);
    const stopLossPriceLineRef = useRef<IPriceLine | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'>>(null);
    const latestCandleTimeRef = useRef<Time>();

    const { width, ref } = useResizeDetector();

    const isPredictionMarket = selectedPerpetualData?.isPredictionMarket ?? false;

    const isMarketClosed = useMemo(() => {
      return selectedPerpetual?.isMarketClosed;
    }, [selectedPerpetual?.isMarketClosed]);

    const candlesWithLocalTime: CandlestickData[] = useMemo(
      () =>
        candles.map((candle) => ({
          ...candle,
          start: candle.start + TIMEZONE_OFFSET * ONE_MINUTE_TIME,
          time: (candle.time + TIMEZONE_OFFSET * ONE_MINUTE_SECONDS) as Time,
        })),
      [candles]
    );

    const buyColor = useMemo(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--d8x-color-text-buy') || '#089981';
    }, []);

    const sellColor = useMemo(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--d8x-color-text-sell') || '#f23645';
    }, []);

    useEffect(() => {
      if (newCandle == null || !seriesRef.current || !latestCandleTimeRef.current) {
        return;
      }

      const latestCandleTime = latestCandleTimeRef.current || 0;
      const newCandleTime = (newCandle.time + TIMEZONE_OFFSET * ONE_MINUTE_SECONDS) as Time;
      if (newCandleTime >= latestCandleTime) {
        seriesRef.current.update({
          ...newCandle,
          time: newCandleTime,
        });
        latestCandleTimeRef.current = newCandleTime;
      }

      setNewCandle(null);
    }, [newCandle, setNewCandle]);

    useEffect(() => {
      if (!seriesRef.current) {
        return;
      }

      if (takeProfitPriceLineRef.current) {
        seriesRef.current.removePriceLine(takeProfitPriceLineRef.current);
      }

      if (takeProfitPrice) {
        takeProfitPriceLineRef.current = seriesRef.current.createPriceLine({
          price: takeProfitPrice,
          color: buyColor,
          lineWidth: 2,
          axisLabelVisible: true,
          title: t('pages.trade.order-block.take-profit.title'),
        });
      }

      seriesRef.current.applyOptions({
        lastValueVisible: false,
        priceLineVisible: true,
      });
    }, [takeProfitPrice, buyColor, t]);

    useEffect(() => {
      if (!seriesRef.current) {
        return;
      }

      if (stopLossPriceLineRef.current) {
        seriesRef.current.removePriceLine(stopLossPriceLineRef.current);
      }

      if (stopLossPrice) {
        stopLossPriceLineRef.current = seriesRef.current.createPriceLine({
          price: stopLossPrice,
          color: sellColor,
          lineWidth: 2,
          axisLabelVisible: true,
          title: t('pages.trade.order-block.stop-loss.title'),
        });
      }

      seriesRef.current.applyOptions({
        lastValueVisible: false,
        priceLineVisible: true,
      });
    }, [stopLossPrice, sellColor, t]);

    useEffect(() => {
      if (candlesWithLocalTime.length > 0) {
        latestCandleTimeRef.current = candlesWithLocalTime[candlesWithLocalTime.length - 1].time;
      } else {
        latestCandleTimeRef.current = undefined;
      }
    }, [candlesWithLocalTime]);

    const precision = useMemo(() => {
      let numberDigits;
      if (candlesWithLocalTime.length > 0) {
        const open = candlesWithLocalTime[0].open;
        numberDigits = valueToFractionDigits(open);
      } else {
        numberDigits = 3;
      }
      return numberDigits;
    }, [candlesWithLocalTime]);

    return (
      <div className={styles.root} ref={ref}>
        {!onlyChart && (
          <div className={styles.heading}>
            {isUpFromMobileScreen && (
              <div className={styles.selectHolder}>
                <MarketSelect />
              </div>
            )}
            <div className={styles.periodsHolder}>
              <PeriodSelector />
            </div>
          </div>
        )}
        <div className={styles.chartWrapper}>
          <ChartBlock
            width={width}
            height={height}
            candles={candlesWithLocalTime}
            seriesRef={seriesRef}
            numberDigits={precision}
          />
          {!isCandleDataReady && (
            <div className={styles.loaderHolder}>
              <CircularProgress color="primary" />
            </div>
          )}
          {isMarketClosed && isPredictionMarket && (
            <div className={styles.loaderHolder}>
              <div className={styles.textWrapper}>
                <Typography variant="bodySmallPopup" className={styles.bold}>
                  {'Market is closed'}
                </Typography>
                <Typography variant="bodySmallPopup" className={styles.italic}>
                  {'Settlement in progress'}
                </Typography>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
