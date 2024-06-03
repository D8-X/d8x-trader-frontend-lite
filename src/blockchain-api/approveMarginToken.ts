import { getTransactionCount, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { type Address, erc20Abi, parseUnits, type WalletClient, type WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { MaxUint256 } from 'appConstants';

import { getGasPrice } from './getGasPrice';
import { wagmiConfig } from './wagmi/wagmiClient';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

export async function approveMarginToken(
  walletClient: WalletClient,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number
) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const minAmountBN = parseUnits((1.05 * minAmount).toFixed(decimals), decimals);
  const allowance = await readContract(wagmiConfig, {
    address: marginTokenAddr as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [walletClient.account.address, proxyAddr as Address],
  });

  if (allowance > minAmountBN) {
    return { nonce: undefined };
  } else {
    const account = walletClient.account;
    if (!account) {
      throw new Error('account not connected');
    }
    const nonce = await getTransactionCount(wagmiConfig, { address: walletClient.account.address });
    const gasPrice = await getGasPrice(walletClient.chain?.id);
    const params: WriteContractParameters = {
      chain: walletClient.chain,
      address: marginTokenAddr as Address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [proxyAddr as Address, BigInt(MaxUint256)],
      gasPrice: gasPrice,
      account: account,
    };

    const gasLimit = await estimateContractGas(walletClient, params).catch(() =>
      getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
    );

    return walletClient.writeContract({ ...params, gas: gasLimit, nonce }).then((tx) => {
      return waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        timeout: 30_000,
      }).then(() => ({ hash: tx, nonce: nonce + 1 }));
    });
  }
}
