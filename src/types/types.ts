import { PerpetualState, PerpetualStaticInfo, TraderInterface } from '@d8x/perpetuals-sdk';
import type { ReactElement, ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TemporaryAnyT = any;

import type { Address, WalletClient } from 'viem';
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

export interface PerpetualI extends PerpetualState {}

export interface PerpetualDataI {
  id: number;
  poolName: string;
  baseCurrency: string;
  quoteCurrency: string;
  symbol: string;
  isPredictionMarket: boolean;
  state: string;
}

export interface SymbolDataI {
  symbol: string;
  settleSymbol: string;
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
  midPriceDiff?: number;
}

export interface PoolI {
  isRunning: boolean;
  poolSymbol: string;
  settleSymbol: string;
  marginTokenAddr: string;
  settleTokenAddr: string;
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

export interface ErrorResponseI {
  error?: string;
  usage?: string;
}

export interface ValidatedResponseI<T> extends ReferralResponseI<T> {
  msg: string;
}

export interface MaintenanceStatusI {
  chainId: number;
  isMaintenance: boolean;
}

export interface EtherFiApyI {
  etherfiApy: string;
}

export interface AngleApyResponseI {
  apyDec: string;
  symbol: string;
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

export interface PerpetualStaticInfoI extends ErrorResponseI, PerpetualStaticInfo {}

export interface PerpetualPriceI {
  price: number;
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
  isPredictionMarket: boolean;
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
  brokerAddr: string;
  brokerFeeTbps: number;
  brokerSignatures: string[];
  error?: string;
  usage?: string;
}

export interface CancelOrderResponseI {
  OrderBookAddr: string;
  abi: string;
  digest: string;
  priceUpdate: PriceUpdatesI;
}

export interface CollateralChangePropsI {
  amount: number;
  traderAddr: Address;
  symbol: string;
}

export interface PriceUpdatesI {
  ids: string[];
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

export interface BoostRankResponseI {
  addr: string;
  score: number;
  rank: number;
  outOf: number;
  Ts: number;
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
  hidden?: boolean;
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

export interface WeeklyApyI {
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
  symbol: PoolI['settleSymbol'];
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
  strategyClient: WalletClient;
  isMultisigAddress: boolean | null;
  traderAPI: TraderInterface;
  amount?: number; // only used to open
  feeRate?: number; // only used to open
  indexPrice?: number; // only used to open - defaults to mark price
  limitPrice?: number; // defaults to mark price to open, undefined to close (market w/o slippage protection)
  strategyAddress?: Address; // strategy address, if already known
  strategyAddressBalanceBigint?: bigint;
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

export interface CollToSettleInfoI {
  poolSymbol: string;
  settleSymbol: string;
  value: number;
}

export interface PredictionMarketRateI {
  asset_address: Address;
  rewards_daily_rate: number;
}

export interface PredictionMarketTokenI {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface PredictionMarketMetaDataI {
  enable_order_book: boolean;
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;
  accepting_order_timestamp: number;
  minimum_order_size: number;
  minimum_tick_size: number;
  condition_id: Address;
  question_id: Address;
  question: string;
  description: string;
  market_slug: string;
  end_date_iso: string;
  game_start_time: string;
  seconds_delay: number;
  fpmm: string;
  maker_base_fee: number;
  taker_base_fee: number;
  notifications_enabled: boolean;
  neg_risk: boolean;
  neg_risk_market_id: Address;
  neg_risk_request_id: Address;
  icon: string;
  image: string;
  rewards: {
    rates: PredictionMarketRateI[];
    min_size: number;
    max_spread: number;
  };
  is_50_50_outcome: boolean;
  tokens: PredictionMarketTokenI[];
  tags: string[];
}

export interface MockSwapConfigI {
  chainId: number;
  pools: {
    id: number;
    marginToken: string;
    decimals: number;
    marginTokenAddress: string;
    marginTokenSwap: string;
  }[];
}

export interface SupportedTokenI {
  symbol: string;
  address: Address;
}
export interface FlatTokenI {
  isFlatToken: boolean;
  symbol: string;
  poolId: number;
  registeredToken: Address | undefined;
  supportedTokens: SupportedTokenI[];
  compositePrice: number | undefined; // price in user-registered token
  registeredSymbol: string | undefined;
}

// Leaderboard interfaces
export interface WeeklyLeaderboardEntryI {
  rank?: number;
  trader?: string;
  pnl?: number;
  vol?: number;
  timeWeightedOI?: string;
  score?: string;
  address?: string;
  numWeeks?: number;
  points?: number;
  volumeRank?: number;
  isHighestOI?: boolean;
  isLowestPnL?: boolean;
}

export interface WeeklyLeaderboardResponseI {
  timestamp: string;
  from?: string;
  to?: string;
  entries?: WeeklyLeaderboardEntryI[];
  board?: LeaderboardEntryI[];
  leaderBoard?: WeeklyLeaderboardEntryI[];
  metadata?: PaginationMetadataI;
}

export interface AllTimeLeaderboardEntryI {
  rank?: number;
  address: string; // Note: different field name than weekly
  pnl: number;
  numWeeks: number;
  points: number;
  timeWeightedOI?: string;
}

export interface AllTimeLeaderboardResponseI {
  asOfDate: string;
  timestamp: string;
  entries?: AllTimeLeaderboardEntryI[];
  board?: AllTimeLeaderboardEntryI[];
  metadata?: PaginationMetadataI;
}

export interface UserLeaderboardStatsI {
  rank: number;
  trader: string;
  pnl: number;
  numWeeks?: number;
  points?: number;
}

// Generic interface to handle both types of entries
export interface LeaderboardEntryI {
  rank?: number;
  trader?: string;
  address?: string;
  pnl: number;
  points?: number;
  numWeeks?: number;
}

export interface PaginationMetadataI {
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WithdrawRequestI {
  lp: string;
  shareTokens: bigint;
  withdrawTimestamp: bigint;
}
