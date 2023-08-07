import { CollateralChangeResponseI, AddressT } from 'types/types';
import { PublicClient, WalletClient } from 'viem';

export function deposit(publicClient: PublicClient, walletClient: WalletClient, data: CollateralChangeResponseI): Promise<{hash: AddressT}> {
  return publicClient.simulateContract({
    address: data.proxyAddr as AddressT,
    abi: [data.abi],
    functionName: 'deposit',
    args: [data.perpId, +data.amountHex, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
    gas: BigInt(1_000_000),
    value: BigInt(data.priceUpdate.updateFee)
  }).then(({request}) => walletClient.writeContract(request)).then((tx)=> ({hash : tx}));
}
