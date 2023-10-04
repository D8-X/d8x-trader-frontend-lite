import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type WalletClient } from 'viem';

import { DefaultCurrencyE, OrderBlockPositionE } from 'types/enums';
import { type AppDimensionsI } from 'types/types';

const ENABLED_DARK_MODE_LS_KEY = 'd8x_enabledDarkMode';
const ORDER_BLOCK_POSITION_LS_KEY = 'd8x_orderBlockPosition';
const DEFAULT_CURRENCY_LS_KEY = 'd8x_defaultCurrency';
const SHOW_MODAl_LS_KEY = 'd8x_showWelcomeModal';
const SHOW_MODAL = 'show';
const HIDE_MODAL = 'hide';

export const orderBlockPositionAtom = atomWithStorage<OrderBlockPositionE>(
  ORDER_BLOCK_POSITION_LS_KEY,
  OrderBlockPositionE.Right
);

const enabledDarkModePrimitiveAtom = atomWithStorage<boolean>(
  ENABLED_DARK_MODE_LS_KEY,
  window.matchMedia('(prefers-color-scheme: dark)').matches
);
export const enabledDarkModeAtom = atom(
  (get) => get(enabledDarkModePrimitiveAtom),
  (_get, set, value: boolean) => {
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
    set(enabledDarkModePrimitiveAtom, value);
  }
);
export const defaultCurrencyAtom = atomWithStorage<DefaultCurrencyE>(DEFAULT_CURRENCY_LS_KEY, DefaultCurrencyE.Base);

export const appDimensionsAtom = atom<AppDimensionsI>({});
export const delegateAddressAtom = atom('');

export const activatedOneClickTradingAtom = atom(false);

export const showWelcomeModalAtom = atom(
  () => {
    const showModal = localStorage.getItem(SHOW_MODAl_LS_KEY);
    return showModal === null || showModal === SHOW_MODAL;
  },
  (_get, _set, show: boolean) => {
    localStorage.setItem(SHOW_MODAl_LS_KEY, show ? SHOW_MODAL : HIDE_MODAL);
  }
);

export const tradingClientAtom = atom<WalletClient | null>(null);
