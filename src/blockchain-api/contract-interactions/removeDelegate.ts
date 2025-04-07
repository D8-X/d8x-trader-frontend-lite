import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { type Config, getBalance } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import {
  type Address,
  type WalletClient,
  type EstimateContractGasParameters,
  PrivateKeyAccount,
  zeroAddress,
} from 'viem';
import { estimateGas, estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { MethodE } from 'types/enums';

export async function removeDelegate(
  walletClient: WalletClient,
  delegateAccount: PrivateKeyAccount,
  proxyAddr: Address,
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>
): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  // remove delegate
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [zeroAddress, 0],
    account,
    ...feesPerGas,
  };
  const gasLimitRemove = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    ...estimateParams,
    account: account,
    chain: walletClient.chain,
    gas: gasLimitRemove,
  };

  const tx = await walletClient.writeContract(baseParams);

  // reclaim delegate funds
  if (account !== delegateAccount.address) {
    const { value: balance } = await getBalance(wagmiConfig, { address: delegateAccount.address });
    const gasLimit = await estimateGas(walletClient, {
      to: account,
      value: 1n,
      account: delegateAccount,
      ...feesPerGas,
    }).catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
    const gasPrice =
      feesPerGas?.gasPrice ?? 0n + feesPerGas?.maxFeePerGas ?? 0n + feesPerGas?.maxPriorityFeePerGas ?? 0;
    if (gasLimit && 2n * gasLimit * gasPrice < balance) {
      await sendTransactionAsync({
        account: delegateAccount,
        to: account,
        value: balance - 2n * gasLimit * gasPrice,
        chainId: walletClient.chain?.id,
      });
    }
  }
  return { hash: tx };
}
