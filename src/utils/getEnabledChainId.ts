import { config } from 'config';

import { isEnabledChain } from './isEnabledChain';

export function getEnabledChainId(chainId: number | undefined): number {
  if (isEnabledChain(chainId)) {
    return chainId;
  }
  return config.enabledChains[0];
}
