import { atom } from 'jotai';
import { type Address } from 'viem';

import { getEarnings } from 'network/history';
import { poolsAtom } from 'store/pools.store';

import type { PoolValueI } from '../types/types';
import { poolUsdPriceAtom } from './fetchTotalReferralsRewards';
import { UnrealizedPnLListAtomI } from './fetchUnrealizedPnL';

export const totalEstimatedEarningsAtom = atom(0);
export const earningsListAtom = atom<UnrealizedPnLListAtomI[]>([]);
export const fetchEarningsAtom = atom(null, async (get, set, userAddress: Address, chainId: number) => {
  const poolUsdPrice = get(poolUsdPriceAtom);
  if (Object.keys(poolUsdPrice).length === 0) {
    set(totalEstimatedEarningsAtom, 0);
    set(earningsListAtom, []);
    return;
  }

  const pools = get(poolsAtom);

  const earningsPromises = [];
  const collateralPrices: number[] = [];
  const settleSymbols: string[] = [];
  const poolSymbols: string[] = [];
  for (const pool of pools) {
    earningsPromises.push(getEarnings(chainId, userAddress, pool.poolSymbol));
    collateralPrices.push(poolUsdPrice[pool.poolSymbol].collateral);
    settleSymbols.push(pool.settleSymbol);
    poolSymbols.push(pool.poolSymbol);
  }
  const earningsArray = await Promise.all(earningsPromises);
  let totalEstimatedEarnings = 0;
  const earningsList = earningsArray.reduce<Record<string, PoolValueI>>((acc, curr, index) => {
    totalEstimatedEarnings += curr.earnings * collateralPrices[index];
    if (acc[settleSymbols[index]]) {
      acc[settleSymbols[index]].value += curr.earnings;
    } else {
      acc[settleSymbols[index]] = { value: curr.earnings, poolSymbol: poolSymbols[index] };
    }
    return acc;
  }, {});

  set(totalEstimatedEarningsAtom, totalEstimatedEarnings);
  set(
    earningsListAtom,
    Object.keys(earningsList).map((key) => ({
      symbol: earningsList[key].poolSymbol,
      settleSymbol: key,
      value: earningsList[key].value,
    }))
  );
});
