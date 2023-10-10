import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback } from 'react';

import { WebSocketI } from '../types';

interface SendPropsI {
  client?: WebSocketI;
  isConnected: boolean;
  setMessagesToSend: Dispatch<SetStateAction<string[]>>;
  waitForPongRef: MutableRefObject<boolean>;
}

export const useSend = ({ client, isConnected, setMessagesToSend, waitForPongRef }: SendPropsI) => {
  return useCallback(
    (message: string) => {
      if (client && isConnected) {
        if (!client.send(message)) {
          client.reconnect();
          waitForPongRef.current = false;
        }
      } else {
        setMessagesToSend((prevState) => [...prevState, message]);
      }
    },
    [client, isConnected, setMessagesToSend, waitForPongRef]
  );
};
