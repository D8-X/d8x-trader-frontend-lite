import { MaxUint256 } from '@ethersproject/constants';
import { waitForTransaction } from '@wagmi/core';
import { parseUnits } from 'viem';
import type { WalletClient, Account, Transport } from 'viem';
import { type Chain, erc20ABI } from 'wagmi';

import type { AddressT } from 'types/types';

export function approveMarginToken(
  walletClient: WalletClient<Transport, Chain, Account>,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number,
  allowance?: bigint | number | string | undefined | boolean
) {
  if (allowance) {
    const minAmountBN = parseUnits((4 * minAmount).toFixed(decimals), decimals);
    if (allowance > minAmountBN) {
      return Promise.resolve({ hash: '0x' });
    } else {
      const account = walletClient.account?.address;
      if (!account) {
        throw new Error('account not connected');
      }
      return walletClient
        .writeContract({
          chain: walletClient.chain,
          address: marginTokenAddr as AddressT,
          abi: erc20ABI,
          functionName: 'approve',
          args: [proxyAddr as AddressT, BigInt(MaxUint256.toString())],
          gas: BigInt(100_000),
          account: account,
        })
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
