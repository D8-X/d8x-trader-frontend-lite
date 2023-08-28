import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { UTCTimestamp } from 'lightweight-charts';

import { timeToLocal } from 'helpers/timeToLocal';
import { selectedPerpetualAtom } from 'store/pools.store';
import {
  candlesAtom,
  candlesDataReadyAtom,
  candlesWebSocketReadyAtom,
  newCandlesAtom,
  selectedPeriodAtom,
} from 'store/tv-chart.store';
import { PerpetualI } from 'types/types';
import { TvChartPeriodE } from 'types/enums';

import {
  CommonWsMessageI,
  ConnectWsMessageI,
  // ErrorWsMessageI,
  MessageTypeE,
  SubscribeWsMessageI,
  UpdateWsMessageI,
} from './types';

function isConnectMessage(message: CommonWsMessageI): message is ConnectWsMessageI {
  return message.type === MessageTypeE.Connect;
}

// function isErrorMessage(message: CommonWsMessageI): message is ErrorWsMessageI {
//   return message.type === MessageTypeE.Error;
// }

function isSubscribeMessage(message: CommonWsMessageI): message is SubscribeWsMessageI {
  return message.type === MessageTypeE.Subscribe;
}

function isUpdateMessage(message: UpdateWsMessageI): message is UpdateWsMessageI {
  return message.type === MessageTypeE.Update;
}

function createPairWithPeriod(perpetual: PerpetualI, period: TvChartPeriodE) {
  return `${perpetual.baseCurrency}-${perpetual.quoteCurrency}:${period}`.toLowerCase();
}

export function useCandlesWsMessageHandler() {
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPeriod] = useAtom(selectedPeriodAtom);
  const [, setCandlesWebSocketReady] = useAtom(candlesWebSocketReadyAtom);
  const [, setCandles] = useAtom(candlesAtom);
  const [, setNewCandles] = useAtom(newCandlesAtom);
  const [, setCandlesDataReady] = useAtom(candlesDataReadyAtom);

  return useCallback(
    (message: string) => {
      const parsedMessage = JSON.parse(message);

      if (isConnectMessage(parsedMessage)) {
        setCandlesWebSocketReady(true);
        setCandlesDataReady(true);
      } else if (isSubscribeMessage(parsedMessage) && selectedPerpetual) {
        const symbol = createPairWithPeriod(selectedPerpetual, selectedPeriod);
        const newData = parsedMessage.data;
        if (parsedMessage.msg !== symbol || !newData) {
          return;
        }

        setCandles((prevData) => {
          // TODO: VOV: Temporary work-around. Should be only 1 message from backend
          if (prevData.length === newData.length && prevData[0].close === +newData[0].close) {
            return prevData;
          }
          return parsedMessage.data.map((candle) => {
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
      } else if (isUpdateMessage(parsedMessage) && selectedPerpetual) {
        const symbol = createPairWithPeriod(selectedPerpetual, selectedPeriod);
        if (parsedMessage.msg !== symbol || !parsedMessage.data) {
          return;
        }

        setNewCandles((prevData) => {
          const newData = [...prevData];

          parsedMessage.data.forEach((newCandle) => {
            const localTime = timeToLocal(newCandle.time);

            newData.push({
              start: localTime,
              time: (localTime / 1000) as UTCTimestamp,
              open: +newCandle.open,
              high: +newCandle.high,
              low: +newCandle.low,
              close: +newCandle.close,
            });
          });

          return newData;
        });
        setCandlesDataReady(true);
      }
    },
    [setCandlesWebSocketReady, setCandles, setNewCandles, setCandlesDataReady, selectedPerpetual, selectedPeriod]
  );
}
