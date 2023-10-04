import { useAtom } from 'jotai';

import { enabledDarkModeAtom } from 'store/app.store';

export const ThemeApplier = () => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  document.documentElement.dataset.theme = enabledDarkMode ? 'dark' : 'light';

  return null;
};
