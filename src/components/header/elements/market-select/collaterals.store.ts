import { atom } from 'jotai';

import { TokenGroupE } from './constants';

export const collateralFilterAtom = atom<string | null>(null);

export const groupFilterAtom = atom<TokenGroupE | null>(null);

const collateralsPrimitiveAtom = atom<string[]>([]);
export const collateralsAtom = atom(
  (get) => get(collateralsPrimitiveAtom),
  (_get, set, collaterals: string[]) => {
    set(collateralsPrimitiveAtom, [...collaterals]);
  }
);
