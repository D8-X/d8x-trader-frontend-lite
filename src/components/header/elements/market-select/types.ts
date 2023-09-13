import { MarketDataI } from 'context/websocket-context/candles/types';
import { PerpetualI } from 'types/types';

export interface PerpetualWithPoolAndMarketI extends PerpetualI {
  poolSymbol: string;
  symbol: string;
  marketData: MarketDataI | null;
}
