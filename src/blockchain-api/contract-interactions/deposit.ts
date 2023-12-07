import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';

import type { CollateralChangeResponseI } from 'types/types';

export function deposit(
  walletClient: WalletClient,
  traderAddr: Address,
  data: CollateralChangeResponseI
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.proxyAddr as Address,
      abi: PROXY_ABI,
      functionName: 'deposit',
      args: [data.perpId, traderAddr, +data.amountHex, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      value: BigInt(data.priceUpdate.updateFee),
      account: walletClient.account,
    })
    .then((tx) => ({ hash: tx }));
}
