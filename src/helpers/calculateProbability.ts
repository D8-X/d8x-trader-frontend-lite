import { priceToProb } from '@d8x/perpetuals-sdk';

export function calculateProbability(price: number, isNoVote: boolean) {
  const probability = priceToProb(price);
  return isNoVote ? 1 - probability : probability;
}
