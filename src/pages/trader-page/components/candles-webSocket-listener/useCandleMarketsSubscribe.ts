import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { selectedPerpetualAtom } from 'store/pools.store';
import { candlesDataReadyAtom, newCandleAtom, selectedPeriodAtom } from 'store/tv-chart.store';

import { createPairWithPeriod } from './helpers/createPairWithPeriod';
import { subscribingCheckAtom, unsubscribeLostCandleAtom } from './subscribingCheckAtom';

interface UseCandleMarketsSubscribePropsI {
  isConnected: boolean;
  send: (message: string) => void;
}

export const useCandleMarketsSubscribe = ({ isConnected, send }: UseCandleMarketsSubscribePropsI) => {
  const selectedPeriod = useAtomValue(selectedPeriodAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);
  const subscribingCheck = useSetAtom(subscribingCheckAtom);
  const [unsubscribeLostCandle, setUnsubscribeLostCandle] = useAtom(unsubscribeLostCandleAtom);

  const wsConnectedStateRef = useRef(false);
  const topicRef = useRef('');

  useEffect(() => {
    if (selectedPerpetual && isConnected) {
      if (!wsConnectedStateRef.current) {
        send(JSON.stringify({ type: 'subscribe', topic: 'markets' }));
      }

      wsConnectedStateRef.current = true;

      const topicInfo = createPairWithPeriod(selectedPerpetual, selectedPeriod);
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

        subscribingCheck(() => {
          send(
            JSON.stringify({
              type: 'subscribe',
              topic: topicInfo,
            })
          );
        }).then();

        setNewCandle(null);
        setCandlesDataReady(false);
      }
    } else if (!isConnected) {
      wsConnectedStateRef.current = false;
      topicRef.current = '';
    }
  }, [selectedPerpetual, selectedPeriod, setNewCandle, setCandlesDataReady, isConnected, send, subscribingCheck]);

  useEffect(() => {
    if (unsubscribeLostCandle !== '') {
      send(JSON.stringify({ type: 'unsubscribe', topic: unsubscribeLostCandle }));
      setUnsubscribeLostCandle('');
    }
  }, [unsubscribeLostCandle, setUnsubscribeLostCandle, send]);
};
