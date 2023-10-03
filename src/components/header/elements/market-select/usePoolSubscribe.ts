import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { useWebSocketContext } from 'context/websocket-context/d8x/useWebSocketContext';
import { createSymbol } from 'helpers/createSymbol';
import { poolsAtom } from 'store/pools.store';

export const usePoolSubscribe = () => {
  const { address } = useAccount();

  const { isConnected, send } = useWebSocketContext();

  const [pools] = useAtom(poolsAtom);

  useEffect(() => {
    if (pools.length && isConnected) {
      send(JSON.stringify({ type: 'unsubscribe' }));

      pools.forEach((pool) => {
        pool.perpetuals.forEach(({ baseCurrency, quoteCurrency }) => {
          const symbol = createSymbol({
            baseCurrency,
            quoteCurrency,
            poolSymbol: pool.poolSymbol,
          });
          send(
            JSON.stringify({
              traderAddr: address ?? '',
              symbol,
            })
          );
        });
      });
    }
  }, [pools, isConnected, send, address]);
};
