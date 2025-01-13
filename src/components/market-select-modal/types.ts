import { MarketDataI } from 'pages/trader-page/components/candles-webSocket-listener/types';
import { PerpetualI } from 'types/types';

export interface PerpetualWithPoolAndMarketI extends PerpetualI {
  poolSymbol: string;
  settleSymbol: string;
  symbol: string;
  marketData: MarketDataI | null;
}
