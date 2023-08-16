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

export function valueToFractionDigits(value: number | undefined) {
  if (!value) {
    return 1;
  }
  return !value ? 1 : Math.max(1, Math.ceil(2.5 - Math.log10(Math.abs(value))));
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
