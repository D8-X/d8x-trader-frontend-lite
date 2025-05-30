export enum LanguageE {
  EN = 'en',
  CN = 'cn',
  DE = 'de',
  ES = 'es',
  FR = 'fr',
}

export enum ThemeE {
  Light = 'light',
  Dark = 'dark',
}

export enum DefaultCurrencyE {
  Base = 'base',
  Pool = 'pool',
  Quote = 'quote',
}

export enum MethodE {
  Approve = 'approve',
  Transfer = 'transfer',
  Interact = 'interact',
}

export enum OrderValueTypeE {
  Multiple = 'multiple',
  Partial = 'partial',
  Full = 'full',
  Exceeded = 'exceeded',
  None = 'none',
}

export enum YesNoE {
  Yes = 'yes',
  No = 'no',
}

export enum OrderBlockPositionE {
  Left = 'left',
  Right = 'right',
}

export enum SortOrderE {
  Asc = 'asc',
  Desc = 'desc',
}

export enum RequestMethodE {
  Get = 'GET',
  Delete = 'DELETE',
  Post = 'POST',
  Put = 'PUT',
}

export enum OrderBlockE {
  Long = 'Long',
  Short = 'Short',
}

export enum OrderTypeE {
  Market = 'Market',
  Limit = 'Limit',
  Stop = 'Stop',
}

export enum OrderSideE {
  Buy = 'BUY',
  Sell = 'SELL',
}

export enum OpenOrderTypeE {
  Market = 'MARKET',
  Limit = 'LIMIT',
  StopLimit = 'STOP_LIMIT',
  StopMarket = 'STOP_MARKET',
}

export enum ExpiryE {
  '1D' = '1',
  '30D' = '30',
  '90D' = '90',
  '180D' = '180',
  '365D' = '365',
}

export enum StopLossE {
  '5%' = '-5%',
  '25%' = '-25%',
  '50%' = '-50%',
  '75%' = '-75%',
  'None' = 'NONE',
}

export enum TakeProfitE {
  '5%' = '5%',
  '50%' = '50%',
  '100%' = '100%',
  '500%' = '500%',
  'None' = 'NONE',
}

export enum AlignE {
  Left = 'left',
  Right = 'right',
  Center = 'center',
  Inherit = 'inherit',
  Justify = 'justify',
}

export enum TvChartPeriodE {
  '1Min' = '1m',
  '5Min' = '5m',
  '15Min' = '15m',
  '1Hour' = '1h',
  '1Day' = '1d',
}

export enum LiquidityTypeE {
  Add = 'Add',
  Withdraw = 'Withdraw',
  Info = 'Info',
}

export enum TableTypeE {
  POSITIONS,
  OPEN_ORDERS,
  TRADE_HISTORY,
  FUNDING,
}

export enum RebateTypeE {
  Agency = 'agency',
  Trader = 'trader',
  Referrer = 'referrer',
}

export enum ReferralDialogActionE {
  CREATE,
  MODIFY,
}

export enum AssetTypeE {
  All = 'all',
  Crypto = 'crypto',
  Prediction = 'polymarket',
  Fx = 'fx',
  Commodity = 'commodities',
  Metal = 'metal',
  Equity = 'equity',
}

export enum FieldTypeE {
  String,
  Number,
  Date,
  Boolean,
}

export enum Web3SignInMethodE {
  X = 'x',
  Google = 'google',
}
