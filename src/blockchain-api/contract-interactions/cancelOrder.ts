import { LOB_ABI } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
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
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);
  const estimateParams: EstimateContractGasParameters = {
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'cancelOrder',
    args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
    value: BigInt(data.priceUpdate.updateFee),
    nonce,
    account: walletClient.account,
    ...feesPerGas,
  };
  const gas = await estimateContractGas(walletClient, estimateParams)
    .then((g) => (g * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
  const txParams = {
    ...estimateParams,
    chain: walletClient.chain,
    account: walletClient.account,
    gas,
  };
  return walletClient.writeContract(txParams).then((tx) => ({ hash: tx }));
}
