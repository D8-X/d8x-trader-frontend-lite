import { LiFiWidget, useWidgetEvents, type WidgetConfig, WidgetEvent } from '@lifi/widget';
import { LanguageKey } from '@lifi/widget/providers';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainId, useConnect, useDisconnect } from 'wagmi';
import { getWalletClient } from '@wagmi/core';

import { wagmiConfigForLifi } from 'blockchain-api/wagmi/wagmiClient';
import { config as appConfig } from 'config';
import { useEthersSigner, walletClientToSigner } from 'hooks/useEthersSigner';
import { enabledDarkModeAtom } from 'store/app.store';
import { poolsAtom, selectedPoolAtom } from 'store/pools.store';
import { LanguageE } from 'types/enums';
import { switchChain } from 'utils/switchChain';

const WIDGET_CN_KEY = 'zh';

function modifyLanguage(languageKey?: string) {
  if (languageKey === LanguageE.CN) {
    return WIDGET_CN_KEY;
  }
  return languageKey;
}

export const LiFiWidgetHolder = () => {
  const { i18n, t } = useTranslation();

  const chainId = useChainId();
  const { connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const signer = useEthersSigner();
  const widgetEvents = useWidgetEvents();

  const enabledDarkMode = useAtomValue(enabledDarkModeAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const pools = useAtomValue(poolsAtom);

  const [triggerSwap, setTriggerSwap] = useState(false);

  const admissibleTokens = useMemo(() => {
    return pools.map(({ marginTokenAddr }) => ({
      chainId: chainId,
      address: marginTokenAddr,
    }));
  }, [pools, chainId]);

  const widgetConfig: WidgetConfig = useMemo(() => {
    const currentLanguage = (modifyLanguage(i18n.resolvedLanguage) as LanguageKey) || LanguageE.EN;

    const config: WidgetConfig = {
      integrator: 'li-fi-widget',
      walletManagement: {
        signer,
        connect: async () => {
          const walletClient = await getWalletClient(wagmiConfigForLifi, { connector: connectors[0] });
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
      toChain: chainId,
      toToken: selectedPool?.marginTokenAddr,
      hiddenUI: ['language', 'appearance'],
      appearance: enabledDarkMode ? 'dark' : 'light',
      languages: {
        default: currentLanguage,
        allow: [LanguageE.EN, LanguageE.DE, LanguageE.ES, LanguageE.FR, WIDGET_CN_KEY],
      },
      languageResources: {
        [currentLanguage]: {
          header: {
            exchange: t(`common.li-fi-widget.header-${triggerSwap ? 'from' : 'to'}`),
          },
        },
      },
      sdkConfig: {
        defaultRouteOptions: {
          maxPriceImpact: 0.4, // increases threshold to 40%
        },
      },
      chains: {
        [triggerSwap ? 'allowFrom' : 'allowTo']: [...appConfig.enabledChains],
      },
      tokens: {
        [triggerSwap ? 'allowFrom' : 'allowTo']: admissibleTokens,
      },
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
  }, [triggerSwap, chainId, selectedPool, signer, connectors, disconnect, t, i18n, enabledDarkMode, admissibleTokens]);

  useEffect(() => {
    const onExchangeReversed = () => {
      setTriggerSwap((prevState) => !prevState);
    };
    widgetEvents.on(WidgetEvent.ExchangeReversed, onExchangeReversed);
    return () => widgetEvents.all.clear();
  }, [widgetEvents]);

  return <LiFiWidget integrator="li-fi-widget" config={widgetConfig} />;
};
