import { atom } from 'jotai';
import { Address } from 'viem';

import { getEarnings } from 'network/history';
import { poolsAtom } from 'store/pools.store';

import { poolUsdPriceAtom } from './fetchPortfolio';
import { UnrealizedPnLListAtomI } from './fetchUnrealizedPnL';

export const totalEstimatedEarningsAtom = atom(0);
export const earningsListAtom = atom<UnrealizedPnLListAtomI[]>([]);
export const fetchEarningsAtom = atom(null, async (get, set, userAddress: Address, chainId: number) => {
  const poolUsdPrice = get(poolUsdPriceAtom);
  const pools = get(poolsAtom);

  const earningsPromises = [];
  const collateralPrices: number[] = [];
  const poolSymbols: string[] = [];
  for (const pool of pools) {
    earningsPromises.push(getEarnings(chainId, userAddress, pool.poolSymbol));
    collateralPrices.push(poolUsdPrice[pool.poolSymbol].collateral);
    poolSymbols.push(pool.poolSymbol);
  }
  const earningsArray = await Promise.all(earningsPromises);
  let totalEstimatedEarnings = 0;
  const earningsList = earningsArray.reduce<Record<string, number>>((acc, curr, index) => {
    totalEstimatedEarnings += curr.earnings * collateralPrices[index];
    if (acc[poolSymbols[index]]) {
      acc[poolSymbols[index]] += curr.earnings;
    } else {
      acc[poolSymbols[index]] = curr.earnings;
    }
    return acc;
  }, {});

  set(totalEstimatedEarningsAtom, totalEstimatedEarnings);
  set(
    earningsListAtom,
    Object.keys(earningsList).map((key) => ({
      symbol: key,
      value: earningsList[key],
    }))
  );
});
