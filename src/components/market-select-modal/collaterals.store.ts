import { atom } from 'jotai';

import { AssetTypeE } from 'types/enums';

export const collateralFilterAtom = atom<string | null>(null);

export const assetTypeFilterAtom = atom<AssetTypeE | null>(null);

const collateralsPrimitiveAtom = atom<string[]>([]);
export const collateralsAtom = atom(
  (get) => get(collateralsPrimitiveAtom),
  (_get, set, collaterals: string[]) => {
    set(collateralsPrimitiveAtom, [...collaterals]);
  }
);
