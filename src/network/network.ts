import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import type {
  ExchangeInfoI,
  MarginAccountI,
  OrderDigestI,
  OrderI,
  PerpetualOpenOrdersI,
  PerpetualStaticInfoI,
  ValidatedResponseI,
} from 'types/types';
import { RequestMethodE } from 'types/enums';
import { CancelOrderResponseI, CollateralChangeResponseI, MaxOrderSizeResponseI } from 'types/types';
// import { TraderInterface, floatToABK64x64 } from '@d8x/perpetuals-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TraderInterface = any;

function floatToABK64x64(amount: number) {
  return amount;
}

function getApiUrlByChainId(chainId: number) {
  return config.apiUrl[`${chainId}`] || config.apiUrl.default;
}

export function getExchangeInfo(
  chainId: number,
  traderAPI: TraderInterface | null
): Promise<ValidatedResponseI<ExchangeInfoI>> {
  if (traderAPI) {
    // console.log('exchangeInfo via SDK');
    return traderAPI.exchangeInfo().then((info) => {
      return { type: 'exchange-info', msg: '', data: info } as ValidatedResponseI<ExchangeInfoI>;
    });
  } else {
    // console.log('exchangeInfo via BE');
    return fetch(`${getApiUrlByChainId(chainId)}/exchange-info`, getRequestOptions()).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function getPerpetualStaticInfo(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string
): Promise<ValidatedResponseI<PerpetualStaticInfoI>> {
  if (traderAPI) {
    // console.log('perpStaticInfo via SDK');
    const info = traderAPI.getPerpetualStaticInfo(symbol);
    return Promise.resolve({ type: 'perpetual-static-info', msg: '', data: info });
  } else {
    // console.log('perpStaticInfo via BE');
    return fetch(`${getApiUrlByChainId(chainId)}/perpetual-static-info?symbol=${symbol}`, getRequestOptions()).then(
      (data) => {
        if (!data.ok) {
          console.error({ data });
          throw new Error(data.statusText);
        }
        return data.json();
      }
    );
  }
}

// needs broker input: should go through backend
export function getTraderLoyalty(chainId: number, address: string): Promise<ValidatedResponseI<number>> {
  return fetch(`${getApiUrlByChainId(chainId)}/trader-loyalty?traderAddr=${address}`, getRequestOptions()).then(
    (data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    }
  );
}

export function getPositionRisk(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  traderAddr: string,
  timestamp?: number
): Promise<ValidatedResponseI<MarginAccountI[]>> {
  const params = new URLSearchParams({
    symbol,
    traderAddr,
  });
  if (timestamp) {
    params.append('t', '' + timestamp);
  }

  if (traderAPI) {
    console.log(`positionRisk via SDK ${symbol}`);
    return traderAPI.positionRisk(traderAddr, symbol).then((data: MarginAccountI[]) => {
      return { type: 'position-risk', msg: '', data: data } as ValidatedResponseI<MarginAccountI[]>;
    });
  } else {
    // console.log(`positionRisk via BE ${symbol}`);
    return fetch(`${getApiUrlByChainId(chainId)}/position-risk?${params}`, getRequestOptions()).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function positionRiskOnTrade(
  chainId: number,
  traderAPI: TraderInterface,
  order: OrderI,
  traderAddr: string,
  curAccount?: MarginAccountI
): Promise<
  ValidatedResponseI<{
    newPositionRisk: MarginAccountI;
    orderCost: number;
    maxLongTrade: number;
    maxShortTrade: number;
  }>
> {
  console.log('positionRiskOnTrade via SDK');
  return traderAPI.positionRiskOnTrade(traderAddr, order, curAccount).then((data) => {
    return { type: 'position-risk-on-trade', msg: '', data: data } as ValidatedResponseI<{
      newPositionRisk: MarginAccountI;
      orderCost: number;
      maxLongTrade: number;
      maxShortTrade: number;
    }>;
  });
}

export function positionRiskOnCollateralAction(
  chainId: number,
  traderAPI: TraderInterface | null,
  traderAddr: string,
  amount: number,
  positionRisk: MarginAccountI
): Promise<ValidatedResponseI<{ newPositionRisk: MarginAccountI; availableMargin: number }>> {
  if (traderAPI) {
    // console.log('positionRiskOnCollateral via SDK');
    return traderAPI.positionRiskOnCollateralAction(amount, positionRisk).then((data) => {
      return traderAPI.getAvailableMargin(traderAddr, positionRisk.symbol).then((margin) => {
        return {
          type: 'position-risk-on-collateral-action',
          msg: '',
          data: { newPositionRisk: data, availableMargin: margin },
        } as ValidatedResponseI<{ newPositionRisk: MarginAccountI; availableMargin: number }>;
      });
    });
  } else {
    // console.log('positionRiskOnCollateral via BE');
    const requestOptions = {
      ...getRequestOptions(RequestMethodE.Post),
      body: JSON.stringify({
        amount,
        traderAddr,
        positionRisk,
      }),
    };
    return fetch(`${getApiUrlByChainId(chainId)}/position-risk-on-collateral-action`, requestOptions).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function getOpenOrders(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  traderAddr: string,
  timestamp?: number
): Promise<ValidatedResponseI<PerpetualOpenOrdersI[]>> {
  if (traderAPI) {
    console.log(`openOrders via SDK ${symbol} `);
    return traderAPI.openOrders(traderAddr, symbol).then((data) => {
      return { type: 'open-orders', msg: '', data: data } as ValidatedResponseI<PerpetualOpenOrdersI[]>;
    });
  } else {
    // console.log(`openOrders via BE ${symbol}`);
    const params = new URLSearchParams({
      symbol,
      traderAddr,
    });
    if (timestamp) {
      params.append('t', '' + timestamp);
    }

    return fetch(`${getApiUrlByChainId(chainId)}/open-orders?${params}`, getRequestOptions()).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

// needs broker input, should go through backend
export function getTradingFee(
  chainId: number,
  poolSymbol: string,
  traderAddr?: string
): Promise<ValidatedResponseI<number>> {
  return fetch(
    `${getApiUrlByChainId(chainId)}/trading-fee?poolSymbol=${poolSymbol}&traderAddr=${traderAddr}`,
    getRequestOptions()
  ).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export function getMaxOrderSizeForTrader(
  chainId: number,
  traderAPI: TraderInterface | null,
  traderAddr: string,
  symbol: string,
  timestamp?: number
): Promise<ValidatedResponseI<MaxOrderSizeResponseI>> {
  if (traderAPI) {
    return traderAPI
      .maxOrderSizeForTrader(traderAddr, symbol)
      .then(({ buy, sell }) => {
        return {
          type: 'max-order-size-for-trader',
          msg: '',
          data: { buy: buy, sell: sell },
        } as ValidatedResponseI<MaxOrderSizeResponseI>;
      })
      .catch((error) => {
        console.log(error);
        throw new Error(error);
      });
  } else {
    const params = new URLSearchParams({
      symbol,
      traderAddr,
    });
    if (timestamp) {
      params.append('t', '' + timestamp);
    }

    return fetch(`${getApiUrlByChainId(chainId)}/max-order-size-for-trader?${params}`, getRequestOptions()).then(
      (data) => {
        if (!data.ok) {
          console.error({ data });
          throw new Error(data.statusText);
        }
        return data.json();
      }
    );
  }
}

// needs broker input
export function orderDigest(
  chainId: number,
  orders: OrderI[],
  traderAddr: string
): Promise<ValidatedResponseI<OrderDigestI>> {
  const requestOptions = {
    ...getRequestOptions(RequestMethodE.Post),
    body: JSON.stringify({
      orders,
      traderAddr,
    }),
  };
  return fetch(`${getApiUrlByChainId(chainId)}/order-digest`, requestOptions).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export function getCancelOrder(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  orderId: string
): Promise<ValidatedResponseI<CancelOrderResponseI>> {
  if (traderAPI) {
    const cancelABI = traderAPI.getOrderBookABI(symbol, 'cancelOrder');
    return traderAPI.cancelOrderDigest(symbol, orderId).then((digest) => {
      return traderAPI.fetchLatestFeedPriceInfo(symbol).then((submission) => {
        return {
          type: 'cancel-order',
          msg: '',
          data: {
            OrderBookAddr: digest.OBContractAddr,
            abi: cancelABI,
            digest: digest.digest,
            priceUpdate: {
              updateData: submission.priceFeedVaas,
              publishTimes: submission.timestamps,
              updateFee: traderAPI.PRICE_UPDATE_FEE_GWEI * submission.timestamps.length,
            },
          },
        };
      });
    });
  } else {
    return fetch(
      `${getApiUrlByChainId(chainId)}/cancel-order?symbol=${symbol}&orderId=${orderId}`,
      getRequestOptions()
    ).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function getAddCollateral(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  amount: number
): Promise<ValidatedResponseI<CollateralChangeResponseI>> {
  if (traderAPI) {
    const perpId = traderAPI.getPerpetualStaticInfo(symbol).id;
    const proxyAddr = traderAPI.getProxyAddress();
    const proxyABI = traderAPI.getProxyABI('deposit');
    const amountHex = floatToABK64x64(amount);
    return traderAPI.fetchLatestFeedPriceInfo(symbol).then((submission) => {
      return {
        type: 'add-collateral',
        msg: '',
        data: {
          perpId: perpId,
          proxyAddr: proxyAddr,
          abi: proxyABI,
          amountHex: amountHex.toString(),
          priceUpdate: {
            updateData: submission.priceFeedVaas,
            publishTimes: submission.timestamps,
            updateFee: traderAPI.PRICE_UPDATE_FEE_GWEI * submission.priceFeedVaas.length,
          },
        },
      };
    });
  } else {
    return fetch(
      `${getApiUrlByChainId(chainId)}/add-collateral?symbol=${symbol}&amount=${amount}`,
      getRequestOptions()
    ).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function getAvailableMargin(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  traderAddr: string
): Promise<ValidatedResponseI<{ amount: number }>> {
  if (traderAPI) {
    return traderAPI.getAvailableMargin(traderAddr, symbol).then((margin) => {
      return { type: 'available-margin', msg: '', data: { amount: margin } };
    });
  } else {
    return fetch(
      `${getApiUrlByChainId(chainId)}/available-margin?symbol=${symbol}&traderAddr=${traderAddr}`,
      getRequestOptions()
    ).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function getRemoveCollateral(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  amount: number
): Promise<ValidatedResponseI<CollateralChangeResponseI>> {
  if (traderAPI) {
    const perpId = traderAPI.getPerpetualStaticInfo(symbol).id;
    const proxyAddr = traderAPI.getProxyAddress();
    const proxyABI = traderAPI.getProxyABI('withdraw');
    const amountHex = floatToABK64x64(amount);
    return traderAPI.fetchLatestFeedPriceInfo(symbol).then((submission) => {
      return {
        type: 'remove-collateral',
        msg: '',
        data: {
          perpId: perpId,
          proxyAddr: proxyAddr,
          abi: proxyABI,
          amountHex: amountHex.toString(),
          priceUpdate: {
            updateData: submission.priceFeedVaas,
            publishTimes: submission.timestamps,
            updateFee: traderAPI.PRICE_UPDATE_FEE_GWEI * submission.priceFeedVaas.length,
          },
        },
      };
    });
  } else {
    return fetch(
      `${getApiUrlByChainId(chainId)}/remove-collateral?symbol=${symbol}&amount=${amount}`,
      getRequestOptions()
    ).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    });
  }
}

export function getMarketClosedStatus(
  traderAPI: TraderInterface | null,
  symbol: string
): Promise<ValidatedResponseI<{ isMarketClosed: boolean }>> {
  if (traderAPI) {
    return traderAPI.isMarketClosed(symbol).then((isClosed) => {
      return {
        type: 'isMarketClosed',
        msg: '',
        data: { isMarketClosed: isClosed },
      };
    });
  } else {
    return Promise.resolve({
      type: 'isMarketClosed',
      msg: '',
      data: { isMarketClosed: true },
    });
  }
}
