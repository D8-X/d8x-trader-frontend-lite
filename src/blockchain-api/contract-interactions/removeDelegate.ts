import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';

export function removeDelegate(walletClient: WalletClient, proxyAddr: Address): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: proxyAddr as Address,
      abi: PROXY_ABI,
      functionName: 'removeDelegate',
      args: [],
      gas: BigInt(1_000_000),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
