export enum MessageTypeE {
  Connect = 'connect',
  Error = 'error',
  Subscription = 'subscription',
  OnUpdateMarkPrice = 'onUpdateMarkPrice',
  OnUpdateMarginAccount = 'onUpdateMarginAccount',
  OnPerpetualLimitOrderCancelled = 'onPerpetualLimitOrderCancelled',
  OnTrade = 'onTrade',
  OnPerpetualLimitOrderCreated = 'onPerpetualLimitOrderCreated',
  OnExecutionFailed = 'onExecutionFailed',
}

enum MessageNameE {
  PriceUpdate = 'PriceUpdate',
  UpdateMarginAccount = 'UpdateMarginAccount',
  PerpetualLimitOrderCancelled = 'PerpetualLimitOrderCancelled',
  Trade = 'Trade',
  PerpetualLimitOrderCreated = 'PerpetualLimitOrderCreated',
  ExecutionFailed = 'ExecutionFailed',
}

export interface CommonWsMessageI {
  type: MessageTypeE;
  msg: string;
  data: unknown;
}

export interface ConnectWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Connect;
}

export interface ErrorWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Error;
}

export interface SubscriptionWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.Subscription;
  data: {
    id: number;
    baseCurrency: string;
    quoteCurrency: string;
    collToQuoteIndexPrice: number;
    currentFundingRateBps: number;
    indexPrice: number;
    markPrice: number;
    maxPositionBC: number;
    midPrice: number;
    openInterestBC: number;
    state: string; // TODO: check for available statuses
    isMarketClosed: boolean;
  };
}

export interface OnUpdateMarkPriceWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.OnUpdateMarkPrice;
  data: {
    name: MessageNameE.PriceUpdate;
    obj: {
      symbol: string;
      fundingRate: number;
      indexPrice: number;
      markPrice: number;
      midPrice: number;
      openInterest: number;
      perpetualId: number;
    };
  };
}

export interface OnUpdateMarginAccountWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.OnUpdateMarginAccount;
  data: {
    name: MessageNameE.UpdateMarginAccount;
    obj: {
      traderAddr: string;
    };
  };
}

export interface OnPerpetualLimitOrderCancelledWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.OnPerpetualLimitOrderCancelled;
  data: {
    name: MessageNameE.PerpetualLimitOrderCancelled;
    obj: {
      perpetualId: number;
      orderId: string;
    };
  };
}

export interface OnTradeWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.OnTrade;
  data: {
    name: MessageNameE.Trade;
    obj: {
      symbol: string;
      traderAddr: string;
      orderId: string;
    };
  };
}

export interface OnLimitOrderCreatedWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.OnPerpetualLimitOrderCreated;
  data: {
    name: MessageNameE.PerpetualLimitOrderCreated;
    obj: {
      symbol: string;
      perpetualId: number;
      traderAddr: string;
      orderId: string;
    };
  };
}

export interface OnExecutionFailedWsMessageI extends CommonWsMessageI {
  type: MessageTypeE.OnExecutionFailed;
  data: {
    name: MessageNameE.ExecutionFailed;
    obj: {
      symbol: string;
      perpetualId: number;
      traderAddr: string;
      orderId: string;
      reason: string;
    };
  };
}
