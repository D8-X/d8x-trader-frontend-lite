import { atom } from 'jotai';
import { type Address } from 'viem';

import { getTradesHistory } from 'network/history';
import { poolsAtom } from 'store/pools.store';

import type { PoolValueI } from '../types/types';
import { UnrealizedPnLListAtomI } from './fetchUnrealizedPnL';

export const realizedPnLListAtom = atom<UnrealizedPnLListAtomI[]>([]);

export const fetchRealizedPnLAtom = atom(null, async (get, set, userAddress: Address, chainId: number) => {
  const pools = get(poolsAtom);

  const tradeHistory = await getTradesHistory(chainId, userAddress);
  const realizedPnLReduced = tradeHistory.reduce<Record<string, PoolValueI>>((acc, current) => {
    const pool = pools.find(({ perpetuals }) => perpetuals.some(({ id }) => id === current.perpetualId));
    const settleSymbol = pool?.settleSymbol || '';
    if (acc[settleSymbol] && settleSymbol !== '') {
      acc[settleSymbol].value += current.realizedPnl;
    } else if (settleSymbol !== '') {
      acc[settleSymbol] = { value: current.realizedPnl, poolSymbol: pool?.poolSymbol || '' };
    }
    return acc;
  }, {});

  set(
    realizedPnLListAtom,
    Object.keys(realizedPnLReduced).map((key) => ({
      symbol: realizedPnLReduced[key].poolSymbol,
      settleSymbol: key,
      value: realizedPnLReduced[key].value,
    }))
  );
});
