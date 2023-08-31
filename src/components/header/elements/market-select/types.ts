import { PerpetualI } from 'types/types';

export interface PerpetualWithPoolI extends PerpetualI {
  poolSymbol: string;
  symbol: string;
}
