import { LOB_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { type CancelOrderResponseI } from 'types/types';
import { type Address, type WalletClient } from 'viem';

export async function cancelOrder(
  walletClient: WalletClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.OrderBookAddr as Address,
      abi: LOB_ABI,
      functionName: 'cancelOrder',
      args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gasPrice: gasPrice,
      value: BigInt(data.priceUpdate.updateFee),
      account: walletClient.account,
    })
    .then((tx) => ({ hash: tx }));
}
