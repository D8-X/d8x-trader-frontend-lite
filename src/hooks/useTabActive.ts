import { useCallback, useEffect, useState } from 'react';

export const useTabActive = () => {
  const [isTabActive, setTabActive] = useState(true);

  const handleVisibilityChange = useCallback(() => {
    setTabActive(document.visibilityState === 'visible');
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return isTabActive;
};
