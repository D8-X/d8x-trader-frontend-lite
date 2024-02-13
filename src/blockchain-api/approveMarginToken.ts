import { readContract, waitForTransaction } from '@wagmi/core';
import type { Account, Address, Transport, WalletClient } from 'viem';
import { parseUnits } from 'viem';
import { erc20ABI, type Chain } from 'wagmi';

import { MaxUint256 } from 'app-constants';
import { getGasPrice } from './getGasPrice';
import { getGasLimit } from './getGasLimit';

export async function approveMarginToken(
  walletClient: WalletClient<Transport, Chain, Account>,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number
) {
  const minAmountBN = parseUnits((1.05 * minAmount).toFixed(decimals), decimals);
  const allowance = await readContract({
    address: marginTokenAddr as Address,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [walletClient.account.address, proxyAddr as Address],
  });

  if (allowance > minAmountBN) {
    return null;
  } else {
    const account = walletClient.account?.address;
    if (!account) {
      throw new Error('account not connected');
    }
    const gasPrice = await getGasPrice(walletClient.chain?.id);
    const gasLimit = getGasLimit({ chainId: walletClient.chain?.id, method: 'approve' });
    return walletClient
      .writeContract({
        chain: walletClient.chain,
        address: marginTokenAddr as Address,
        abi: erc20ABI,
        functionName: 'approve',
        args: [proxyAddr as Address, BigInt(MaxUint256)],
        gas: gasLimit,
        gasPrice: gasPrice,
        account: account,
      })
      .then((tx) => {
        waitForTransaction({
          hash: tx,
          timeout: 30_000,
        }).then(() => ({ hash: tx }));
      });
  }
}
