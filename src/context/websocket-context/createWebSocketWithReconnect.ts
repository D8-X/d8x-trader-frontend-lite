import { debounceLeading } from 'utils/debounceLeading';

import { ReactDispatchT, WebSocketI } from './types';

const RECONNECT_TIMEOUT = 5000;

export function createWebSocketWithReconnect(wsUrl: string): WebSocketI {
  let client: WebSocket;
  let isConnected = false;
  let isDisconnecting = false;
  let reconnectOnClose = true;
  let messageListeners: Array<(message: string) => void> = [];
  let stateChangeListeners: ReactDispatchT[] = [];

  const debounceWsReconnect = debounceLeading((callback: () => void) => {
    callback();
  }, RECONNECT_TIMEOUT);

  const on = (fn: (message: string) => void) => {
    messageListeners.push(fn);
  };

  const off = (fn: (message: string) => void) => {
    messageListeners = messageListeners.filter((l) => l !== fn);
  };

  const onStateChange = (fn: ReactDispatchT) => {
    stateChangeListeners.push(fn);
    return () => {
      stateChangeListeners = stateChangeListeners.filter((l) => l !== fn);
    };
  };

  const start = () => {
    client = new WebSocket(wsUrl);

    client.onopen = () => {
      isConnected = true;
      stateChangeListeners.forEach((fn) => fn(true));
    };

    const close = client.close;

    // Close without reconnecting;
    client.close = () => {
      reconnectOnClose = false;
      if (isConnected && !isDisconnecting) {
        isDisconnecting = true;
      }
      close.call(client);
    };

    client.onmessage = (event) => {
      messageListeners.forEach((fn) => fn(event.data));
    };

    client.onerror = (e) => console.error(e);

    client.onclose = () => {
      isConnected = false;
      isDisconnecting = false;

      if (!reconnectOnClose) {
        return;
      }
      debounceWsReconnect(start);
    };
  };

  start();

  return {
    on,
    off,
    onStateChange,
    close: () => {
      client.close();
      stateChangeListeners.forEach((fn) => fn(false));
    },
    reconnect: () => {
      client.close();
      stateChangeListeners.forEach((fn) => fn(false));
      debounceWsReconnect(() => {
        reconnectOnClose = true;
        start();
      });
    },
    send: (message: string) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
        return true;
      }
      return false;
    },
    isConnected: () => isConnected,
  };
}
