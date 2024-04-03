import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const STRATEGY_ADDRESS_LS_KEY = 'd8x_strategyAddress';

export const strategyAddressAtom = atomWithStorage(STRATEGY_ADDRESS_LS_KEY, '');

export const hasPositionAtom = atom<boolean | null>(null);
