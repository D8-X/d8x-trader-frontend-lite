export enum LanguageE {
  EN = 'en',
  //CN = 'cn',
  DE = 'de',
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

export enum ExpiryE {
  '1D' = '1D',
  '30D' = '30D',
  '90D' = '90D',
  '180D' = '180D',
  '365D' = '365D',
}

export enum StopLossE {
  '10%' = '-10%',
  '25%' = '-25%',
  '50%' = '-50%',
  '75%' = '-75%',
  'None' = 'NONE',
}

export enum TakeProfitE {
  '25%' = '25%',
  '50%' = '50%',
  '100%' = '100%',
  '500%' = '500%',
  'None' = 'NONE',
}

export enum ToleranceE {
  '0.5%' = 0.5,
  '1%' = 1,
  '1.5%' = 1.5,
  '2%' = 2,
  '2.5%' = 2.5,
  '3%' = 3,
  '3.5%' = 3.5,
  '4%' = 4,
  '4.5%' = 4.5,
  '5%' = 5,
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
}

export enum TableTypeE {
  POSITIONS,
  OPEN_ORDERS,
  TRADE_HISTORY,
  FUNDING,
}

export enum PageE {
  Trade = '/',
  Refer = '/refer',
  Vault = '/vault',
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
