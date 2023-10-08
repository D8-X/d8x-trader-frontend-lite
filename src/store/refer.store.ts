import { atom } from 'jotai';

import { ReferralDataI } from 'types/types';

export const isAgencyAtom = atom(false);
export const commissionRateAtom = atom(0);
export const referralCodesAtom = atom<ReferralDataI[]>([]);

export const referralCodesRefetchHandlerRefAtom = atom<{ handleRefresh: () => void }>({ handleRefresh: () => {} });
