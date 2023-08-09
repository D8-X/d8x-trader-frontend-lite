import { erc20ABI } from 'wagmi';
import { MaxUint256 } from '@ethersproject/constants';

import type { AddressT } from 'types/types';
import { PublicClient, WalletClient, parseUnits } from 'viem';
import { waitForTransaction } from '@wagmi/core';

export function approveMarginToken(
  publicClient: PublicClient,
  walletClient: WalletClient,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number,
  allowance?: bigint
) {
  if (allowance) {
    const minAmountBN = parseUnits((4 * minAmount).toFixed(decimals), decimals);
    if (allowance > minAmountBN) {
      return Promise.resolve({ hash: '0x' });
    } else {
      return publicClient
        .simulateContract({
          address: marginTokenAddr as AddressT,
          abi: erc20ABI,
          functionName: 'approve',
          args: [proxyAddr as AddressT, BigInt(MaxUint256.toString())],
          gas: BigInt(100_000),
        })
        .then(({ request }) => walletClient.writeContract(request))
        .then((tx) => {
          waitForTransaction({
            hash: tx,
            timeout: 30_000,
          }).then(() => ({ hash: tx }));
        });
    }
  } else {
    return Promise.resolve(null);
  }
}
