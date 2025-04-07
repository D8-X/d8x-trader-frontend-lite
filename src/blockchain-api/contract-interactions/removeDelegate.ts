import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { type Config, getBalance } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import {
  type Address,
  type WalletClient,
  type WriteContractParameters,
  type EstimateContractGasParameters,
  PrivateKeyAccount,
  zeroAddress,
} from 'viem';
import { estimateGas, estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
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
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [zeroAddress, 0],
    gasPrice,
    account,
  };
  const gasLimitRemove = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [zeroAddress, 0],
    account: account,
    chain: walletClient.chain,
    gas: gasLimitRemove,
  };

  // Determine which transaction type to use
  if (feesPerGas && 'maxFeePerGas' in feesPerGas && 'maxPriorityFeePerGas' in feesPerGas) {
    // EIP-1559 transaction
    const eip1559Params: WriteContractParameters = {
      ...baseParams,
      maxFeePerGas: feesPerGas.maxFeePerGas,
      maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
    };

    const tx = await walletClient.writeContract(eip1559Params);

    // reclaim delegate funds
    if (account !== delegateAccount.address) {
      const { value: balance } = await getBalance(wagmiConfig, { address: delegateAccount.address });
      const gasLimit = await estimateGas(walletClient, {
        to: account,
        value: 1n,
        account: delegateAccount,
        gasPrice,
      }).catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

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
  } else {
    // Legacy transaction
    const legacyParams: WriteContractParameters = {
      ...baseParams,
      gasPrice,
    };

    const tx = await walletClient.writeContract(legacyParams);
    // reclaim delegate funds
    if (account !== delegateAccount.address) {
      const { value: balance } = await getBalance(wagmiConfig, { address: delegateAccount.address });
      const gasLimit = await estimateGas(walletClient, {
        to: account,
        value: 1n,
        account: delegateAccount,
        gasPrice,
      }).catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

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
}
