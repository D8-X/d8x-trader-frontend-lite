import { LiquidityProviderTool } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { LiquidityTypeE } from 'types/enums';
import type { OpenWithdrawalI, PoolI } from 'types/types';

export const liqProvToolAtom = atom<LiquidityProviderTool | null>(null);
export const liquidityPoolsAtom = atom<PoolI[]>([]);
export const liquidityTypeAtom = atom(LiquidityTypeE.Add);
export const withdrawalsAtom = atom<OpenWithdrawalI[]>([]);
export const dCurrencyPriceAtom = atom<number | null>(null);
export const tvlAtom = atom<number | null>(null);
export const userAmountAtom = atom<number | null>(null);
export const loadStatsAtom = atom(true);
export const sdkConnectedAtom = atom(false);

const selectedLiquidityPoolNameLSAtom = atomWithStorage<string>('d8x_selectedLiquidityPoolName', '');

export const selectedLiquidityPoolAtom = atom(
  (get) => {
    const allPools = get(liquidityPoolsAtom);
    if (allPools.length === 0) {
      return null;
    }

    const savedPoolName = get(selectedLiquidityPoolNameLSAtom);
    const foundPool = allPools.find((pool) => pool.poolSymbol === savedPoolName);
    if (foundPool) {
      return foundPool;
    }

    return allPools.length > 0 ? allPools[0] : null;
  },
  (get, set, newPool: string) => {
    set(selectedLiquidityPoolNameLSAtom, newPool);
  }
);
