export function calculateStepSize(indexPrice?: number) {
  if (!indexPrice) {
    return '1';
  }
  return `${1 / 10 ** Math.ceil(2.5 - Math.log10(indexPrice))}`;
}
