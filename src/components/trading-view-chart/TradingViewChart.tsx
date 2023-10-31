import { useAtom } from 'jotai';
import { type CandlestickData, type ISeriesApi, type Time } from 'lightweight-charts';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { Box, CircularProgress } from '@mui/material';

import { candlesAtom, candlesDataReadyAtom, newCandleAtom } from 'store/tv-chart.store';

import { ONE_MINUTE_SECONDS, ONE_MINUTE_TIME, TIMEZONE_OFFSET } from './constants';
import { ChartBlock } from './elements/chart-block/ChartBlock';
import { PeriodSelector } from './elements/period-selector/PeriodSelector';

import styles from './TradingViewChart.module.scss';

export const TradingViewChart = memo(() => {
  const [candles] = useAtom(candlesAtom);
  const [newCandle, setNewCandle] = useAtom(newCandleAtom);
  const [isCandleDataReady] = useAtom(candlesDataReadyAtom);

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

  return (
    <Box className={styles.root} ref={ref}>
      <ChartBlock width={width} candles={candlesWithLocalTime} seriesRef={seriesRef} />
      <Box className={styles.periodsHolder}>
        <PeriodSelector />
      </Box>
      {!isCandleDataReady && (
        <Box className={styles.loaderHolder}>
          <CircularProgress color="primary" />
        </Box>
      )}
    </Box>
  );
});
