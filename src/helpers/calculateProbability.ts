import { priceToProb } from '@d8x/perpetuals-sdk';

export function calculateProbability(price: number, isNoVote: boolean) {
  if (price <= 0) {
    return price;
  }

  const probability = priceToProb(price);
  return isNoVote ? 1 - probability : probability;
}
