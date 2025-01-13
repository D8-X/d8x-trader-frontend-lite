import { atom } from 'jotai';
import { type Address } from 'viem';

import { getPositionRisk } from 'network/network';
import { collateralToSettleConversionAtom, traderAPIAtom } from 'store/pools.store';

import type { PoolValueI } from '../types/types';
import { poolUsdPriceAtom } from './fetchTotalReferralsRewards';

export interface UnrealizedPnLListAtomI {
  symbol: string;
  settleSymbol: string;
  value: number;
}

export const leverageAtom = atom(0);
export const totalMarginAtom = atom<number | null>(null);
export const totalUnrealizedPnLAtom = atom<number | null>(null);
export const unrealizedPnLListAtom = atom<UnrealizedPnLListAtomI[]>([]);

export const fetchUnrealizedPnLAtom = atom(null, async (get, set, userAddress: Address, chainId: number) => {
  const poolUsdPrice = get(poolUsdPriceAtom);
  if (Object.keys(poolUsdPrice).length === 0) {
    return;
  }

  const traderAPI = get(traderAPIAtom);
  const { data } = await getPositionRisk(chainId, traderAPI, userAddress, Date.now());

  if (!data) {
    set(leverageAtom, 0);
    set(totalMarginAtom, null);
    set(totalUnrealizedPnLAtom, null);
    set(unrealizedPnLListAtom, []);
    return;
  }

  const c2s = get(collateralToSettleConversionAtom);
  const activePositions = data.filter(({ side }) => side !== 'CLOSED');

  const unrealizedPnLReduced: Record<string, PoolValueI> = {};
  let totalUnrealizedPnl = 0;
  let totalPositionNotionalBaseCCY = 0;
  let totalCollateralCC = 0;
  activePositions.forEach((position) => {
    const [baseSymbol, , poolSymbol] = position.symbol.split('-');
    const settleSymbol = c2s.get(poolSymbol)?.settleSymbol || '';
    const positionUnrealizedPnl = position.unrealizedPnlQuoteCCY * poolUsdPrice[poolSymbol].quote;
    totalUnrealizedPnl += positionUnrealizedPnl;
    totalPositionNotionalBaseCCY += position.positionNotionalBaseCCY * poolUsdPrice[poolSymbol].bases[baseSymbol];
    totalCollateralCC += position.collateralCC * poolUsdPrice[poolSymbol].collateral;

    const unrealizedPnl = positionUnrealizedPnl / poolUsdPrice[poolSymbol].collateral;
    if (!unrealizedPnLReduced[settleSymbol]) {
      unrealizedPnLReduced[settleSymbol] = { poolSymbol: poolSymbol, value: unrealizedPnl };
    } else {
      unrealizedPnLReduced[settleSymbol].value += unrealizedPnl;
    }
  });

  const leverage = totalPositionNotionalBaseCCY / (totalCollateralCC + totalUnrealizedPnl) || 0;

  set(leverageAtom, leverage);
  set(totalMarginAtom, totalCollateralCC);
  set(totalUnrealizedPnLAtom, totalUnrealizedPnl);
  set(
    unrealizedPnLListAtom,
    Object.keys(unrealizedPnLReduced).map((key) => ({
      symbol: unrealizedPnLReduced[key].poolSymbol,
      settleSymbol: key,
      value: unrealizedPnLReduced[key].value,
    }))
  );
});
