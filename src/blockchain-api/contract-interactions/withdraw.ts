import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';

import type { CollateralChangeResponseI } from 'types/types';
import { getGasPrice } from 'blockchain-api/getGasPrice';

export async function withdraw(
  walletClient: WalletClient,
  traderAddr: Address,
  data: CollateralChangeResponseI
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: data.proxyAddr as Address,
      abi: PROXY_ABI,
      functionName: 'withdraw',
      args: [data.perpId, traderAddr, +data.amountHex, data.priceUpdate.updateData, data.priceUpdate.publishTimes],
      gas: BigInt(1_000_000),
      gasPrice: gasPrice,
      value: BigInt(data.priceUpdate.updateFee),
      account: walletClient.account,
    })
    .then((tx) => ({ hash: tx }));
}
