import { LOB_ABI } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { MethodE } from 'types/enums';
import { type CancelOrderResponseI } from 'types/types';

export async function cancelOrder(
  walletClient: WalletClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string,
  nonce?: number
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const estimateParams: EstimateContractGasParameters = {
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'cancelOrder',
    args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
    gasPrice: await getGasPrice(walletClient.chain?.id),
    value: BigInt(data.priceUpdate.updateFee),
    nonce,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'cancelOrder',
    args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
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

    return walletClient.writeContract(eip1559Params).then((tx) => ({ hash: tx }));
  } else {
    // Legacy transaction
    const legacyParams: WriteContractParameters = {
      ...baseParams,
      gasPrice,
    };

    return walletClient.writeContract(legacyParams).then((tx) => ({ hash: tx }));
  }
}
