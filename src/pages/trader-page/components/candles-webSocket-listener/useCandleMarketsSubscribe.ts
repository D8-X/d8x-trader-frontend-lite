import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { selectedPerpetualAtom } from 'store/pools.store';
import { candlesDataReadyAtom, newCandleAtom, selectedPeriodAtom } from 'store/tv-chart.store';

interface UseCandleMarketsSubscribePropsI {
  isConnected: boolean;
  send: (message: string) => void;
}

export const useCandleMarketsSubscribe = ({ isConnected, send }: UseCandleMarketsSubscribePropsI) => {
  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);

  const wsConnectedStateRef = useRef(false);
  const topicRef = useRef('');

  useEffect(() => {
    if (selectedPerpetual && isConnected) {
      if (wsConnectedStateRef.current === false) {
        send(JSON.stringify({ type: 'subscribe', topic: 'markets' }));
      }

      wsConnectedStateRef.current = true;

      const topicInfo = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}:${selectedPeriod}`;
      if (topicInfo !== topicRef.current) {
        if (topicRef.current) {
          send(JSON.stringify({ type: 'unsubscribe', topic: topicRef.current }));
        }
        topicRef.current = topicInfo;
        send(
          JSON.stringify({
            type: 'subscribe',
            topic: topicRef.current,
          })
        );
        setNewCandle(null);
        setCandlesDataReady(false);
      }
    } else if (!isConnected) {
      wsConnectedStateRef.current = false;
      topicRef.current = '';
    }
  }, [selectedPerpetual, selectedPeriod, setNewCandle, setCandlesDataReady, isConnected, send]);
};
