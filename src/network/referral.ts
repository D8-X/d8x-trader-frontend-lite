import { ReferralCodeSigner } from '@d8x/perpetuals-sdk';
import type { APIReferralCodeSelectionPayload, APIReferralCodePayload } from '@d8x/perpetuals-sdk';
import type { Account, Transport } from 'viem';
import type { Chain, WalletClient } from 'wagmi';

import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import type {
  AddressT,
  EarnedRebateI,
  OpenTraderRebateI,
  ReferralCodeI,
  ReferralVolumeI,
  ValidatedResponseI,
} from 'types/types';
import { RebateTypeE, RequestMethodE } from 'types/enums';

function getReferralUrlByChainId(chainId: number) {
  return config.referralUrl[`${chainId}`] || config.referralUrl.default;
}

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
    walletClient.signMessage({ message: { raw: x as AddressT | Uint8Array } }) as Promise<string>;
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
    walletClient.signMessage({ message: { raw: x as AddressT | Uint8Array } }) as Promise<string>;
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
  return fetch(`${getReferralUrlByChainId(chainId)}/code-info?code=${code}`, getRequestOptions()).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export function getIsAgency(chainId: number, address: string): Promise<ValidatedResponseI<{ isAgency: boolean }>> {
  return fetch(`${getReferralUrlByChainId(chainId)}/is-agency?addr=${address}`, getRequestOptions()).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export function getReferralVolume(chainId: number, address: string): Promise<ValidatedResponseI<ReferralVolumeI[]>> {
  return fetch(`${getReferralUrlByChainId(chainId)}/referral-volume?referrerAddr=${address}`, getRequestOptions()).then(
    (data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    }
  );
}

export function getEarnedRebate(
  chainId: number,
  address: string,
  rebateType: RebateTypeE
): Promise<ValidatedResponseI<EarnedRebateI[]>> {
  const params = new URLSearchParams();
  params.append(`${rebateType}Addr`, address);

  return fetch(`${getReferralUrlByChainId(chainId)}/earned-rebate?${params}`, getRequestOptions()).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}

export function getReferralCodes(chainId: number, address: string): Promise<ValidatedResponseI<ReferralCodeI>> {
  return fetch(`${getReferralUrlByChainId(chainId)}/my-referral-codes?addr=${address}`, getRequestOptions()).then(
    (data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    }
  );
}

export function getOpenTraderRebate(
  chainId: number,
  traderAddr: string
): Promise<ValidatedResponseI<OpenTraderRebateI[]>> {
  return fetch(`${getReferralUrlByChainId(chainId)}/open-trader-rebate?addr=${traderAddr}`, getRequestOptions()).then(
    (data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    }
  );
}

export function getReferralRebate(
  chainId: number,
  address: string
): Promise<ValidatedResponseI<{ percentageCut: number }>> {
  return fetch(`${getReferralUrlByChainId(chainId)}/referral-rebate?referrerAddr=${address}`, getRequestOptions()).then(
    (data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json();
    }
  );
}

export function getAgencyRebate(chainId: number): Promise<ValidatedResponseI<{ percentageCut: number }>> {
  return fetch(`${getReferralUrlByChainId(chainId)}/agency-rebate`, getRequestOptions()).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
    return data.json();
  });
}
