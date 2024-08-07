import { probToPrice } from '@d8x/perpetuals-sdk';

export function calculatePrice(probability: number, isNoVote: boolean) {
  return isNoVote ? probToPrice(1 - probability) : probToPrice(probability);
}
