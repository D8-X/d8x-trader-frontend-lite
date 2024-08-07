import { useAtom, useAtomValue } from 'jotai';
import { type CandlestickData, type ISeriesApi, type Time } from 'lightweight-charts';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { CircularProgress } from '@mui/material';

import { candlesAtom, candlesDataReadyAtom, newCandleAtom } from 'store/tv-chart.store';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import { ONE_MINUTE_SECONDS, ONE_MINUTE_TIME, TIMEZONE_OFFSET } from './constants';
import { ChartBlock } from './elements/chart-block/ChartBlock';
import { PeriodSelector } from './elements/period-selector/PeriodSelector';

import styles from './TradingViewChart.module.scss';

export const TradingViewChart = memo(() => {
  const candles = useAtomValue(candlesAtom);
  const isCandleDataReady = useAtomValue(candlesDataReadyAtom);
  const [newCandle, setNewCandle] = useAtom(newCandleAtom);

  const seriesRef = useRef<ISeriesApi<'Candlestick'>>(null);
  const latestCandleTimeRef = useRef<Time>();

  const { width, ref } = useResizeDetector();

  const candlesWithLocalTime: CandlestickData[] = useMemo(
    () =>
      candles.map((candle) => ({
        ...candle,
        start: candle.start + TIMEZONE_OFFSET * ONE_MINUTE_TIME,
        time: (candle.time + TIMEZONE_OFFSET * ONE_MINUTE_SECONDS) as Time,
      })),
    [candles]
  );

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
      <ChartBlock width={width} candles={candlesWithLocalTime} seriesRef={seriesRef} numberDigits={precision} />
      <div className={styles.periodsHolder}>
        <PeriodSelector />
      </div>
      {!isCandleDataReady && (
        <div className={styles.loaderHolder}>
          <CircularProgress color="primary" />
        </div>
      )}
    </div>
  );
});
