import { useAtomValue } from 'jotai';

import { enabledDarkModeAtom } from 'store/app.store';

export const ThemeApplier = () => {
  const enabledDarkMode = useAtomValue(enabledDarkModeAtom);

  document.documentElement.dataset.theme = enabledDarkMode ? 'dark' : 'light';

  return null;
};
