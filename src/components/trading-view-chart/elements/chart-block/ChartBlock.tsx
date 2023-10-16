import { useAtom } from 'jotai';
import { CandlestickSeries, Chart } from 'lightweight-charts-react-wrapper';
import { CrosshairMode, ISeriesApi } from 'lightweight-charts';
import { memo, Ref, useMemo } from 'react';

import { useTheme } from '@mui/material';

import { TvChartCandleI } from 'types/types';
import { appDimensionsAtom, enabledDarkModeAtom } from 'store/app.store';

interface CandlesSeriesPropsI {
  width?: number;
  candles: TvChartCandleI[];
  seriesRef: Ref<ISeriesApi<'Candlestick'>> | undefined;
}

const MIN_CHART_HEIGHT = 300;

export const ChartBlock = memo(({ width, candles, seriesRef }: CandlesSeriesPropsI) => {
  const [dimensions] = useAtom(appDimensionsAtom);
  // A hack to make it rerender and update chart's layout
  const [,] = useAtom(enabledDarkModeAtom);

  const theme = useTheme();

  const chartHeight = useMemo(() => {
    if (dimensions.width && dimensions.width >= theme.breakpoints.values.lg) {
      return dimensions.height ? Math.max(Math.round(dimensions.height / 2), MIN_CHART_HEIGHT) : MIN_CHART_HEIGHT;
    }
    return Math.round(Math.min(Math.max((width || MIN_CHART_HEIGHT) * 0.5, 300), MIN_CHART_HEIGHT));
  }, [dimensions, width, theme.breakpoints]);

  return (
    <Chart
      width={width}
      height={chartHeight}
      layout={{
        background: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--d8x-color-background-items'),
        },
        textColor: getComputedStyle(document.documentElement).getPropertyValue('--d8x-color-text-main'),
      }}
      crosshair={{ mode: CrosshairMode.Normal }}
      timeScale={{ timeVisible: true, barSpacing: candles.length < 60 ? 22 : 8 }}
    >
      <CandlestickSeries key={candles.length} data={candles} reactive={true} ref={seriesRef} />
    </Chart>
  );
});
