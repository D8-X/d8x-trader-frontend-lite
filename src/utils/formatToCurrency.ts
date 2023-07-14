const mapCurrencyToFractionDigits: Record<string, number> = {
  USD: 2,
  MATIC: 0,
  dMATIC: 0,
  BTC: 5,
  dBTC: 5,
  ETH: 4,
  dETH: 4,
};

export function formatToCurrency(
  value: number | undefined | null,
  currency = '',
  keepZeros = false,
  fractionDigits?: number
) {
  if (value == null) {
    return '-';
  }
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: fractionDigits || mapCurrencyToFractionDigits[currency],
    minimumFractionDigits: keepZeros ? fractionDigits || mapCurrencyToFractionDigits[currency] : undefined,
  }).format(value)} ${currency}`;
}
