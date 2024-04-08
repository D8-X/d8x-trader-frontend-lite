import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { STRATEGY_SYMBOL } from 'appConstants';
import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';

export const StrategyPoolSubscription = () => {
  const { address } = useAccount();

  const { isConnected, send } = useWebSocketContext();

  useEffect(() => {
    if (isConnected) {
      send(JSON.stringify({ type: 'unsubscribe' }));

      send(
        JSON.stringify({
          traderAddr: address ?? '',
          symbol: STRATEGY_SYMBOL,
        })
      );
    }
  }, [isConnected, send, address]);

  return null;
};
