import { waitForTransactionReceipt } from '@wagmi/core';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasPrice } from '../getGasPrice';
import { wagmiConfig } from '../wagmi/wagmiClient';
import { getGasLimit } from 'blockchain-api/getGasLimit';
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

  const writeParams: WriteContractParameters = {
    ...estimateRegisterParams,
    chain: walletClient.chain,
    account: walletClient.account,
    gas: gasLimit,
  };
  return walletClient.writeContract(writeParams).then(async (tx) => {
    if (shouldConfirm) {
      await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
      });
    }
    return { hash: tx };
  });
}
