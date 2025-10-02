import { waitForTransactionReceipt } from '@wagmi/core';
import type { Address, EstimateContractGasParameters, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { SmartAccountClient } from 'permissionless';
import { MethodE } from 'types/enums';
import { flatTokenAbi } from '../abi/flatTokenAbi';
import { NORMAL_ADDRESS_TIMEOUT } from '../constants';
import { wagmiConfig } from '../wagmi/wagmiClient';

interface RegisterFlatTokenPropsI {
  walletClient: WalletClient | SmartAccountClient;
  flatTokenAddr: Address;
  userTokenAddr: Address;
  feesPerGas?:
    | {
        maxFeePerGas: bigint;
        maxPriorityFeePerGas: bigint;
        gasPrice: undefined;
      }
    | {
        gasPrice: bigint;
        maxFeePerGas: undefined;
        maxPriorityFeePerGas: undefined;
      };
  confirm?: boolean;
}

export async function registerFlatToken({
  walletClient,
  flatTokenAddr,
  userTokenAddr,
  confirm,
}: RegisterFlatTokenPropsI) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);
  const shouldConfirm = confirm ?? true;
  const estimateRegisterParams: EstimateContractGasParameters = {
    address: flatTokenAddr,
    abi: flatTokenAbi,
    functionName: 'registerAccount',
    args: [userTokenAddr],
    account: walletClient.account,
    ...feesPerGas,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateRegisterParams).catch(() =>
    getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
  );
  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    ...estimateRegisterParams,
    account: walletClient.account || null,
    chain: walletClient.chain,
    gas: gasLimit,
  };
  return walletClient.writeContract(baseParams).then(async (tx) => {
    if (shouldConfirm) {
      await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        timeout: NORMAL_ADDRESS_TIMEOUT,
      });
    }
    return { hash: tx };
  });
}
