import { useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { UTCTimestamp } from 'lightweight-charts';

import { timeToLocal } from 'helpers/timeToLocal';
import { selectedPerpetualAtom } from 'store/pools.store';
import {
  candlesAtom,
  candlesDataReadyAtom,
  marketsDataAtom,
  newCandleAtom,
  selectedPeriodAtom,
} from 'store/tv-chart.store';
import { PerpetualI } from 'types/types';
import { TvChartPeriodE } from 'types/enums';

import {
  CommonWsMessageI,
  ConnectWsMessageI,
  MarketsSubscribeWsErrorMessageI,
  MarketsSubscribeWsMessageI,
  MarketsWsMessageI,
  MessageTopicE,
  MessageTypeE,
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

function createPairWithPeriod(perpetual: PerpetualI, period: TvChartPeriodE) {
  return `${perpetual.baseCurrency}-${perpetual.quoteCurrency}:${period}`.toLowerCase();
}

export function useCandlesWsMessageHandler() {
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const setCandles = useSetAtom(candlesAtom);
  const setNewCandle = useSetAtom(newCandleAtom);
  const setMarketsData = useSetAtom(marketsDataAtom);
  const setCandlesDataReady = useSetAtom(candlesDataReadyAtom);

  return useCallback(
    (message: string) => {
      const parsedMessage = JSON.parse(message);

      if (isConnectMessage(parsedMessage)) {
        setCandlesDataReady(true);
      } else if (isSubscribeErrorMessage(parsedMessage)) {
        console.error(parsedMessage.data.error);
      } else if (isMarketsSubscribeErrorMessage(parsedMessage)) {
        console.error(parsedMessage.data.error);
      } else if (isSubscribeMessage(parsedMessage) && selectedPerpetual) {
        const symbol = createPairWithPeriod(selectedPerpetual, selectedPeriod);
        const newData = parsedMessage.data;
        if (parsedMessage.topic !== symbol || !newData) {
          return;
        }

        setCandles((prevData) => {
          // TODO: VOV: Temporary work-around. Should be only 1 message from backend
          if (prevData.length === newData.length && prevData[0].close === +newData[0].close) {
            return prevData;
          }

          return newData.map((candle) => {
            const localTime = timeToLocal(candle.time);

            return {
              start: localTime,
              time: (localTime / 1000) as UTCTimestamp,
              open: +candle.open,
              high: +candle.high,
              low: +candle.low,
              close: +candle.close,
            };
          });
        });
        setCandlesDataReady(true);
      } else if (isMarketsSubscribeMessage(parsedMessage)) {
        setMarketsData(parsedMessage.data);
      } else if (isUpdateMessage(parsedMessage) && selectedPerpetual) {
        const symbol = createPairWithPeriod(selectedPerpetual, selectedPeriod);
        if (parsedMessage.topic !== symbol || !parsedMessage.data) {
          return;
        }

        const localTime = timeToLocal(parsedMessage.data.time);
        setNewCandle({
          start: localTime,
          time: (localTime / 1000) as UTCTimestamp,
          open: +parsedMessage.data.open,
          high: +parsedMessage.data.high,
          low: +parsedMessage.data.low,
          close: +parsedMessage.data.close,
        });

        setCandlesDataReady(true);
      } else if (isMarketsMessage(parsedMessage)) {
        setMarketsData(parsedMessage.data);
      }
    },
    [setCandles, setNewCandle, setMarketsData, setCandlesDataReady, selectedPerpetual, selectedPeriod]
  );
}
