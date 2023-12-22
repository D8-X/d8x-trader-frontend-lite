import { LiquidityProviderTool } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';

import { LiquidityTypeE } from 'types/enums';
import type { OpenWithdrawalI } from 'types/types';

export const liqProvToolAtom = atom<LiquidityProviderTool | null>(null);
export const liquidityTypeAtom = atom(LiquidityTypeE.Add);
export const withdrawalsAtom = atom<OpenWithdrawalI[]>([]);
export const dCurrencyPriceAtom = atom<number | null>(null);
export const tvlAtom = atom<number | null>(null);
export const userAmountAtom = atom<number | null>(null);
export const triggerWithdrawalsUpdateAtom = atom(true);
export const triggerUserStatsUpdateAtom = atom(true);
export const sdkConnectedAtom = atom(false);
export const withdrawalOnChainAtom = atom(false);
