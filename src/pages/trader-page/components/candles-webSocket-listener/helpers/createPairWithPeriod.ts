import { TvChartPeriodE } from 'types/enums';
import { PerpetualI } from 'types/types';

export function createPairWithPeriod(perpetual: PerpetualI, period: TvChartPeriodE) {
  return `${perpetual.baseCurrency}-${perpetual.quoteCurrency}:${period}`.toLowerCase();
}
