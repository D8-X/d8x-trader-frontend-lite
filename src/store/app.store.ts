import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { LanguageE, OrderBlockPositionE } from 'types/enums';
import { type AppDimensionsI } from 'types/types';

const ENABLED_DARK_MODE_LS_KEY = 'd8x_enabledDarkMode';
const ORDER_BLOCK_POSITION_LS_KEY = 'd8x_orderBlockPosition';
const SELECTED_LANGUAGE_LS_KEY = 'd8x_selectedLanguage';
const SHOW_MODAl_LS_KEY = 'd8x_showWelcomeModal';
const SHOW_MODAL = 'show';
const HIDE_MODAL = 'hide';

export const orderBlockPositionAtom = atomWithStorage<OrderBlockPositionE>(
  ORDER_BLOCK_POSITION_LS_KEY,
  OrderBlockPositionE.Right
);
export const enabledDarkModeAtom = atomWithStorage<boolean>(ENABLED_DARK_MODE_LS_KEY, false);
export const selectedLanguageAtom = atomWithStorage<LanguageE>(SELECTED_LANGUAGE_LS_KEY, LanguageE.EN);

export const appDimensionsAtom = atom<AppDimensionsI>({});

export const showWelcomeModalAtom = atom(
  () => {
    const showModal = localStorage.getItem(SHOW_MODAl_LS_KEY);
    return showModal === null || showModal === SHOW_MODAL;
  },
  (_get, _set, show: boolean) => {
    localStorage.setItem(SHOW_MODAl_LS_KEY, show ? SHOW_MODAL : HIDE_MODAL);
  }
);
