import { config } from 'config';

import { isEnabledChain } from './isEnabledChain';

export function getEnabledChainId(chainId: number | undefined, locationHash: string): number {
  const chainIdFromUrl = parseInt(locationHash.split('__')[1]?.split('=')[1], 10);

  if (isEnabledChain(chainId)) {
    return chainId;
  }
  if (chainIdFromUrl && isEnabledChain(chainIdFromUrl)) {
    return chainIdFromUrl;
  }
  return config.enabledChains[0];
}
