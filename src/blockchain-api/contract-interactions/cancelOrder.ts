import { LOB_ABI } from '@d8x/perpetuals-sdk';
import { CancelOrderResponseI, AddressT } from 'types/types';
import { WalletClient } from 'viem';

export async function cancelOrder(
  walletClient: WalletClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{ hash: AddressT }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.OrderBookAddr as AddressT,
      abi: LOB_ABI,
      functionName: 'cancelOrder',
      args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      value: BigInt(data.priceUpdate.updateFee),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
