import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginUserInfo } from '@web3auth/openlogin-adapter';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const WEB3_AUTH_ID_TOKEN_LS_KEY = 'd8x_web3AuthIdToken';
const WEB3_AUTH_INSTANCE_LS_KEY = 'd8x_web3AuthInstanceToken';

export const web3authIdTokenAtom = atomWithStorage(WEB3_AUTH_ID_TOKEN_LS_KEY, '');
export const web3authAtom = atomWithStorage<Web3AuthNoModal | null>(WEB3_AUTH_INSTANCE_LS_KEY, null);

export const socialUserInfoAtom = atom<Partial<OpenloginUserInfo> | null>(null);
export const socialPKAtom = atom<string | undefined>(undefined);
