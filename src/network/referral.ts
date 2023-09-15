import type { APIReferralCodePayload, APIReferralCodeSelectionPayload } from '@d8x/perpetuals-sdk';
import { ReferralCodeSigner } from '@d8x/perpetuals-sdk';
import type { Account, Address, Transport } from 'viem';
import type { Chain, WalletClient } from 'wagmi';

import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { type RebateTypeE, RequestMethodE } from 'types/enums';
import type { EarnedRebateI, OpenTraderRebateI, ReferralCodeI, ReferralVolumeI, ValidatedResponseI } from 'types/types';

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

export async function postUpsertReferralCode(
  chainId: number,
  referrerAddr: string,
  agencyAddr: string,
  code: string,
  traderRebatePerc: number,
  agencyRebatePerc: number,
  referrerRebatePerc: number,
  walletClient: WalletClient<Transport, Chain, Account>,
  onSignatureSuccess: () => void
) {
  const signingFun = (x: string | Uint8Array) =>
    walletClient.signMessage({ message: { raw: x as Address | Uint8Array } }) as Promise<string>;
  const referralCodeSigner = new ReferralCodeSigner(signingFun, walletClient.account.address, '');
  const payload: APIReferralCodePayload = {
    code,
    referrerAddr,
    agencyAddr,
    createdOn: Date.now(),
    traderRebatePerc,
    agencyRebatePerc,
    referrerRebatePerc,
    signature: '',
  };

  payload.signature = await referralCodeSigner.getSignatureForNewCode(payload);

  if (!(await ReferralCodeSigner.checkNewCodeSignature(payload))) {
    throw new Error('signature not valid');
  } else {
    onSignatureSuccess();
    return fetch(`${getReferralUrlByChainId(chainId)}/upsert-referral-code`, {
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

export async function postUseReferralCode(
  chainId: number,
  address: string,
  code: string,
  walletClient: WalletClient,
  onSignatureSuccess: () => void
) {
  const signingFun = (x: string | Uint8Array) =>
    walletClient.signMessage({ message: { raw: x as Address | Uint8Array } }) as Promise<string>;
  const referralCodeSigner = new ReferralCodeSigner(signingFun, walletClient.account.address, '');
  const payload: APIReferralCodeSelectionPayload = {
    code,
    traderAddr: address,
    createdOn: Date.now(),
    signature: '',
  };

  payload.signature = await referralCodeSigner.getSignatureForCodeSelection(payload);

  if (!(await ReferralCodeSigner.checkCodeSelectionSignature(payload))) {
    throw new Error('signature not valid');
  } else {
    onSignatureSuccess();
    return fetch(`${getReferralUrlByChainId(chainId)}/select-referral-code`, {
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

export function getReferralCodeExists(
  chainId: number,
  code: string
): Promise<ValidatedResponseI<{ code: string; traderRebatePerc: number }[]>> {
  return fetchUrl(`code-info?code=${code}`, chainId);
}

export function getIsAgency(chainId: number, address: string): Promise<ValidatedResponseI<{ isAgency: boolean }>> {
  return fetchUrl(`is-agency?addr=${address}`, chainId);
}

export function getReferralVolume(chainId: number, address: string): Promise<ValidatedResponseI<ReferralVolumeI[]>> {
  return fetchUrl(`referral-volume?referrerAddr=${address}`, chainId);
}

export function getEarnedRebate(
  chainId: number,
  address: string,
  rebateType: RebateTypeE
): Promise<ValidatedResponseI<EarnedRebateI[]>> {
  const params = new URLSearchParams();
  params.append(`${rebateType}Addr`, address);

  return fetchUrl(`earned-rebate?${params}`, chainId);
}

export function getReferralCodes(chainId: number, address: string): Promise<ValidatedResponseI<ReferralCodeI>> {
  return fetchUrl(`my-referral-codes?addr=${address}`, chainId);
}

export function getOpenTraderRebate(
  chainId: number,
  traderAddr: string
): Promise<ValidatedResponseI<OpenTraderRebateI[]>> {
  return fetchUrl(`open-trader-rebate?addr=${traderAddr}`, chainId);
}

export function getReferralRebate(
  chainId: number,
  address: string
): Promise<ValidatedResponseI<{ percentageCut: number }>> {
  return fetchUrl(`referral-rebate?referrerAddr=${address}`, chainId);
}

export function getAgencyRebate(chainId: number): Promise<ValidatedResponseI<{ percentageCut: number }>> {
  return fetchUrl(`agency-rebate`, chainId);
}
