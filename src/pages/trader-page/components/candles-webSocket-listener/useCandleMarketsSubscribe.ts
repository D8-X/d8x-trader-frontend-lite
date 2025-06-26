import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';

import { orderBlockAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, selectedPerpetualDataAtom } from 'store/pools.store';
import { candlesDataReadyAtom, newCandleAtom, selectedPeriodAtom } from 'store/tv-chart.store';
import { OrderBlockE } from 'types/enums';

import { createPairWithPeriod } from './helpers/createPairWithPeriod';
import { subscribingCheckAtom, unsubscribeLostCandleAtom } from './subscribingCheckAtom';

interface UseCandleMarketsSubscribePropsI {
  isConnected: boolean;
  send: (message: string) => void;
}

export const useCandleMarketsSubscribe = ({ isConnected, send }: UseCandleMarketsSubscribePropsI) => {
  const orderBlock = useAtomValue(orderBlockAtom);
  const selectedPeriod = useAtomValue(selectedPeriodAtom);
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPerpetualData = useAtomValue(selectedPerpetualDataAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);
  const subscribingCheck = useSetAtom(subscribingCheckAtom);
  const [unsubscribeLostCandle, setUnsubscribeLostCandle] = useAtom(unsubscribeLostCandleAtom);

  const [triggerResubscribe, setTriggerResubscribe] = useState(false);

  const wsConnectedStateRef = useRef(false);
  const topicRef = useRef('');
  const latestOrderBlockRef = useRef<OrderBlockE | null>(null);
  const resubscribeRef = useRef(false);

  const isPredictionMarket = selectedPerpetualData?.isPredictionMarket ?? false;

  // This use effect is used to resubscribe
  useEffect(() => {
    if (isPredictionMarket) {
      if (latestOrderBlockRef.current === null) {
        latestOrderBlockRef.current = orderBlock;
        return;
      }

      // Check if orderBlock is changed
      if (latestOrderBlockRef.current === orderBlock) {
        return;
      }

      latestOrderBlockRef.current = orderBlock;

      // Just ask to resubscribe
      setTriggerResubscribe((prev) => !prev);
    }
  }, [isPredictionMarket, orderBlock]);

  useEffect(() => {
    if (selectedPerpetual && isConnected) {
      // Always subscribe to markets on every (re)connect
      send(JSON.stringify({ type: 'subscribe', topic: 'markets' }));

      wsConnectedStateRef.current = true;

      const topicInfo = createPairWithPeriod(selectedPerpetual, selectedPeriod);
      if (topicInfo !== topicRef.current || triggerResubscribe !== resubscribeRef.current) {
        if (topicRef.current) {
          send(JSON.stringify({ type: 'unsubscribe', topic: topicRef.current }));
        }

        resubscribeRef.current = triggerResubscribe;
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
  }, [
    selectedPerpetual,
    selectedPeriod,
    setNewCandle,
    setCandlesDataReady,
    isConnected,
    send,
    subscribingCheck,
    triggerResubscribe,
  ]);

  useEffect(() => {
    if (unsubscribeLostCandle !== '') {
      send(JSON.stringify({ type: 'unsubscribe', topic: unsubscribeLostCandle }));
      setUnsubscribeLostCandle('');
    }
  }, [unsubscribeLostCandle, setUnsubscribeLostCandle, send]);
};
