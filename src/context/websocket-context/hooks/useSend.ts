import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import { WebSocketI } from '../types';

interface SendPropsI {
  client?: WebSocketI;
  isConnected: boolean;
  setMessagesToSend: Dispatch<SetStateAction<string[]>>;
}

export const useSend = ({ client, isConnected, setMessagesToSend }: SendPropsI) => {
  return useCallback(
    (message: string) => {
      if (client && isConnected) {
        if (!client.send(message)) {
          client.reconnect();
        }
      } else {
        setMessagesToSend((prevState) => [...prevState, message]);
      }
    },
    [client, isConnected, setMessagesToSend]
  );
};
