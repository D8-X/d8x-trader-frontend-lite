import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { CollateralChangeResponseI, AddressT } from 'types/types';
import { PublicClient, WalletClient } from 'viem';

export function deposit(
  publicClient: PublicClient,
  walletClient: WalletClient,
  data: CollateralChangeResponseI
): Promise<{ hash: AddressT }> {
  return publicClient
    .simulateContract({
      address: data.proxyAddr as AddressT,
      abi: PROXY_ABI,
      functionName: 'deposit',
      args: [data.perpId, +data.amountHex, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      value: BigInt(data.priceUpdate.updateFee),
      account: walletClient.account,
    })
    .then(({ request }) => walletClient.writeContract(request))
    .then((tx) => ({ hash: tx }));
}
