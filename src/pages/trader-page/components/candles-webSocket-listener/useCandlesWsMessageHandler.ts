import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';

import { selectedPerpetualAtom } from 'store/pools.store';
import {
  candlesDataReadyAtom,
  candlesLatestMessageTimeAtom,
  marketsDataAtom,
  newCandleAtom,
  originalCandlesAtom,
  selectedPeriodAtom,
} from 'store/tv-chart.store';
import { type TvChartCandleI } from 'types/types';
import { debounceLeading } from 'utils/debounceLeading';

import { createPairWithPeriod } from './helpers/createPairWithPeriod';
import { unsubscribeLostCandleAtom } from './subscribingCheckAtom';
import { MessageTopicE, MessageTypeE } from './enums';
import type {
  CommonWsMessageI,
  ConnectWsMessageI,
  MarketsSubscribeWsErrorMessageI,
  MarketsSubscribeWsMessageI,
  MarketsWsMessageI,
  SubscribeWsErrorMessageI,
  SubscribeWsMessageI,
  UpdateWsMessageI,
} from './types';

function isConnectMessage(message: CommonWsMessageI): message is ConnectWsMessageI {
  return message.type === MessageTypeE.Connect;
}

function isSubscribeMessage(message: SubscribeWsMessageI): message is SubscribeWsMessageI {
  return (
    message.type === MessageTypeE.Subscribe && message.topic !== MessageTopicE.Markets && Array.isArray(message.data)
  );
}

function isSubscribeErrorMessage(message: SubscribeWsErrorMessageI): message is SubscribeWsErrorMessageI {
  return (
    message.type === MessageTypeE.Subscribe &&
    message.topic !== MessageTopicE.Markets &&
    message.data.error !== undefined
  );
}

function isAlreadySubscribedErrorMessage(message: SubscribeWsErrorMessageI) {
  return isSubscribeErrorMessage(message) && message.data.error === 'client already subscribed';
}

function isMarketsSubscribeMessage(message: MarketsSubscribeWsMessageI): message is MarketsSubscribeWsMessageI {
  return (
    message.type === MessageTypeE.Subscribe && message.topic === MessageTopicE.Markets && Array.isArray(message.data)
  );
}

function isMarketsSubscribeErrorMessage(
  message: MarketsSubscribeWsErrorMessageI
): message is MarketsSubscribeWsErrorMessageI {
  return (
    message.type === MessageTypeE.Subscribe &&
    message.topic === MessageTopicE.Markets &&
    message.data.error !== undefined
  );
}

function isUpdateMessage(message: UpdateWsMessageI): message is UpdateWsMessageI {
  return message.type === MessageTypeE.Update && message.topic !== MessageTopicE.Markets;
}

function isMarketsMessage(message: MarketsWsMessageI): message is MarketsWsMessageI {
  return message.type === MessageTypeE.Update && message.topic === MessageTopicE.Markets;
}

const debounceLatestMessageTime = debounceLeading((callback: () => void) => {
  callback();
}, 1000);

export function useCandlesWsMessageHandler() {
  const selectedPerpetual = useAtomValue(selectedPerpetualAtom);
  const selectedPeriod = useAtomValue(selectedPeriodAtom);
  const setCandles = useSetAtom(originalCandlesAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const setMarketsData = useSetAtom(marketsDataAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);
  const setCandlesWsLatestMessageTime = useSetAtom(candlesLatestMessageTimeAtom);
  const setUnsubscribeLostCandle = useSetAtom(unsubscribeLostCandleAtom);

  const latestCandleRef = useRef<TvChartCandleI | null>(null);

  return useCallback(
    (message: string) => {
      const parsedMessage = JSON.parse(message);

      debounceLatestMessageTime(() => {
        setCandlesWsLatestMessageTime(Date.now());
      });

      if (isConnectMessage(parsedMessage)) {
        setCandlesDataReady(true);
      } else if (isMarketsSubscribeErrorMessage(parsedMessage)) {
        console.error(parsedMessage.data.error);
      } else if (
        selectedPerpetual &&
        (isSubscribeMessage(parsedMessage) || isAlreadySubscribedErrorMessage(parsedMessage))
      ) {
        const symbol = createPairWithPeriod(selectedPerpetual, selectedPeriod);
        if (parsedMessage.topic !== symbol) {
          setUnsubscribeLostCandle(parsedMessage.topic);
          return;
        }

        const newData = parsedMessage.data;
        if (!newData || !Array.isArray(newData)) {
          return;
        }

        setCandles((prevData) => {
          // TODO: VOV: Temporary work-around. Should be only 1 message from backend
          if (prevData.length === newData.length && prevData.length > 0 && prevData[0].close === +newData[0].close) {
            return prevData;
          }

          const candles: TvChartCandleI[] = [];
          latestCandleRef.current = null;

          for (const [index, candle] of newData.entries()) {
            const localTime = new Date(candle.time).getTime();
            if (latestCandleRef.current != null && latestCandleRef.current.start >= localTime) {
              console.warn(
                `Candle (${index}) from the array has wrong time (prev: ${latestCandleRef.current.start} >= next: ${localTime})`,
                parsedMessage.data
              );
              continue;
            }

            const newCandle: TvChartCandleI = {
              start: localTime,
              time: localTime / 1000,
              open: +candle.open,
              high: +candle.high,
              low: +candle.low,
              close: +candle.close,
            };
            candles.push(newCandle);
            latestCandleRef.current = newCandle;
          }

          return candles;
        });
        setCandlesDataReady(true);
      } else if (isSubscribeErrorMessage(parsedMessage)) {
        console.error(parsedMessage.data.error);
      } else if (isMarketsSubscribeMessage(parsedMessage)) {
        setMarketsData(parsedMessage.data);
      } else if (isUpdateMessage(parsedMessage) && selectedPerpetual) {
        const symbol = createPairWithPeriod(selectedPerpetual, selectedPeriod);
        if (parsedMessage.topic !== symbol) {
          setUnsubscribeLostCandle(parsedMessage.topic);
          return;
        }

        if (!parsedMessage.data) {
          return;
        }

        const localTime = new Date(parsedMessage.data.time).getTime();
        if (latestCandleRef.current != null && latestCandleRef.current.start > localTime) {
          setCandlesDataReady(true);
          console.error('New candle timeToLocal is from the past', parsedMessage.data, localTime);
          return;
        }

        const newCandle: TvChartCandleI = {
          start: localTime,
          time: localTime / 1000,
          open: +parsedMessage.data.open,
          high: +parsedMessage.data.high,
          low: +parsedMessage.data.low,
          close: +parsedMessage.data.close,
        };
        latestCandleRef.current = newCandle;

        setNewCandle(newCandle);
        setCandlesDataReady(true);
      } else if (isMarketsMessage(parsedMessage)) {
        setMarketsData(parsedMessage.data);
      }
    },
    [
      setCandles,
      setNewCandle,
      setMarketsData,
      setCandlesDataReady,
      setCandlesWsLatestMessageTime,
      setUnsubscribeLostCandle,
      selectedPerpetual,
      selectedPeriod,
    ]
  );
}
