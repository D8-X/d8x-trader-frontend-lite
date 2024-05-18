import { TraderInterface, type SmartContractOrder } from '@d8x/perpetuals-sdk';
import type { ReactElement, ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TemporaryAnyT = any;

import type {
  AlignE,
  FieldTypeE,
  LanguageE,
  OrderBlockE,
  OrderTypeE,
  OrderValueTypeE,
  StopLossE,
  TakeProfitE,
} from './enums';
import type { Address, WalletClient } from 'viem';

export interface LanguageMetaI {
  id: LanguageE;
  lang: string;
  flag: string;
  name: string;
}

export interface AppDimensionsI {
  width?: number;
  height?: number;
}

export interface PerpetualI {
  id: number;
  state: string;
  baseCurrency: string;
  quoteCurrency: string;
  indexPrice: number;
  collToQuoteIndexPrice: number;
  markPrice: number;
  midPrice: number;
  currentFundingRateBps: number;
  openInterestBC: number;
  isMarketClosed: boolean;
}

export interface PerpetualDataI {
  id: number;
  poolName: string;
  baseCurrency: string;
  quoteCurrency: string;
  symbol: string;
}

export interface SymbolDataI {
  symbol: string;
  perpetual: PerpetualDataI | null;
}

export interface PerpetualStatisticsI {
  id: number;
  baseCurrency: string;
  quoteCurrency: string;
  poolName: string;
  midPrice: number;
  markPrice: number;
  indexPrice: number;
  currentFundingRateBps: number;
  openInterestBC: number;
}

export interface PoolI {
  isRunning: boolean;
  poolSymbol: string;
  marginTokenAddr: string;
  poolShareTokenAddr: string;
  defaultFundCashCC: number;
  pnlParticipantCashCC: number;
  totalTargetAMMFundSizeCC: number;
  brokerCollateralLotSize: number;
  perpetuals: PerpetualI[];
}

export interface PoolWithIdI extends PoolI {
  poolId: number;
}

export interface ReferralResponseI<T> {
  type: string;
  data: T;
}

export interface ValidatedResponseI<T> extends ReferralResponseI<T> {
  msg: string;
}

export interface MaintenanceStatusI {
  chainId: number;
  isMaintenance: boolean;
}

export interface ExchangeInfoI {
  pools: PoolI[];
  oracleFactoryAddr: string;
  proxyAddr: string;
}

// Covered only required fields
export interface GeoLocationDataI {
  countryCode: string;
}

export interface PerpetualStaticInfoI {
  id: number;
  limitOrderBookAddr: string;
  initialMarginRate: number;
  maintenanceMarginRate: number;
  S2Symbol: string;
  S3Symbol: string;
  lotSizeBC: number;
  referralRebate: number;
}

// Taken from `@d8x/perpetuals-sdk/src/nodeSDKTypes.ts`
export interface MarginAccountI {
  symbol: string;
  positionNotionalBaseCCY: number;
  side: string;
  entryPrice: number;
  leverage: number;
  markPrice: number;
  unrealizedPnlQuoteCCY: number;
  unrealizedFundingCollateralCCY: number;
  collateralCC: number;
  liquidationPrice: [number, number | undefined];
  liquidationLvg: number;
  collToQuoteConversion: number;
}

export interface MarginAccountWithAdditionalDataI extends MarginAccountI {
  liqPrice: number;
  takeProfit: {
    orders: OrderWithIdI[];
    fullValue: number | undefined;
    valueType: OrderValueTypeE;
  };
  stopLoss: {
    orders: OrderWithIdI[];
    fullValue: number | undefined;
    valueType: OrderValueTypeE;
  };
}

export interface PerpetualOpenOrdersI {
  orders: OrderI[];
  orderIds: string[];
}

// Taken from node_modules/@mui/base/SliderUnstyled/useSlider.types.d.ts. Cannot be imported without new library in deps
export interface MarkI {
  value: number;
  label?: ReactNode;
}

export interface OrderInfoI {
  symbol: string;
  poolName: string;
  baseCurrency: string;
  quoteCurrency: string;
  orderType: OrderTypeE;
  orderBlock: OrderBlockE;
  leverage: number;
  size: number;
  midPrice: number;
  tradingFee: number | null;
  baseFee: number | null;
  collateral: number;
  maxMinEntryPrice: number | null;
  keepPositionLeverage: boolean;
  reduceOnly: boolean | null;
  limitPrice: number | null;
  triggerPrice: number | null;
  expireDays: number | null;
  stopLoss: StopLossE | null;
  stopLossPrice: number | null;
  takeProfit: TakeProfitE | null;
  takeProfitPrice: number | null;
}

export interface OrderI {
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  reduceOnly?: boolean;
  limitPrice?: number;
  keepPositionLvg?: boolean;
  brokerFeeTbps?: number;
  brokerAddr?: string;
  // brokerSignature?: BytesLike;
  stopPrice?: number;
  leverage?: number;
  deadline?: number;
  executionTimestamp: number;
  submittedTimestamp?: number;
  parentChildOrderIds?: [string, string];
}

export interface OrderWithIdI extends OrderI {
  id: string;
}

export interface OrderDigestI {
  digests: string[];
  orderIds: string[];
  OrderBookAddr: string;
  abi: string | string[];
  SCOrders: SmartContractOrder[];
  error?: string;
  usage?: string;
}

export interface CancelOrderResponseI {
  OrderBookAddr: string;
  abi: string;
  digest: string;
  priceUpdate: PriceUpdatesI;
}

export interface CollateralChangeResponseI {
  perpId: number;
  proxyAddr: string;
  abi: string;
  amountHex: string;
  priceUpdate: PriceUpdatesI;
}

export interface PriceUpdatesI {
  updateData: string[];
  publishTimes: number[];
  updateFee: number;
}

export interface MaxOrderSizeResponseI {
  buy: number;
  sell: number;
}

export interface BoostI {
  chainId: number;
  nxtBoost: number;
  nxtRndBoost: number;
}

export interface PoolVolBoostI {
  token: string;
  boost: number;
}

export interface BoostStationResponseI {
  addr: string;
  boostedLpVol: number;
  boostedTraderVol: number;
  boosts: BoostI[];
  crossChainScore: number;
  hourlyLPBVolIncrease: number;
  lastBoostedVol: number;
  poolVolBoost: PoolVolBoostI[];
}

export interface BoostStationParamResponseI {
  rndBoostMax: number;
  volBoostMax: number;
}

export interface TableHeaderI<T> {
  label: ReactElement | string;
  tooltip?: string;
  align: AlignE;
  field?: keyof T;
  fieldType?: FieldTypeE;
}

export interface TvChartCandleI {
  start: number;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TradeHistoryI {
  chainId: number;
  perpetualId: number;
  orderId: string;
  orderFlags: string;
  side: string;
  price: number;
  quantity: number;
  fee: number;
  realizedPnl: number;
  transactionHash: string;
  timestamp: string;
}

export interface TradeHistoryWithSymbolDataI extends TradeHistoryI, SymbolDataI {}

export interface FundingI {
  perpetualId: number;
  amount: number;
  timestamp: string;
  transactionHash: string;
}

export interface FundingWithSymbolDataI extends FundingI, SymbolDataI {}

export interface WeeklyApiI {
  startTimestamp: number;
  endTimestamp: number;
  startPrice: number;
  endPrice: number;
  apy: number;
  rawReturn: number;
  allTimeAPY: number;
}

export interface EarningsI {
  earnings: number;
}

export interface OpenWithdrawalI {
  shareAmount: number;
  timeElapsedSec: number;
}

export interface OpenWithdrawalsI {
  withdrawals?: OpenWithdrawalI[];
}

export interface RebateI {
  cutPerc: number;
  holding: number;
}

export interface TokenInfoI {
  tokenAddr: string;
  rebates: RebateI[];
}

export interface ReferralCutI {
  isAgency: boolean;
  passed_on_percent: number;
}

export interface EarnedRebateI {
  poolId: number;
  code: string;
  earnings: number;
  asTrader: boolean;
  tokenName: string;
}

export interface TraderDataI {
  code: string;
  activeSince: string;
  traderRebatePercFinal?: number;
}

export interface OpenTraderRebateI {
  poolId: number;
  earnings: number;
  tokenName: string;
}

export interface OpenEarningsI {
  code: string;
  openEarnings: OpenTraderRebateI[] | null;
}

export interface ReferrerDataI {
  code: string;
  referrerAddr: string;
  agencyAddr: string;
  brokerAddr: string;
  traderRebatePerc: number;
  agencyRebatePerc: number;
  referrerRebatePerc: number;
  createdOn: string;
  expiry: string;
}

export interface ReferralCodeI {
  trader: TraderDataI;
  referrer: ReferrerDataI[];
  agency: ReferrerDataI[];
}

export interface ReferralTableDataI {
  referralCode: string;
  isPartner: boolean;
  commission: number;
  discount: number;
}

export interface ReferralDataI {
  referral: string;
  passOnPerc: number;
}

export interface OverviewPoolItemI {
  value: number | string;
  symbol: PoolI['poolSymbol'];
}

export interface OverviewItemI {
  title: string;
  poolsItems: OverviewPoolItemI[];
}

export interface IpGeolocationDataI {
  ip: string;
  country_code2: string;
  country_code3: string;
  country_name: string;
  state_prov: string;
  district: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  security?: {
    threat_score: number;
    is_tor: boolean;
    is_proxy: boolean;
    proxy_type: string;
    is_anonymous: boolean;
    is_known_attacker: boolean;
    is_cloud_provider: boolean;
  };
}

export interface HedgeConfigI {
  chainId: number; //42161 | 421614;
  symbol: string; // 'ETH-USD-WEETH';
  walletClient: WalletClient;
  traderAPI: TraderInterface;
  amount?: number; // only used to open
  feeRate?: number; // only used to open
  indexPrice?: number; // only used to open - defaults to mark price
  limitPrice?: number; // defaults to mark price to open, undefined to close (market w/o slippage protection)
  strategyAddress?: Address; // strategy address, if already known
}

export interface StrategyAddressI {
  userAddress: Address;
  strategyAddress: Address;
}

export interface WrapOKBConfigI {
  walletClient: WalletClient;
  wrappedTokenAddress: Address;
  wrappedTokenDecimals: number;
  amountWrap?: number;
  amountUnwrap?: number;
}
