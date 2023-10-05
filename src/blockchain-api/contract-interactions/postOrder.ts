import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';
import { type OrderDigestI } from 'types/types';

export function postOrder(
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI
): Promise<{ hash: Address }> {
  const orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
    TraderInterface.fromClientOrderToTypeSafeOrder
  );
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.OrderBookAddr as Address,
      abi: LOB_ABI,
      functionName: 'postOrders',
      args: [orders, signatures],
      gas: BigInt(2_000_000),
      account: walletClient.account,
    })
    .then((tx) => ({ hash: tx }));
}
