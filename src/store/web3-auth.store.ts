import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { OpenloginUserInfo } from '@web3auth/openlogin-adapter';

const WEB3_AUTH_PK_LS_KEY = 'd8x_web3AuthPK';

export const socialPKAtom = atomWithStorage(WEB3_AUTH_PK_LS_KEY, '');

export const socialUserInfoAtom = atom<Partial<OpenloginUserInfo> | null>(null);
