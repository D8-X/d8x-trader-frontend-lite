import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';
import { type OrderDigestI } from 'types/types';
import { getGasPrice } from 'blockchain-api/getGasPrice';

export async function postOrder(
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI,
  doChain = true
): Promise<{ hash: Address }> {
  let orders: never[];
  if (doChain) {
    orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
      TraderInterface.fromClientOrderToTypeSafeOrder
    ) as never[];
  } else {
    orders = data.SCOrders.map((o) => TraderInterface.fromSmartContratOrderToClientOrder(o)).map(
      TraderInterface.fromClientOrderToTypeSafeOrder
    ) as never[];
  }
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.OrderBookAddr as Address,
      abi: LOB_ABI,
      functionName: 'postOrders',
      args: [orders, signatures],
      account: walletClient.account,
      gasPrice: gasPrice,
    })
    .then((tx) => ({ hash: tx }));
}
