import { useContext } from 'react';

import { CandlesWebSocketContext } from './CandlesWebSocketContext';

export const useCandlesWebSocketContext = () => {
  const context = useContext(CandlesWebSocketContext);
  if (!context) {
    throw new Error('useCandlesWebSocketContext must be used within a CandlesWebSocketContextProvider');
  }
  return context;
};
