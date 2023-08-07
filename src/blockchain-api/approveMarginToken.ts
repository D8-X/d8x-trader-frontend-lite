import { Signer } from '@ethersproject/abstract-signer';
import { parseUnits } from '@ethersproject/units';
import { MaxUint256 } from '@ethersproject/constants';

import { erc20ABI } from 'wagmi';
import { prepareWriteContract, writeContract } from '@wagmi/core';
import { decNToFloat } from '@d8x/perpetuals-sdk';

import type { AddressT } from 'types/types';

export function approveMarginToken(
  signer: Signer,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number,
  allowance?: bigint // BigNumber => BigInt
) {
  if (allowance) {
    const amount = MaxUint256;
    const minAmountBN = parseUnits((4 * minAmount).toFixed(decimals), decimals);
    console.log('allowance =', decNToFloat(allowance, decimals), 'minAmount =', minAmount);
    if (allowance.gt(minAmountBN)) {
      return Promise.resolve(null);
    } else {
      return prepareWriteContract({
        address: marginTokenAddr as AddressT,
        abi: erc20ABI,
        functionName: 'approve',
        args: [proxyAddr as AddressT, amount],
        signer,
      }).then((config) => writeContract(config));
    }
  } else {
    return Promise.resolve(null);
  }
}
