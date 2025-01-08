import { PERIOD_OF_1_DAY, PERIOD_OF_1_SECOND } from 'appConstants';

export function getLiquidityLockedPeriod(chainId: number | undefined) {
  return chainId === 80084 ? PERIOD_OF_1_SECOND : PERIOD_OF_1_DAY;
}
