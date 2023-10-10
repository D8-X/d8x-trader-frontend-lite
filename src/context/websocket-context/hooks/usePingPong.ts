import { MutableRefObject, useEffect, useState } from 'react';

import { WebSocketI } from '../types';

const PING_MESSAGE = JSON.stringify({ type: 'ping' });
const WS_ALIVE_TIMEOUT = 10_000;
const TICKER_TIMEOUT = 1_000;

interface PingPongPropsI {
  client?: WebSocketI;
  isConnected: boolean;
  latestMessageTime: number;
  waitForPongRef: MutableRefObject<boolean>;
}

export const usePingPong = ({ client, isConnected, latestMessageTime, waitForPongRef }: PingPongPropsI) => {
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    if (!client || !isConnected) {
      return;
    }

    if (Date.now() - latestMessageTime < WS_ALIVE_TIMEOUT) {
      const tickerInterval = setTimeout(() => setTicker((prevState) => prevState + 1), TICKER_TIMEOUT);
      return () => clearTimeout(tickerInterval);
    }

    if (!waitForPongRef.current) {
      waitForPongRef.current = true;
      const sendResult = client.send(PING_MESSAGE);
      if (!sendResult) {
        client.reconnect();
        waitForPongRef.current = false;
        return;
      }
    }

    const pingMessageTimeout = setTimeout(() => {
      if (client && waitForPongRef.current) {
        client.reconnect();
        waitForPongRef.current = false;
      }
    }, WS_ALIVE_TIMEOUT);

    return () => {
      clearTimeout(pingMessageTimeout);
      waitForPongRef.current = false;
    };
  }, [client, latestMessageTime, isConnected, waitForPongRef, ticker]);
};
