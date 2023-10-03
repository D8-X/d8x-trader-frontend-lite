import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { useCandlesWebSocketContext } from 'context/websocket-context/candles/useCandlesWebSocketContext';
import { selectedPerpetualAtom } from 'store/pools.store';
import { candlesDataReadyAtom, newCandleAtom, selectedPeriodAtom } from 'store/tv-chart.store';

export const useCandleMarketsSubscribe = () => {
  const { isConnected: isConnectedCandlesWs, send: sendToCandlesWs } = useCandlesWebSocketContext();

  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);

  const wsConnectedStateRef = useRef(false);
  const topicRef = useRef('');

  useEffect(() => {
    if (selectedPerpetual && isConnectedCandlesWs) {
      if (isConnectedCandlesWs !== wsConnectedStateRef.current) {
        sendToCandlesWs(JSON.stringify({ type: 'subscribe', topic: 'markets' }));
      }

      wsConnectedStateRef.current = isConnectedCandlesWs;

      const topicInfo = `${selectedPerpetual.baseCurrency}-${selectedPerpetual.quoteCurrency}:${selectedPeriod}`;
      if (topicInfo !== topicRef.current) {
        if (topicRef.current) {
          sendToCandlesWs(JSON.stringify({ type: 'unsubscribe', topic: topicRef.current }));
        }
        topicRef.current = topicInfo;
        sendToCandlesWs(
          JSON.stringify({
            type: 'subscribe',
            topic: topicRef.current,
          })
        );
        setNewCandle(null);
        setCandlesDataReady(false);
      }
    } else if (!isConnectedCandlesWs) {
      wsConnectedStateRef.current = false;
      topicRef.current = '';
    }
  }, [selectedPerpetual, selectedPeriod, setNewCandle, setCandlesDataReady, isConnectedCandlesWs, sendToCandlesWs]);
};
