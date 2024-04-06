import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { MarginAccountI, StrategyAddressI } from '../types/types';

const STRATEGY_ADDRESSES_LS_KEY = 'd8x_strategyAddresses';

export const strategyAddressesAtom = atomWithStorage<StrategyAddressI[]>(STRATEGY_ADDRESSES_LS_KEY, []);

export const hasPositionAtom = atom<boolean | null>(null);
export const strategyPositionAtom = atom<MarginAccountI | undefined>(undefined);
export const enableFrequentUpdatesAtom = atom(false);
