import { atom } from 'jotai';

export const defaultCollateralFilter = 'ALL';
export const collateralFilterAtom = atom<string>(defaultCollateralFilter);

const collateralsPrimitiveAtom = atom<string[]>([defaultCollateralFilter]);
export const collateralsAtom = atom(
  (get) => get(collateralsPrimitiveAtom),
  (_get, set, collaterals: string[]) => {
    set(collateralsPrimitiveAtom, [defaultCollateralFilter, ...collaterals]);
  }
);
