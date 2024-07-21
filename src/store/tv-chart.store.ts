import { atom } from 'jotai';

import { MarketDataI } from 'pages/trader-page/components/candles-webSocket-listener/types';
import { selectedPerpetualDataAtom } from 'store/pools.store';
import { OrderBlockE, TvChartPeriodE } from 'types/enums';
import { TvChartCandleI } from 'types/types';
import { orderBlockAtom } from './order-block.store';

export const originalCandlesAtom = atom<TvChartCandleI[]>([]);
// This atom is required for new candles collect when isPredictionMarket selected
export const newOriginalCandlesAtom = atom<TvChartCandleI[]>([]);
const newOriginalCandleAtom = atom<TvChartCandleI | null>(null);

export const marketsDataAtom = atom<MarketDataI[]>([]);
export const selectedPeriodAtom = atom<TvChartPeriodE>(TvChartPeriodE['1Hour']);
export const candlesDataReadyAtom = atom(false);
export const candlesLatestMessageTimeAtom = atom(Date.now());

export const candlesAtom = atom((get) => {
  const selectedPerpetualData = get(selectedPerpetualDataAtom);
  const originalCandles = get(originalCandlesAtom);
  if (selectedPerpetualData && selectedPerpetualData.isPredictionMarket) {
    const orderBlock = get(orderBlockAtom);
    if (orderBlock === OrderBlockE.Short) {
      return originalCandles.map((candle) => ({
        ...candle,
        open: 1 - candle.open,
        high: 1 - candle.low,
        low: 1 - candle.high,
        close: 1 - candle.close,
      }));
    }
  }
  return originalCandles;
});

export const newCandleAtom = atom(
  (get) => {
    const selectedPerpetualData = get(selectedPerpetualDataAtom);
    const newOriginalCandle = get(newOriginalCandleAtom);
    if (selectedPerpetualData && selectedPerpetualData.isPredictionMarket && newOriginalCandle) {
      const orderBlock = get(orderBlockAtom);
      if (orderBlock === OrderBlockE.Short) {
        return {
          ...newOriginalCandle,
          open: 1 - newOriginalCandle.open,
          high: 1 - newOriginalCandle.low,
          low: 1 - newOriginalCandle.high,
          close: 1 - newOriginalCandle.close,
        };
      }
    }
    return newOriginalCandle;
  },
  (get, set, newCandle: TvChartCandleI | null) => {
    const selectedPerpetualData = get(selectedPerpetualDataAtom);
    set(newOriginalCandleAtom, newCandle);
    if (selectedPerpetualData && selectedPerpetualData.isPredictionMarket && newCandle) {
      set(newOriginalCandlesAtom, (prev) => [...prev, newCandle]);
    }
  }
);
