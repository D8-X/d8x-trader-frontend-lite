import { atom } from 'jotai';
import { Address } from 'viem';

import { getPositionRisk } from 'network/network';

import { poolUsdPriceAtom } from './fetchPortfolio';

export interface UnrealizedPnLListAtomI {
  symbol: string;
  value: number;
}

export const leverageAtom = atom(0);
export const totalMarginAtom = atom(0);
export const totalUnrealizedPnLAtom = atom(0);
export const unrealizedPnLListAtom = atom<UnrealizedPnLListAtomI[]>([]);

export const fetchUnrealizedPnLAtom = atom(null, async (get, set, userAddress: Address, chainId: number) => {
  const poolUsdPrice = get(poolUsdPriceAtom);

  const { data } = await getPositionRisk(chainId, null, userAddress, Date.now());
  const activePositions = data.filter(({ side }) => side !== 'CLOSED');

  const unrealizedPnLReduced: Record<string, number> = {};
  let totalUnrealizedPnl = 0;
  let totalPositionNotionalBaseCCY = 0;
  let totalCollateralCC = 0;
  activePositions.forEach((position) => {
    const [baseSymbol, , poolSymbol] = position.symbol.split('-');
    const positionUnrealizedPnl = position.unrealizedPnlQuoteCCY * poolUsdPrice[poolSymbol].quote;
    totalUnrealizedPnl += positionUnrealizedPnl;

    totalPositionNotionalBaseCCY += position.positionNotionalBaseCCY * poolUsdPrice[poolSymbol].bases[baseSymbol];
    totalCollateralCC += position.collateralCC * poolUsdPrice[poolSymbol].collateral;

    const unrealizedPnl = positionUnrealizedPnl / poolUsdPrice[poolSymbol].collateral;
    if (!unrealizedPnLReduced[poolSymbol]) {
      unrealizedPnLReduced[poolSymbol] = unrealizedPnl;
    } else {
      unrealizedPnLReduced[poolSymbol] += unrealizedPnl;
    }
  });

  const leverage = totalPositionNotionalBaseCCY / (totalCollateralCC + totalUnrealizedPnl) || 0;

  set(leverageAtom, leverage);
  set(totalMarginAtom, totalCollateralCC);
  set(totalUnrealizedPnLAtom, totalUnrealizedPnl);
  set(
    unrealizedPnLListAtom,
    Object.keys(unrealizedPnLReduced).map((key) => ({
      symbol: key,
      value: unrealizedPnLReduced[key],
    }))
  );
  return { totalCollateralCC, totalUnrealizedPnl };
});
