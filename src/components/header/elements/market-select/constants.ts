export enum TokenGroupE {
  CRYPTO,
  FX,
  COMMODITY,
}

export const tokenGroups: Record<TokenGroupE, string[]> = {
  [TokenGroupE.CRYPTO]: ['MATIC', 'ETC', 'BTC'],
  [TokenGroupE.FX]: ['CHF', 'GBP'],
  [TokenGroupE.COMMODITY]: ['XAU'],
};
