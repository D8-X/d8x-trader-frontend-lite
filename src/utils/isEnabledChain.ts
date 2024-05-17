import { config } from 'config';

export function isEnabledChain(chainId?: number) {
  if (chainId === undefined) {
    return false;
  }
  return config.enabledChains.includes(chainId);
}
