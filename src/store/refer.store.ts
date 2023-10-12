import { atom } from 'jotai';

import type { ReferralDataI, TokenInfoI } from 'types/types';

export const isAgencyAtom = atom(false);
export const commissionRateAtom = atom(0);
export const referralCodesAtom = atom<ReferralDataI[]>([]);
export const tokenInfoAtom = atom<TokenInfoI | null>(null);

export const referralCodesRefetchHandlerRefAtom = atom<{ handleRefresh: () => void }>({ handleRefresh: () => {} });
