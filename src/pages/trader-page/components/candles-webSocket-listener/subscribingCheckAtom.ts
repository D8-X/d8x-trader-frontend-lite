import { atom } from 'jotai';

import { candlesAtom } from 'store/tv-chart.store';

export const subscribingCheckAtom = atom(null, async (get, _set, resubscribeCallback: () => void) => {
  const interval = setInterval(() => {
    const candles = get(candlesAtom);
    if (!candles.length) {
      resubscribeCallback();
    } else {
      clearInterval(interval);
    }
  }, 5000);
});
