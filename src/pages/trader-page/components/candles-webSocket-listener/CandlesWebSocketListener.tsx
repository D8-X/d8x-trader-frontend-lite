import { useEffect, useRef, useState } from 'react';
import { useChainId } from 'wagmi';

import { config } from 'config';

import { createWebSocketWithReconnect } from 'context/websocket-context/createWebSocketWithReconnect';
import { useHandleMessage } from 'context/websocket-context/hooks/useHandleMessage';
import { useMessagesToSend } from 'context/websocket-context/hooks/useMessagesToSend';
import { usePingPong } from 'context/websocket-context/hooks/usePingPong';
import { useSend } from 'context/websocket-context/hooks/useSend';
import { WebSocketI } from 'context/websocket-context/types';

import { useCandleMarketsSubscribe } from './useCandleMarketsSubscribe';
import { useCandlesWsMessageHandler } from './useCandlesWsMessageHandler';

let client: WebSocketI;

export const CandlesWebSocketListener = () => {
  const chainId = useChainId();

  const waitForPongRef = useRef(false);

  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleWsMessage = useCandlesWsMessageHandler();

  usePingPong({
    client,
    isConnected,
    messages,
    waitForPongRef,
  });

  useHandleMessage({
    messages,
    setMessages,
    handleWsMessage,
  });

  const { setMessagesToSend } = useMessagesToSend({
    client,
    isConnected,
  });

  const send = useSend({
    client,
    isConnected,
    setMessagesToSend,
    waitForPongRef,
  });

  useEffect(() => {
    if (client) {
      client.close();
    }
    const candlesWsUrl = config.candlesWsUrl[`${chainId}`] || config.candlesWsUrl.default;

    client = createWebSocketWithReconnect(candlesWsUrl);
    client.onStateChange(setIsConnected);

    const handleMessage = (message: string) => {
      setMessages((prevState) => [...prevState, message]);
    };
    client.on(handleMessage);
    return () => {
      client.off(handleMessage);
    };
  }, [chainId]);

  useCandleMarketsSubscribe({ isConnected, send });

  return null;
};
