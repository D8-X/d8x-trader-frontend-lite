import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { enabledDarkModeAtom } from 'store/app.store';

export const ThemeApplier = () => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  useEffect(() => {
    document.documentElement.dataset.theme = enabledDarkMode ? 'dark' : 'light';
  }, [enabledDarkMode]);

  return null;
};
