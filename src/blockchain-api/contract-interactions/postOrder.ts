import { OrderDigestI, AddressT } from 'types/types';
import { TraderInterface } from '@d8x/perpetuals-sdk';
import { PublicClient } from 'viem';
import { WalletClient } from 'wagmi';

export function postOrder(publicClient: PublicClient, walletClient: WalletClient, signatures: string[], data: OrderDigestI): Promise<{hash: AddressT}> {
  return publicClient.simulateContract({
    address: data.OrderBookAddr as AddressT,
    abi: typeof data.abi === 'string' ? [data.abi] : data.abi,
    functionName: signatures.length > 1 ? 'postOrders' : 'postOrder',
    args: [TraderInterface.chainOrders(data.SCOrders, data.orderIds), signatures],
    gas: BigInt(2_000_000),
  }).then(({request}) => walletClient.writeContract(request)).then((tx)=> ({hash : tx}));
}
