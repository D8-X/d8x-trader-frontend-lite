import { config } from 'config';

export function isEnabledChain(chainId: number | undefined) {
  if (chainId === undefined) {
    return false;
  }
  return config.enabledChains.includes(chainId);
}
