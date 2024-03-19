import { readContract, waitForTransactionReceipt } from '@wagmi/core';
import { type Account, type Address, type Chain, erc20Abi, parseUnits, type Transport, type WalletClient } from 'viem';

import { MaxUint256 } from 'appConstants';
import { MethodE } from 'types/enums';

import { getGasPrice } from './getGasPrice';
import { getGasLimit } from './getGasLimit';
import { wagmiConfig } from './wagmi/wagmiClient';

export async function approveMarginToken(
  walletClient: WalletClient<Transport, Chain, Account>,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number
) {
  const minAmountBN = parseUnits((1.05 * minAmount).toFixed(decimals), decimals);
  const allowance = await readContract(wagmiConfig, {
    address: marginTokenAddr as Address,
    abi: erc20Abi,
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
    const gasLimit = getGasLimit({ chainId: walletClient.chain?.id, method: MethodE.Approve });
    return walletClient
      .writeContract({
        chain: walletClient.chain,
        address: marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [proxyAddr as Address, BigInt(MaxUint256)],
        gas: gasLimit,
        gasPrice: gasPrice,
        account: account,
      })
      .then((tx) => {
        waitForTransactionReceipt(wagmiConfig, {
          hash: tx,
          timeout: 30_000,
        }).then(() => ({ hash: tx }));
      });
  }
}
