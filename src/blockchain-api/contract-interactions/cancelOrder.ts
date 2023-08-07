
import { CancelOrderResponseI, AddressT } from 'types/types';
import { PublicClient, WalletClient} from 'viem';

export async function cancelOrder(
  publicClient: PublicClient,
  walletClient: WalletClient,
  signature: string,
  data: CancelOrderResponseI,
  orderId: string
): Promise<{hash: AddressT}> {
  return publicClient.simulateContract({
      address: data.OrderBookAddr as AddressT,
      abi: [data.abi],
      functionName: 'cancelOrder',
      args: [orderId, signature, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      value: BigInt(data.priceUpdate.updateFee)
    }).then(({request}) => walletClient.writeContract(request)).then((tx)=> ({hash : tx}));
}
