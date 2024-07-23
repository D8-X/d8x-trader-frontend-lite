import { TakeProfitE } from '../types/enums';

const mapTakeProfit: Record<TakeProfitE, number> = {
  [TakeProfitE.None]: 0,
  [TakeProfitE['5%']]: 0.05,
  [TakeProfitE['50%']]: 0.5,
  [TakeProfitE['100%']]: 1,
  [TakeProfitE['500%']]: 5,
};

export function mapTakeProfitToNumber(takeProfit: TakeProfitE) {
  return mapTakeProfit[takeProfit];
}
