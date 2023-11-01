import { LOB_ABI, TraderInterface, TypeSafeOrder } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';
import { type OrderDigestI } from 'types/types';

export function postOrder(
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI,
  doChain = true
): Promise<{ hash: Address }> {
  let orders: TypeSafeOrder[];
  if (doChain) {
    orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
      TraderInterface.fromClientOrderToTypeSafeOrder
    );
  } else {
    orders = data.SCOrders.map((o) => TraderInterface.fromSmartContratOrderToClientOrder(o)).map(
      TraderInterface.fromClientOrderToTypeSafeOrder
    );
  }
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
      gas: BigInt(600_000 + (orders.length - 1) * 400_000),
      account: walletClient.account,
    })
    .then((tx) => ({ hash: tx }));
}
