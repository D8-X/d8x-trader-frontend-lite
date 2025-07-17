import { SmartContractOrder, type TraderInterface } from '@d8x/perpetuals-sdk';
import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { RequestMethodE } from 'types/enums';
import type {
  AngleApyResponseI,
  BoostRankResponseI,
  BoostStationResponseI,
  BoostStationParamResponseI,
  CancelOrderResponseI,
  EtherFiApyI,
  ExchangeInfoI,
  WeeklyLeaderboardResponseI,
  AllTimeLeaderboardResponseI,
  MaintenanceStatusI,
  MarginAccountI,
  MaxOrderSizeResponseI,
  OrderDigestI,
  OrderI,
  PerpetualOpenOrdersI,
  PerpetualPriceI,
  PerpetualStaticInfoI,
  ValidatedResponseI,
} from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

function getApiUrlByChainId(chainId: number) {
  const urlByFirstEnabledChainId = config.apiUrl[config.enabledChains[0]];
  if (!isEnabledChain(chainId)) {
    return urlByFirstEnabledChainId || config.apiUrl.default;
  }
  return config.apiUrl[chainId] || urlByFirstEnabledChainId || config.apiUrl.default;
}

function getHistoryUrlByChainId(chainId: number) {
  const urlByFirstEnabledChainId = config.historyUrl[config.enabledChains[0]];
  if (!isEnabledChain(chainId)) {
    return urlByFirstEnabledChainId || config.historyUrl.default;
  }
  return config.historyUrl[chainId] || urlByFirstEnabledChainId || config.historyUrl.default;
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
  if (traderAPI) {
    // console.log('perpStaticInfo via SDK', { chainId, traderAPIChainId: Number(traderAPI.chainId), symbol });
    if (Number(traderAPI.chainId) === chainId) {
      const info = traderAPI.getPerpetualStaticInfo(symbol);
      return { type: 'perpetual-static-info', msg: '', data: info };
    }
    throw new Error('ChainId is not correct.');
  } else {
    // console.log('perpStaticInfo via BE', { chainId, symbol });
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
  signedPositionNotionalBaseCCY: number,
  tradingFeeTbps: number
): Promise<
  ValidatedResponseI<{
    newPositionRisk: MarginAccountI;
    orderCost: number;
    maxLongTrade: number;
    maxShortTrade: number;
    ammPrice: number;
  }>
> {
  return traderAPI
    .positionRiskOnTrade(traderAddr, order, signedPositionNotionalBaseCCY, tradingFeeTbps)
    .then((data) => {
      return { type: 'position-risk-on-trade', msg: '', data: data } as ValidatedResponseI<{
        newPositionRisk: MarginAccountI;
        orderCost: number;
        maxLongTrade: number;
        maxShortTrade: number;
        ammPrice: number;
      }>;
    });
}

export async function getPerpetualPrice(
  amount: number,
  symbol: string,
  traderAPI: TraderInterface
): Promise<ValidatedResponseI<PerpetualPriceI>> {
  const price = await traderAPI.getPerpetualPrice(symbol, amount);
  return { type: 'perpetual-price', msg: '', data: { price } };
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
  if (traderAPI) {
    if (Number(traderAPI.chainId) === chainId) {
      // console.log('getMaxOrderSizeForTrader via sdk');
      return traderAPI.maxOrderSizeForTrader(traderAddr, symbol).then(({ buy, sell }) => {
        return {
          type: 'max-order-size-for-trader',
          msg: '',
          data: { buy: Math.abs(buy), sell: Math.abs(sell) },
        } as ValidatedResponseI<MaxOrderSizeResponseI>;
      });
    }
    throw new Error('ChainId is not correct.');
  } else {
    // console.log('getMaxOrderSizeForTrader via BE');
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

// TODO: remove legacy interface
interface OrderDigestLegacyI {
  digests: string[];
  orderIds: string[];
  OrderBookAddr: string;
  abi: string | string[];
  SCOrders: SmartContractOrder[];
  error?: string;
  usage?: string;
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

    // return data.json();
    // TODO: remove legacy code below:
    return data.json().then((resp: ValidatedResponseI<OrderDigestLegacyI | OrderDigestI>) => ({
      ...resp,
      data:
        'SCOrders' in resp.data
          ? {
              ...resp.data,
              brokerAddr: resp.data.SCOrders[0].brokerAddr,
              brokerFeeTbps: Number(resp.data.SCOrders[0].brokerFeeTbps),
              brokerSignatures: resp.data.SCOrders.map(({ brokerSignature }) => (brokerSignature ?? '0x').toString()),
            }
          : resp.data,
    }));
  });
}

export function getCancelOrder(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  orderId: string
): Promise<ValidatedResponseI<CancelOrderResponseI>> {
  if (traderAPI) {
    if (Number(traderAPI.chainId) === chainId) {
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
    }
    throw new Error('ChainId is not correct.');
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

export function getAvailableMargin(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string,
  traderAddr: string
): Promise<ValidatedResponseI<{ amount: number }>> {
  if (traderAPI) {
    if (Number(traderAPI.chainId) === chainId) {
      return traderAPI.getAvailableMargin(traderAddr, symbol).then((margin) => {
        return { type: 'available-margin', msg: '', data: { amount: margin } };
      });
    }
    throw new Error('ChainId is not correct.');
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

export async function getWeeklyLeaderboardEntries(): Promise<WeeklyLeaderboardResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/leader`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

export async function getAllTimeLeaderboardEntries(): Promise<AllTimeLeaderboardResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/all-time-leader`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

// Interface for contract data
interface CoingeckoContractI {
  ticker_id: string;
  contract_specs: {
    contract_type: string;
    contract_price_currency: string;
    contract_price: number;
    contract_collateral_currency: string;
  };
  base_currency: string;
  target_currency: string;
  last_price: number;
  base_volume: number;
  target_volume: number;
  base_volume_30d: number;
  target_volume_30d: number;
  high: number;
  low: number;
  product_type: string;
  open_interest: number;
  index_price: number;
  index_name: string;
  index_currency: string;
  start_timestamp: number;
  end_timestamp: number;
  funding_rate: number;
  next_funding_rate: number;
  next_funding_rate_timestamp: number;
}

// Response interface for Coingecko data
export interface CoingeckoDataResponseI {
  chain_id: number;
  timestamp: number;
  contracts: CoingeckoContractI[];
}

export async function getCoingeckoData(chainId: number): Promise<CoingeckoDataResponseI> {
  const data = await fetch(`https://drip.d8x.xyz/coingecko/contracts?chain_id=${chainId}`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

// Interface for LP action history items
export interface LpActionHistoryItemI {
  created_at: string;
  pool_id: number;
  lp_tokens_dec: number;
  event_type: string;
  sh_tokens_dec: number;
  price_cc: number;
  tx_hash: string;
  shareSymbol?: string;
  userSymbol?: string;
}

export async function getLpActionHistory(
  chainId: number,
  lpAddr: string,
  poolSymbol: string
): Promise<LpActionHistoryItemI[]> {
  const data = await fetch(
    `${getHistoryUrlByChainId(chainId)}/lp-actions?lpAddr=${lpAddr}&poolSymbol=${poolSymbol}`,
    getRequestOptions()
  );
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
}

export async function getLeverageSwitch(
  chainId: number,
  traderAPI: TraderInterface | null,
  symbol: string
): Promise<
  ValidatedResponseI<{
    event: string;
    ts: number;
    tsStr: string;
  } | null>
> {
  if (traderAPI && Number(traderAPI.chainId) === chainId) {
    const leverageSwitchData = traderAPI.getMarketDayTradingNextEvent(symbol);
    return {
      type: 'leverage-switch',
      msg: '',
      data: leverageSwitchData,
    };
  } else {
    // If no traderAPI available, return null data
    return {
      type: 'leverage-switch',
      msg: 'No trader API available',
      data: null,
    };
  }
}
