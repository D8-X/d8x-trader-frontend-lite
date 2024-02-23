import type { APIReferPayload, APIReferralCodePayload, APIReferralCodeSelectionPayload } from '@d8x/perpetuals-sdk';
import { ReferralCodeSigner } from '@d8x/perpetuals-sdk';
import type { Account, Address, Transport } from 'viem';
import type { Chain, WalletClient } from 'wagmi';

import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { RequestMethodE } from 'types/enums';
import type {
  EarnedRebateI,
  OpenEarningsI,
  ReferralCutI,
  ReferralDataI,
  ReferralResponseI,
  TokenInfoI,
} from 'types/types';

function getReferralUrlByChainId(chainId: number) {
  return config.referralUrl[`${chainId}`] || config.referralUrl.default;
}

const fetchUrl = async (url: string, chainId: number) => {
  const data = await fetch(`${getReferralUrlByChainId(chainId)}/${url}`, getRequestOptions());
  if (!data.ok) {
    console.error({ data });
    throw new Error(data.statusText);
  }
  return data.json();
};

export async function postUpsertCode(
  chainId: number,
  referrerAddr: string,
  code: string,
  referrerRebatePerc: number,
  traderRebatePerc: number,
  walletClient: WalletClient<Transport, Chain, Account>,
  onSignatureSuccess: () => void
) {
  const signingFun = (x: string | Uint8Array) =>
    walletClient.signMessage({ message: { raw: x as Address | Uint8Array } }) as Promise<string>;

  const payload: APIReferralCodePayload = {
    code,
    referrerAddr,
    passOnPercTDF: Math.round((100 * 100 * traderRebatePerc) / (referrerRebatePerc + traderRebatePerc)),
    createdOn: Math.round(Date.now() / 1000),
    signature: '',
  };

  const codeSigner = new ReferralCodeSigner(signingFun, walletClient.account.address, '');
  payload.signature = await codeSigner.getSignatureForNewCode(payload);

  if (!(await ReferralCodeSigner.checkNewCodeSignature(payload))) {
    throw new Error('Signature is not valid');
  } else {
    onSignatureSuccess();
    return fetch(`${getReferralUrlByChainId(chainId)}/upsert-code`, {
      ...getRequestOptions(RequestMethodE.Post),
      body: JSON.stringify(payload),
    }).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return;
    });
  }
}

export async function postRefer(
  chainId: number,
  referToAddr: string,
  referrerRebatePerc: number,
  partnerRebatePerc: number,
  walletClient: WalletClient<Transport, Chain, Account>,
  onSignatureSuccess: () => void
) {
  const signingFun = (x: string | Uint8Array) =>
    walletClient.signMessage({ message: { raw: x as Address | Uint8Array } }) as Promise<string>;

  const payload: APIReferPayload = {
    parentAddr: walletClient.account.address,
    referToAddr,
    passOnPercTDF: Math.round((100 * 100 * partnerRebatePerc) / (partnerRebatePerc + referrerRebatePerc)),
    createdOn: Math.round(Date.now() / 1000),
    signature: '',
  };

  const codeSigner = new ReferralCodeSigner(signingFun, walletClient.account.address, '');
  payload.signature = await codeSigner.getSignatureForNewReferral(payload);

  onSignatureSuccess();
  return fetch(`${getReferralUrlByChainId(chainId)}/refer`, {
    ...getRequestOptions(RequestMethodE.Post),
    body: JSON.stringify(payload),
  }).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return;
  });
}

export async function postUseReferralCode(
  chainId: number,
  address: string,
  code: string,
  walletClient: WalletClient,
  onSignatureSuccess: () => void
) {
  const signingFun = (x: string | Uint8Array) =>
    walletClient.signMessage({ message: { raw: x as Address | Uint8Array } }) as Promise<string>;

  const payload: APIReferralCodeSelectionPayload = {
    code,
    traderAddr: address,
    createdOn: Math.round(Date.now() / 1000),
    signature: '',
  };

  const referralCodeSigner = new ReferralCodeSigner(signingFun, walletClient.account.address, '');
  payload.signature = await referralCodeSigner.getSignatureForCodeSelection(payload);

  if (!(await ReferralCodeSigner.checkCodeSelectionSignature(payload))) {
    throw new Error('Signature is not valid');
  } else {
    onSignatureSuccess();
    return fetch(`${getReferralUrlByChainId(chainId)}/select-code`, {
      ...getRequestOptions(RequestMethodE.Post),
      body: JSON.stringify(payload),
    }).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return;
    });
  }
}

export async function postSocialVerify(chainId: number, idToken: string, pubKey: string) {
  return fetch(`${getReferralUrlByChainId(chainId)}/social-verify`, {
    ...getRequestOptions(RequestMethodE.Post),
    headers: { ...getRequestOptions(RequestMethodE.Post).headers, Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ appPubKey: pubKey }),
  }).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return;
  });
}

export function getMyCodeSelection(chainId: number, address: string): Promise<ReferralResponseI<string>> {
  return fetchUrl(`my-code-selection?traderAddr=${address}`, chainId);
}

export function getCodeRebate(chainId: number, code: string): Promise<ReferralResponseI<{ rebate_percent: number }>> {
  return fetchUrl(`code-rebate?code=${code}`, chainId);
}

export function getTokenInfo(chainId: number): Promise<ReferralResponseI<TokenInfoI>> {
  return fetchUrl('token-info', chainId);
}

export function getReferCut(
  chainId: number,
  address: string,
  holdings: bigint
): Promise<ReferralResponseI<ReferralCutI>> {
  return fetchUrl(`refer-cut?addr=${address}&holdings=${holdings}`, chainId);
}

export function getEarnedRebate(chainId: number, address: string): Promise<ReferralResponseI<EarnedRebateI[] | null>> {
  return fetchUrl(`earnings?addr=${address}`, chainId);
}

export function getMyReferrals(chainId: number, address: string): Promise<ReferralResponseI<ReferralDataI[]>> {
  return fetchUrl(`my-referrals?addr=${address}`, chainId);
}

export function getOpenRewards(chainId: number, traderAddr: string): Promise<ReferralResponseI<OpenEarningsI>> {
  return fetchUrl(`open-pay?traderAddr=${traderAddr}`, chainId);
}
