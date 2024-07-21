import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

import { config } from 'config';

import { createWebSocketWithReconnect } from 'context/websocket-context/createWebSocketWithReconnect';
import { useHandleMessage } from 'context/websocket-context/hooks/useHandleMessage';
import { useMessagesToSend } from 'context/websocket-context/hooks/useMessagesToSend';
import { usePingPong } from 'context/websocket-context/hooks/usePingPong';
import { useSend } from 'context/websocket-context/hooks/useSend';
import { WebSocketI } from 'context/websocket-context/types';
import { orderBlockAtom } from 'store/order-block.store';
import { selectedPerpetualDataAtom } from 'store/pools.store';
import { candlesLatestMessageTimeAtom, newOriginalCandlesAtom, originalCandlesAtom } from 'store/tv-chart.store';
import { getEnabledChainId } from 'utils/getEnabledChainId';
import { OrderBlockE } from 'types/enums';

import { useCandleMarketsSubscribe } from './useCandleMarketsSubscribe';
import { useCandlesWsMessageHandler } from './useCandlesWsMessageHandler';

export const CandlesWebSocketListener = memo(() => {
  const { chainId } = useAccount();

  const orderBlock = useAtomValue(orderBlockAtom);
  const selectedPerpetualData = useAtomValue(selectedPerpetualDataAtom);
  const latestMessageTime = useAtomValue(candlesLatestMessageTimeAtom);
  const setOriginalCandles = useSetAtom(originalCandlesAtom);
  const [newCandles, setNewCandles] = useAtom(newOriginalCandlesAtom);

  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocketI>();
  const waitForPongRef = useRef(false);
  const latestOrderBlockRef = useRef<OrderBlockE | null>(null);

  const handleWsMessage = useCandlesWsMessageHandler();

  const isPredictionMarket = selectedPerpetualData?.isPredictionMarket ?? false;

  // This use effect is used to update originalCandlesAtom in case orderBlock is changed for PredictionMarket
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
      // In case no new candles where added, nothing to do
      if (newCandles.length === 0) {
        return;
      }

      // Add new candles to the originalCandles and clear newCandles array
      setOriginalCandles((prev) => [...prev, ...newCandles]);
      setNewCandles([]);
    }
  }, [isPredictionMarket, orderBlock, newCandles, setOriginalCandles, setNewCandles]);

  usePingPong({
    client: wsRef.current,
    isConnected,
    latestMessageTime,
    waitForPongRef,
  });

  useHandleMessage({
    messages,
    setMessages,
    handleWsMessage,
  });

  const { setMessagesToSend } = useMessagesToSend({
    client: wsRef.current,
    isConnected,
  });

  const send = useSend({
    client: wsRef.current,
    isConnected,
    setMessagesToSend,
    waitForPongRef,
  });

  useEffect(() => {
    wsRef.current?.close();

    const candlesWsUrl = config.candlesWsUrl[getEnabledChainId(chainId)] || config.candlesWsUrl.default;
    wsRef.current = createWebSocketWithReconnect(candlesWsUrl);
    wsRef.current.onStateChange(setIsConnected);

    const handleMessage = (message: string) => {
      setMessages((prevState) => [...prevState, message]);
    };
    wsRef.current.on(handleMessage);
    return () => {
      wsRef.current?.off(handleMessage);
      wsRef.current?.close();
    };
  }, [chainId]);

  useCandleMarketsSubscribe({ isConnected, send });

  return null;
});
