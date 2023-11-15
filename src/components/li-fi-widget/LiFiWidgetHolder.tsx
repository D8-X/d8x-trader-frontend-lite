import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import { LanguageKey } from '@lifi/widget/providers';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainId, useConnect, useDisconnect } from 'wagmi';

// import { config as appConfig } from 'config';
import { useEthersSigner, walletClientToSigner } from 'hooks/useEthersSigner';
import { enabledDarkModeAtom } from 'store/app.store';
import { LanguageE } from 'types/enums';
import { switchChain } from 'utils/switchChain';
import { selectedPoolAtom } from '../../store/pools.store';

const WIDGET_CN_KEY = 'zh';

function modifyLanguage(languageKey?: string) {
  if (languageKey === LanguageE.CN) {
    return WIDGET_CN_KEY;
  }
  return languageKey;
}

export const LiFiWidgetHolder = () => {
  const { i18n } = useTranslation();

  const chainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const signer = useEthersSigner();

  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);

  const widgetConfig: WidgetConfig = useMemo(() => {
    const config: WidgetConfig = {
      integrator: 'li-fi-widget',
      walletManagement: {
        signer,
        connect: async () => {
          const result = await connectAsync({ connector: connectors[0] });
          const walletClient = await result.connector?.getWalletClient();
          if (walletClient) {
            return walletClientToSigner(walletClient);
          } else {
            throw Error('WalletClient not found');
          }
        },
        disconnect: async () => {
          disconnect();
        },
        switchChain,
      },
      fromChain: chainId,
      fromToken: selectedPool?.marginTokenAddr,
      hiddenUI: ['language', 'appearance'],
      appearance: enabledDarkMode ? 'dark' : 'light',
      languages: {
        default: (modifyLanguage(i18n.resolvedLanguage) as LanguageKey) || LanguageE.EN,
        allow: [LanguageE.EN, LanguageE.DE, LanguageE.ES, LanguageE.FR, WIDGET_CN_KEY],
      },
      sdkConfig: {
        defaultRouteOptions: {
          maxPriceImpact: 0.4, // increases threshold to 40%
        },
      },
      // chains: {
      //   allow: [...appConfig.enabledChains],
      // },
      bridges: {
        // TODO: Might be change later in this way
        // deny: ['stargate'],
      },
      exchanges: {
        // TODO: Might be change later in this way
        // deny: ['dodo', '0x'],
      },
    };
    return config;
  }, [chainId, selectedPool, signer, connectAsync, connectors, disconnect, i18n, enabledDarkMode]);

  console.log({ chainId });

  return <LiFiWidget integrator="li-fi-widget" config={widgetConfig} />;
};
