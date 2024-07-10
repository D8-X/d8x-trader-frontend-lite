import { floatToABK64x64, type TraderInterface } from '@d8x/perpetuals-sdk';
import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { RequestMethodE } from 'types/enums';
import type {
  AngleApyResponseI,
  BoostRankResponseI,
  BoostStationResponseI,
  BoostStationParamResponseI,
  CancelOrderResponseI,
  CollateralChangeResponseI,
  EtherFiApyI,
  ExchangeInfoI,
  MaintenanceStatusI,
  MarginAccountI,
  MaxOrderSizeResponseI,
  OrderDigestI,
  OrderI,
  PerpetualOpenOrdersI,
  PerpetualStaticInfoI,
  ValidatedResponseI,
} from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';
import { toHex } from 'viem';

function getApiUrlByChainId(chainId: number) {
  const urlByFirstEnabledChainId = config.apiUrl[config.enabledChains[0]];
  if (!isEnabledChain(chainId)) {
    return urlByFirstEnabledChainId || config.apiUrl.default;
  }
  return config.apiUrl[chainId] || urlByFirstEnabledChainId || config.apiUrl.default;
}

const fetchUrl = async (url: string, chainId: number) => {
  const data = await fetch(`${getApiUrlByChainId(chainId)}/${url}`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
};

export async function getMaintenanceStatus(): Promise<MaintenanceStatusI[]> {
  return fetch('https://drip.d8x.xyz/status', getRequestOptions()).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export async function getEtherFiAPY(): Promise<EtherFiApyI> {
  return fetch('https://etherfi.d8x.xyz/etherfi-apy', getRequestOptions()).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export async function getAngleAPY(): Promise<AngleApyResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/angle-apy`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

export async function getExchangeInfo(
  chainId: number,
  traderAPI: TraderInterface | null
): Promise<ValidatedResponseI<ExchangeInfoI>> {
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
    // console.log('exchangeInfo via SDK');
    const info = await traderAPI.exchangeInfo();
    return { type: 'exchange-info', msg: '', data: info };
  } else {
    // console.log('exchangeInfo via BE');
    return fetchUrl('exchange-info', chainId);
  }
}

export async function getPerpetualStaticInfo(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string
): Promise<ValidatedResponseI<PerpetualStaticInfoI>> {
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
    // console.log('perpStaticInfo via SDK');
    const info = traderAPI.getPerpetualStaticInfo(symbol);
    return { type: 'perpetual-static-info', msg: '', data: info };
  } else {
    // console.log('perpStaticInfo via BE');
    return fetchUrl(`perpetual-static-info?symbol=${symbol}`, chainId);
  }
}

export async function getPositionRisk(
  chainId: number,
  traderAPI: TraderInterface | null,
  traderAddr: string,
  timestamp?: number
): Promise<ValidatedResponseI<MarginAccountI[]>> {
  const params = new URLSearchParams({
    traderAddr,
  });
  if (timestamp) {
    params.append('t', '' + timestamp);
  }

  if (traderAPI && Number(traderAPI.chainId) === chainId) {
    // console.log(`positionRisk via SDK`);
    const data = await traderAPI.positionRisk(traderAddr);
    return { type: 'position-risk', msg: '', data };
  } else {
    // console.log(`positionRisk via BE`);
    return fetchUrl(`position-risk?${params}`, chainId);
  }
}

export function positionRiskOnTrade(
  _chainId: number,
  traderAPI: TraderInterface,
  order: OrderI,
  traderAddr: string,
  curAccount: MarginAccountI | undefined,
  tradingFeeTbps: number | undefined
): Promise<
  ValidatedResponseI<{
    newPositionRisk: MarginAccountI;
    orderCost: number;
    maxLongTrade: number;
    maxShortTrade: number;
  }>
> {
  return traderAPI
    .positionRiskOnTrade(traderAddr, order, curAccount, undefined, { tradingFeeTbps: tradingFeeTbps })
    .then((data) => {
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
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
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

export async function getOpenOrders(
  chainId: number,
  traderAPI: TraderInterface | null,
  traderAddr: string,
  timestamp?: number
): Promise<ValidatedResponseI<PerpetualOpenOrdersI[]>> {
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
    // console.log(`openOrders via SDK`);
    const data = await traderAPI.openOrders(traderAddr);
    return { type: 'open-orders', msg: '', data };
  } else {
    // console.log(`openOrders via BE`);
    const params = new URLSearchParams({
      traderAddr,
    });
    if (timestamp) {
      params.append('t', '' + timestamp);
    }

    return fetchUrl(`open-orders?${params}`, chainId);
  }
}

// needs broker input, should go through backend
export async function getTradingFee(
  chainId: number,
  poolSymbol: string,
  traderAddr?: string
): Promise<ValidatedResponseI<number>> {
  return fetchUrl(`trading-fee?poolSymbol=${poolSymbol}&traderAddr=${traderAddr}`, chainId);
}

export function getMaxOrderSizeForTrader(
  chainId: number,
  traderAPI: TraderInterface | null,
  traderAddr: string,
  symbol: string,
  timestamp?: number
): Promise<ValidatedResponseI<MaxOrderSizeResponseI>> {
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
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
        console.error(error);
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

    return fetchUrl(`max-order-size-for-trader?${params}`, chainId);
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
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
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
          amountHex: toHex(amountHex),
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

export async function getRemoveCollateral(
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
    const submission = await traderAPI.fetchLatestFeedPriceInfo(symbol);
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
  } else {
    const data = await fetch(
      `${getApiUrlByChainId(chainId)}/remove-collateral?symbol=${symbol}&amount=${amount}`,
      getRequestOptions()
    );
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  }
}

export async function getPythID(symbol: string): Promise<{ id: string }[]> {
  const data = await fetch(
    `https://benchmarks.pyth.network/v1/price_feeds/?query=crypto.${symbol}/usd&asset_type=crypto`,
    getRequestOptions()
  );
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

export async function getBoostStationData(traderAddr: string): Promise<BoostStationResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/score?addr=${traderAddr}`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

export async function getBoostRank(traderAddr: string): Promise<BoostRankResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/rank?addr=${traderAddr}`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

export async function getBoostStationParameters(): Promise<BoostStationParamResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/score-params`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}
