import { config } from 'config';

export function isEnabledChain(chainId: number | undefined): chainId is number {
  if (chainId === undefined) {
    return false;
  }
  return config.enabledChains.includes(chainId);
}
