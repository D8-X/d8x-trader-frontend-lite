export const mapCurrencyToFractionDigits: Record<string, number> = {
  USD: 2,
  USDC: 2,
  MATIC: 1,
  dMATIC: 1,
  BTC: 5,
  dBTC: 5,
  ETH: 4,
  dETH: 4,
};

export function getFractionDigits(currency?: string) {
  if (currency) {
    const foundFractionDigits = mapCurrencyToFractionDigits[currency];
    return foundFractionDigits !== undefined ? foundFractionDigits : 2;
  }
  return 2;
}

export function roundHalfDown(value: number | undefined) {
  if (!value) {
    return 2;
  }
  const i = Math.floor(value);
  const f = value - i;
  return f <= 0.5 ? i : Math.round(value);
}

export function valueToFractionDigits(value: number | undefined) {
  if (!value) {
    return 2;
  }
  return Math.max(2, roundHalfDown(2.5 - Math.log10(Math.abs(value))));
}

export function formatToCurrency(
  value: number | undefined | null,
  currency = '',
  keepZeros = false,
  fractionDigits?: number,
  justNumber?: boolean
) {
  if (value == null) {
    return '-';
  }

  if (justNumber) {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: fractionDigits || valueToFractionDigits(value),
      minimumFractionDigits: keepZeros ? fractionDigits || valueToFractionDigits(value) : undefined,
    }).format(value)}`;
  }
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: fractionDigits || valueToFractionDigits(value),
    minimumFractionDigits: keepZeros ? fractionDigits || valueToFractionDigits(value) : undefined,
  }).format(value)} ${currency}`;
}
