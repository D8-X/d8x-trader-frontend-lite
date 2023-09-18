import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient } from 'viem';

export function setDelegate(
  walletClient: WalletClient,
  proxyAddr: Address,
  delegateAddr: Address
): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: proxyAddr as Address,
      abi: PROXY_ABI,
      functionName: 'setDelegate',
      args: [delegateAddr],
      gas: BigInt(1_000_000),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
