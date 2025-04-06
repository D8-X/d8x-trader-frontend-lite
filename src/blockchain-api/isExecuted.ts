import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { readContracts } from '@wagmi/core';
import { type Address } from 'viem';
import { wagmiConfig } from './wagmi/wagmiClient';

export async function isExecuted(proxyAddr: Address, orderId: string) {
  const manager = { address: proxyAddr, abi: PROXY_ABI } as const;
  const res = await readContracts(wagmiConfig, {
    contracts: [
      { ...manager, functionName: 'isOrderExecuted', args: [orderId] },

      { ...manager, functionName: 'isOrderCanceled', args: [orderId] },
    ],
    allowFailure: false,
  });
  return { isExecuted: res[0] as unknown as boolean, isCancelled: res[1] as unknown as boolean };
}
