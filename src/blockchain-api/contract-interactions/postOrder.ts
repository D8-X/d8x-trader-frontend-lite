import { OrderDigestI, AddressT } from 'types/types';
import { PublicClient } from 'viem';
import { WalletClient } from 'wagmi';
import { LOB_ABI, TraderInterface } from '@d8x/perpetuals-sdk';

export function postOrder(
  publicClient: PublicClient,
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI
): Promise<{ hash: AddressT }> {
  const orders = TraderInterface.chainOrders(data.SCOrders, data.orderIds).map(
    TraderInterface.fromClientOrderToTypeSafeOrder
  );
  return publicClient
    .simulateContract({
      address: data.OrderBookAddr as AddressT,
      abi: LOB_ABI,
      functionName: 'postOrders',
      args: [orders, signatures],
      gas: BigInt(2_000_000),
      account: walletClient.account,
    })
    .then(({ request }) => walletClient.writeContract(request))
    .then((tx) => ({ hash: tx }));
}
