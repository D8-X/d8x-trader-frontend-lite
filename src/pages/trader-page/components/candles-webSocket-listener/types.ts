import { AssetTypeE } from 'types/enums';

import { MessageTopicE, MessageTypeE } from './enums';

export interface CommonWsMessageI {
  type: MessageTypeE;
  topic: string;
  data: unknown;
}

export interface ConnectWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Connect;
}

export interface CandleDataI {
  start: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SubscribeWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Subscribe;
  topic: string;
  data: CandleDataI[];
}

export interface SubscribeWsErrorMessageI extends CommonWsMessageI {
  type: MessageTypeE.Subscribe;
  topic: string;
  data: { error: string };
}

export interface MarketsSubscribeWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Subscribe;
  topic: MessageTopicE;
  data: MarketDataI[];
}

export interface MarketsSubscribeWsErrorMessageI extends CommonWsMessageI {
  type: MessageTypeE.Subscribe;
  topic: MessageTopicE;
  data: { error: string };
}

export interface UpdateWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Update;
  topic: string;
  data: CandleDataI;
}

export interface MarketDataI {
  symbol: string;
  assetType: AssetTypeE;
  ret24hPerc: number;
  currentPx: number;
  isOpen: boolean;
  nextOpen: number;
  nextClose: number;
}

export interface MarketsWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Update;
  topic: MessageTopicE;
  data: MarketDataI[];
}
