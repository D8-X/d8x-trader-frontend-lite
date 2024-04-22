import { LOB_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { type CancelOrderResponseI } from 'types/types';
import { type Address, type WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

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
  const params = {
    chain: walletClient.chain,
    address: data.OrderBookAddr as Address,
    abi: LOB_ABI,
    functionName: 'cancelOrder',
    args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
    gasPrice: await getGasPrice(walletClient.chain?.id),
    value: BigInt(data.priceUpdate.updateFee),
    account: walletClient.account,
    nonce,
  };
  const fallbackGasLimit = getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact });
  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => fallbackGasLimit);
  return walletClient.writeContract({ ...params, gas: gasLimit }).then((tx) => ({ hash: tx }));
}
