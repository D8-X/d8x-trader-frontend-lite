import { memo, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useLocation } from 'react-router-dom';

import { config } from 'config';

import { createWebSocketWithReconnect } from 'context/websocket-context/createWebSocketWithReconnect';
import { useHandleMessage } from 'context/websocket-context/hooks/useHandleMessage';
import { useMessagesToSend } from 'context/websocket-context/hooks/useMessagesToSend';
import { useSend } from 'context/websocket-context/hooks/useSend';
import { WebSocketI } from 'context/websocket-context/types';
import { getEnabledChainId } from 'utils/getEnabledChainId';

import { useCandleMarketsSubscribe } from './useCandleMarketsSubscribe';
import { useCandlesWsMessageHandler } from './useCandlesWsMessageHandler';

export const CandlesWebSocketListener = memo(() => {
  const { chainId } = useAccount();
  const location = useLocation();

  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocketI>();

  const handleWsMessage = useCandlesWsMessageHandler();

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
  });

  // Compute effectiveChainId once per render
  const effectiveChainId = getEnabledChainId(chainId, location.hash);

  useEffect(() => {
    // Only recreate socket when effectiveChainId changes
    wsRef.current?.close();

    const candlesWsUrl = config.candlesWsUrl[effectiveChainId] || config.candlesWsUrl.default;
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
  }, [effectiveChainId]);

  useCandleMarketsSubscribe({ isConnected, send });

  return null;
});
