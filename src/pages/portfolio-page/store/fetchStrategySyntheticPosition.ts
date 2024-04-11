import { atom } from 'jotai';
import { Address } from 'viem';

import { STRATEGY_SYMBOL } from 'appConstants';
import { pagesConfig } from 'config';
import { getPositionRisk } from 'network/network';
import { STRATEGY_ADDRESSES_LS_KEY } from 'store/strategies.store';
import { type StrategyAddressI } from 'types/types';

export const syntheticPositionUSDAtom = atom<number | null>(null);

export const fetchStrategySyntheticPosition = atom(null, async (_get, set, userAddress: Address, chainId: number) => {
  const strategyAddressesLS = localStorage.getItem(STRATEGY_ADDRESSES_LS_KEY);
  if (!strategyAddressesLS) {
    set(syntheticPositionUSDAtom, null);
    return null;
  }
  const strategyAddresses: StrategyAddressI[] = JSON.parse(strategyAddressesLS);

  let syntheticPositionUSD = null;
  if (pagesConfig.enabledStrategiesPage) {
    const strategyAddress = strategyAddresses.find(
      ({ userAddress: savedAddress }) => savedAddress === userAddress?.toLowerCase()
    )?.strategyAddress;
    if (strategyAddress) {
      const { data: strategyData } = await getPositionRisk(chainId, null, strategyAddress, Date.now());
      const strategyPosition = strategyData.find(
        ({ symbol, positionNotionalBaseCCY }) => symbol === STRATEGY_SYMBOL && positionNotionalBaseCCY !== 0
      );

      if (strategyPosition) {
        syntheticPositionUSD = strategyPosition.positionNotionalBaseCCY * strategyPosition.entryPrice;
      }
    }
  }

  set(syntheticPositionUSDAtom, syntheticPositionUSD);

  return syntheticPositionUSD;
});
