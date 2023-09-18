import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { zeroAddress, type Address, type PublicClient } from 'viem';

export async function hasDelegate(
  publicClient: PublicClient,
  proxyAddr: Address,
  traderAddr: Address
): Promise<boolean> {
  const res = await publicClient.readContract({
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'isDelegate',
    args: [traderAddr, zeroAddress],
  });
  return !(res[0] as boolean);
}
