import { useCallback, useEffect, useState } from 'react';

export const useTabFocused = () => {
  const [isTabFocused, setTabFocused] = useState(true);

  const handleFocus = useCallback(() => {
    setTabFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setTabFocused(false);
  }, []);

  useEffect(() => {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleFocus, handleBlur]);

  return isTabFocused;
};
