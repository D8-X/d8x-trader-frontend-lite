import { atom } from 'jotai';

import { candlesDataReadyAtom } from 'store/tv-chart.store';

export const subscribingCheckAtom = atom(null, async (get, _set, resubscribeCallback: () => void) => {
  const interval = setInterval(() => {
    const candlesDataReady = get(candlesDataReadyAtom);
    if (!candlesDataReady) {
      resubscribeCallback();
    } else {
      clearInterval(interval);
    }
  }, 5000);
});
