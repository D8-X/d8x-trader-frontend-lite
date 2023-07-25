import { ExpiryE } from 'types/enums';

const mapExpiry: Record<ExpiryE, number> = {
  [ExpiryE['1D']]: 1,
  [ExpiryE['30D']]: 30,
  [ExpiryE['90D']]: 90,
  [ExpiryE['180D']]: 180,
  [ExpiryE['365D']]: 365,
};

export function mapExpiryToNumber(expiry: ExpiryE) {
  return mapExpiry[expiry];
}
