const SUFFIXES = ['', 'k', 'm', 'b', 't'];

export function abbreviateNumber(value: number) {
  if (value >= 1000) {
    const suffixNum = Math.floor(('' + value).length / 3);
    let shortValue = 0;
    for (let precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat((suffixNum != 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(precision));
      const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
      if (dotLessShortValue.length <= 2) {
        break;
      }
    }
    if (shortValue % 1 != 0) {
      return shortValue.toFixed(1) + SUFFIXES[suffixNum];
    }
    return shortValue + SUFFIXES[suffixNum];
  }
  return value.toFixed(2);
}
