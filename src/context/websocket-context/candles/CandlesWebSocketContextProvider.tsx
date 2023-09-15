import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useChainId } from 'wagmi';

import { config } from 'config';

import { createWebSocketWithReconnect } from '../createWebSocketWithReconnect';
import { useHandleMessage } from '../hooks/useHandleMessage';
import { usePingPong } from '../hooks/usePingPong';
import { useMessagesToSend } from '../hooks/useMessagesToSend';
import { useSend } from '../hooks/useSend';
import { WebSocketI } from '../types';
import { CandlesWebSocketContext, CandlesWebSocketContextI } from './CandlesWebSocketContext';
import { useCandlesWsMessageHandler } from './useCandlesWsMessageHandler';

let client: WebSocketI;

export const CandlesWebSocketContextProvider = ({ children }: PropsWithChildren) => {
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

  const contextValue: CandlesWebSocketContextI = useMemo(
    () => ({
      isConnected,
      send,
    }),
    [isConnected, send]
  );

  return <CandlesWebSocketContext.Provider value={contextValue}>{children}</CandlesWebSocketContext.Provider>;
};
