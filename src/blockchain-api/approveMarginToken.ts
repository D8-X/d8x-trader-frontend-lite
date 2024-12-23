import { readContract, waitForTransactionReceipt } from '@wagmi/core';
import {
  type Address,
  erc20Abi,
  type EstimateContractGasParameters,
  parseUnits,
  type WalletClient,
  type WriteContractParameters,
} from 'viem';
import { estimateContractGas } from 'viem/actions';

import { MaxUint256 } from 'appConstants';

import { getGasPrice } from './getGasPrice';
import { wagmiConfig } from './wagmi/wagmiClient';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';
import { MULTISIG_ADDRESS_TIMEOUT, NORMAL_ADDRESS_TIMEOUT } from './constants';

interface ApproveMarginTokenPropsI {
  walletClient: WalletClient;
  settleTokenAddr: string;
  isMultisigAddress: boolean | null;
  proxyAddr: string;
  minAmount: number;
  decimals: number;
}

export async function approveMarginToken({
  walletClient,
  settleTokenAddr,
  isMultisigAddress,
  proxyAddr,
  minAmount,
  decimals,
}: ApproveMarginTokenPropsI) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const minAmountBN = parseUnits((1.05 * minAmount).toFixed(decimals), decimals);

  const allowance = await readContract(wagmiConfig, {
    address: settleTokenAddr as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [walletClient.account.address, proxyAddr as Address],
  });

  if (allowance >= minAmountBN) {
    return null;
  } else {
    const account = walletClient.account;
    if (!account) {
      throw new Error('account not connected');
    }
    const gasPrice = await getGasPrice(walletClient.chain?.id);

    const estimateParams: EstimateContractGasParameters = {
      address: settleTokenAddr as Address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [proxyAddr as Address, BigInt(MaxUint256)],
      gasPrice: gasPrice,
      account: account,
    };
    const gasLimit = await estimateContractGas(walletClient, estimateParams).catch(() =>
      getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
    );

    const writeParams: WriteContractParameters = {
      ...estimateParams,
      chain: walletClient.chain,
      account: account,
      gas: gasLimit,
    };
    return walletClient.writeContract(writeParams).then(async (tx) => {
      await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
      });
      return { hash: tx };
    });
  }
}
