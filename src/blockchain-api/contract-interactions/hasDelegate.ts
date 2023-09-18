import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Address, PublicClient } from 'viem';

export async function hasDelegate(
  publicClient: PublicClient,
  proxyAddr: Address,
  traderAddr: Address
): Promise<boolean> {
  const res = await publicClient.readContract({
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'hasDelegate',
    args: [traderAddr],
  });
  return res[0] as boolean;
}
