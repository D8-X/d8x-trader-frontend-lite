import { atom } from 'jotai';

import { TokenGroupE } from './constants';

export const defaultCollateralFilter = 'ALL';
export const collateralFilterAtom = atom<string>(defaultCollateralFilter);

export const groupFilterAtom = atom<TokenGroupE | null>(null);

const collateralsPrimitiveAtom = atom<string[]>([defaultCollateralFilter]);
export const collateralsAtom = atom(
  (get) => get(collateralsPrimitiveAtom),
  (_get, set, collaterals: string[]) => {
    set(collateralsPrimitiveAtom, [defaultCollateralFilter, ...collaterals]);
  }
);
