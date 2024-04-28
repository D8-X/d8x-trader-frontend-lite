import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { useAtomValue } from 'jotai';
import { ReactNode } from 'react';

import { Disclaimer } from 'components/disclaimer/disclaimer';
import { enabledDarkModeAtom } from 'store/app.store';

import '@rainbow-me/rainbowkit/styles.css';

export const RainbowKitProviderWrapper = ({ children }: { children: ReactNode }) => {
  const enabledDarkMode = useAtomValue(enabledDarkModeAtom);

  return (
    <RainbowKitProvider
      appInfo={{ appName: 'D8X', disclaimer: Disclaimer, learnMoreUrl: 'https://d8x.exchange/' }}
      modalSize="compact"
      theme={enabledDarkMode ? darkTheme() : undefined}
    >
      {children}
    </RainbowKitProvider>
  );
};
