import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';

interface HandleMessagePropsI {
  messages: string[];
  setMessages: Dispatch<SetStateAction<string[]>>;
  handleWsMessage: (message: string) => void;
}

export const useHandleMessage = ({ messages, setMessages, handleWsMessage }: HandleMessagePropsI) => {
  // Store the latest handleWsMessage function in a ref to avoid dependency issues
  const handleWsMessageRef = useRef(handleWsMessage);
  handleWsMessageRef.current = handleWsMessage;

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => handleWsMessageRef.current(message));
      setMessages([]);
    }
  }, [messages, setMessages]);
};
