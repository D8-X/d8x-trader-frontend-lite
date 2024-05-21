import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { EarningsI, FundingI, OpenWithdrawalsI, TradeHistoryI, WeeklyApiI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

function getHistoryUrlByChainId(chainId: number) {
  const urlByFirstEnabledChainId = config.historyUrl[config.enabledChains[0]];
  if (!isEnabledChain(chainId)) {
    return urlByFirstEnabledChainId || config.historyUrl.default;
  }
  return config.historyUrl[chainId] || urlByFirstEnabledChainId || config.historyUrl.default;
}

const fetchUrl = async (url: string, chainId: number) => {
  const data = await fetch(`${getHistoryUrlByChainId(chainId)}/${url}`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
};

export function getTradesHistory(chainId: number, traderAddr: string): Promise<TradeHistoryI[]> {
  return fetchUrl(`trades-history?traderAddr=${traderAddr}`, chainId);
}

export function getFundingRatePayments(chainId: number, traderAddr: string): Promise<FundingI[]> {
  return fetchUrl(`funding-rate-payments?traderAddr=${traderAddr}`, chainId);
}

export function getWeeklyAPI(chainId: number, poolSymbol: string): Promise<WeeklyApiI> {
  return fetchUrl(`apy?poolSymbol=${poolSymbol}`, chainId);
}

export function getEarnings(chainId: number, address: string, poolSymbol: string): Promise<EarningsI> {
  const params = {
    lpAddr: address,
    poolSymbol,
  };
  return fetchUrl(`earnings?${new URLSearchParams(params)}`, chainId);
}

export function getOpenWithdrawals(chainId: number, address: string, poolSymbol: string): Promise<OpenWithdrawalsI> {
  const params = {
    lpAddr: address,
    poolSymbol,
  };
  return fetchUrl(`open-withdrawals?${new URLSearchParams(params)}`, chainId);
}
