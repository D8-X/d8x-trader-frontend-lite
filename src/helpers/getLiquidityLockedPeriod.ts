import { PERIOD_OF_1_DAY, PERIOD_OF_1_MINUTE } from 'appConstants';

export function getLiquidityLockedPeriod(chainId: number | undefined) {
  return chainId === 80085 ? PERIOD_OF_1_MINUTE : PERIOD_OF_1_DAY;
}
