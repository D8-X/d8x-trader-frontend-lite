import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { MeeClient } from '@biconomy/abstractjs';
import { config } from 'config';
import { SmartAccountClient } from 'permissionless';
import { DefaultCurrencyE, OrderBlockPositionE, ThemeE } from 'types/enums';
import { type AppDimensionsI } from 'types/types';
import { Account, Chain, Client, SignedAuthorization, Transport, WalletClient } from 'viem';
import { SmartAccount } from 'viem/account-abstraction';

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

const enabledDarkModePrimitiveAtom = atomWithStorage<boolean | null>(ENABLED_DARK_MODE_LS_KEY, null);
export const enabledDarkModeAtom = atom(
  (get) => {
    const isDark = get(enabledDarkModePrimitiveAtom);
    if (isDark === null) {
      let theme = config.defaultTheme;
      if (!Object.values(ThemeE).includes(theme)) {
        theme = ThemeE.Light;
      }
      return theme === ThemeE.Dark;
    }
    return isDark;
  },
  (_get, set, value: boolean) => {
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
    set(enabledDarkModePrimitiveAtom, value);
  }
);
export const defaultCurrencyAtom = atomWithStorage<DefaultCurrencyE>(DEFAULT_CURRENCY_LS_KEY, DefaultCurrencyE.Base);

export const appDimensionsAtom = atom<AppDimensionsI>({});

export const hideBetaTextAtom = atom(false);

export const showWelcomeModalAtom = atom(
  () => {
    const showModal = localStorage.getItem(SHOW_MODAl_LS_KEY);
    return showModal === null || showModal === SHOW_MODAL;
  },
  (_get, _set, show: boolean) => {
    localStorage.setItem(SHOW_MODAl_LS_KEY, show ? SHOW_MODAL : HIDE_MODAL);
  }
);

export const smartAccountClientAtom = atom<
  SmartAccountClient<Transport, Chain, SmartAccount, Client> | WalletClient<Transport, Chain, Account> | null
>(null);

export const meeClientAtom = atom<MeeClient | null>(null);

export const authorization7702Atom = atom<SignedAuthorization | null>(null);
