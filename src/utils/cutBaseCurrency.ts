export function cutBaseCurrency(currency?: string) {
  if (currency && currency.length > 14) {
    return `${currency.slice(0, 11)}...`;
  }
  return currency;
}
