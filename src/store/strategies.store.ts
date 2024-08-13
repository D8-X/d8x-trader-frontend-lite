import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type WalletClient } from 'viem';

import {
  MarginAccountI,
  PerpetualI,
  PerpetualStatisticsI,
  PerpetualStaticInfoI,
  PoolWithIdI,
  StrategyAddressI,
} from '../types/types';

export const ORDER_STATUS_INTERVAL = 3_000;

export const STRATEGY_ADDRESSES_LS_KEY = 'd8x_strategyAddresses';

export const strategyAddressesAtom = atomWithStorage<StrategyAddressI[]>(STRATEGY_ADDRESSES_LS_KEY, []);

export const activeStrategyWalletAtom = atom<WalletClient | null>(null);
export const hasPositionAtom = atom<boolean | null>(null);
export const strategyPositionAtom = atom<MarginAccountI | undefined>(undefined);
export const enableFrequentUpdatesAtom = atom(false);
export const strategyPoolAtom = atom<PoolWithIdI | null>(null);
export const strategyPerpetualAtom = atom<PerpetualI | null>(null);
export const strategyPerpetualStatsAtom = atom<PerpetualStatisticsI | null>(null);
export const perpetualStrategyStaticInfoAtom = atom<PerpetualStaticInfoI | null>(null);
