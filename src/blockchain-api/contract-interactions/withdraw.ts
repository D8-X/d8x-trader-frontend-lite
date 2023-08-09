import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { CollateralChangeResponseI, AddressT } from 'types/types';
import { WalletClient } from 'viem';

export function withdraw(walletClient: WalletClient, data: CollateralChangeResponseI): Promise<{ hash: AddressT }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.proxyAddr as AddressT,
      abi: PROXY_ABI,
      functionName: 'withdraw',
      args: [data.perpId, +data.amountHex, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      value: BigInt(data.priceUpdate.updateFee),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
