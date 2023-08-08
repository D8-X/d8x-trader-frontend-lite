import { OrderDigestI, AddressT } from 'types/types';
import { PublicClient, parseAbi } from 'viem';
import { WalletClient } from 'wagmi';
import { TraderInterface } from '@d8x/perpetuals-sdk';

export function postOrder(
  publicClient: PublicClient,
  walletClient: WalletClient,
  signatures: string[],
  data: OrderDigestI
): Promise<{ hash: AddressT }> {
  const abi = typeof data.abi === 'string' ? [data.abi] : data.abi;
  return publicClient
    .simulateContract({
      address: data.OrderBookAddr as AddressT,
      abi: parseAbi(abi),
      functionName: 'postOrders',
      args: [TraderInterface.chainOrders(data.SCOrders, data.orderIds), signatures],
      gas: BigInt(2_000_000),
    })
    .then(({ request }) => walletClient.writeContract(request))
    .then((tx) => ({ hash: tx }));
}
