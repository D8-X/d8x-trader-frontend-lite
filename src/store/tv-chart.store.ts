import { atom } from 'jotai';

import { MarketDataI } from 'pages/trader-page/components/candles-webSocket-listener/types';
import { TvChartPeriodE } from 'types/enums';
import { TvChartCandleI } from 'types/types';

export const candlesAtom = atom<TvChartCandleI[]>([]);
export const newCandleAtom = atom<TvChartCandleI | null>(null);
export const marketsDataAtom = atom<MarketDataI[]>([]);
export const selectedPeriodAtom = atom<TvChartPeriodE>(TvChartPeriodE['1Hour']);
export const candlesDataReadyAtom = atom(false);
export const candlesLatestMessageTimeAtom = atom(Date.now());
