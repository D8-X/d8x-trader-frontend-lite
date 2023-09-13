import { atom } from 'jotai';

import { TvChartPeriodE } from 'types/enums';
import { TvChartCandleI } from 'types/types';
import { MarketDataI } from '../context/websocket-context/candles/types';

export const candlesWebSocketReadyAtom = atom(false);
export const candlesAtom = atom<TvChartCandleI[]>([]);
export const newCandleAtom = atom<TvChartCandleI | null>(null);
export const marketsDataAtom = atom<MarketDataI[]>([]);
export const selectedPeriodAtom = atom<TvChartPeriodE>(TvChartPeriodE['1Hour']);
export const candlesDataReadyAtom = atom(false);
