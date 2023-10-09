import { useEffect, useState } from 'react';

import { WebSocketI } from '../types';

interface MessagesToSendPropsI {
  client?: WebSocketI;
  isConnected: boolean;
}

export const useMessagesToSend = ({ client, isConnected }: MessagesToSendPropsI) => {
  const [messagesToSend, setMessagesToSend] = useState<string[]>([]);

  useEffect(() => {
    if (client && isConnected && messagesToSend.length > 0) {
      messagesToSend.forEach(client.send);
      setMessagesToSend([]);
    }
  }, [client, isConnected, messagesToSend]);

  return {
    setMessagesToSend,
  };
};
