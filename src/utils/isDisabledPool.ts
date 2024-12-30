import { config } from 'config';

export function isDisabledPool(chainId: number | undefined, poolId: number | undefined): chainId is number {
  if (chainId === undefined || poolId === undefined || !config.disabledPools[chainId]) {
    return false;
  }
  return config.disabledPools[chainId].includes(poolId);
}
