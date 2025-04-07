import { waitForTransactionReceipt } from '@wagmi/core';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasPrice } from '../getGasPrice';
import { wagmiConfig } from '../wagmi/wagmiClient';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { MethodE } from 'types/enums';
import { MULTISIG_ADDRESS_TIMEOUT, NORMAL_ADDRESS_TIMEOUT } from '../constants';
import { flatTokenAbi } from './flatTokenAbi';

interface RegisterFlatTokenPropsI {
  walletClient: WalletClient;
  flatTokenAddr: Address;
  userTokenAddr: Address;
  isMultisigAddress: boolean | null;
  gasPrice?: bigint;
  confirm?: boolean;
}

export async function registerFlatToken({
  walletClient,
  flatTokenAddr,
  userTokenAddr,
  isMultisigAddress,
  gasPrice,
  confirm,
}: RegisterFlatTokenPropsI) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const gasPx = gasPrice ?? (await getGasPrice(walletClient.chain?.id));
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const shouldConfirm = confirm ?? true;
  const estimateRegisterParams: EstimateContractGasParameters = {
    address: flatTokenAddr,
    abi: flatTokenAbi,
    functionName: 'registerAccount',
    args: [userTokenAddr],
    gasPrice: gasPx,
    account: walletClient.account,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateRegisterParams).catch(() =>
    getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
  );
  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    address: flatTokenAddr,
    abi: flatTokenAbi,
    functionName: 'registerAccount',
    args: [userTokenAddr],
    account: walletClient.account || null,
    chain: walletClient.chain,
    gas: gasLimit,
  };

  // Determine which transaction type to use
  if (feesPerGas && 'maxFeePerGas' in feesPerGas && 'maxPriorityFeePerGas' in feesPerGas) {
    // EIP-1559 transaction
    const eip1559Params: WriteContractParameters = {
      ...baseParams,
      maxFeePerGas: feesPerGas.maxFeePerGas,
      maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
    };

    return walletClient.writeContract(eip1559Params).then(async (tx) => {
      if (shouldConfirm) {
        await waitForTransactionReceipt(wagmiConfig, {
          hash: tx,
          timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
        });
      }
      return { hash: tx };
    });
  } else {
    // Legacy transaction
    const legacyParams: WriteContractParameters = {
      ...baseParams,
      gasPrice,
    };

    return walletClient.writeContract(legacyParams).then(async (tx) => {
      if (shouldConfirm) {
        await waitForTransactionReceipt(wagmiConfig, {
          hash: tx,
          timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
        });
      }
      return { hash: tx };
    });
  }
}
