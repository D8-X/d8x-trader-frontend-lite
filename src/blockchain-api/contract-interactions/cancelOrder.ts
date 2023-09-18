import { LOB_ABI } from '@d8x/perpetuals-sdk';
import { type CancelOrderResponseI } from 'types/types';
import { type Address, type WalletClient } from 'viem';

export function cancelOrder(
  walletClient: WalletClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.OrderBookAddr as Address,
      abi: LOB_ABI,
      functionName: 'cancelOrder',
      args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      value: BigInt(data.priceUpdate.updateFee),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
