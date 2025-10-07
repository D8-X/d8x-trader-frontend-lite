import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { StaticBackground } from 'components/static-background/StaticBackground';
import { ThemeApplier } from 'components/theme-applier/ThemeApplier';
import { GeoBlockingProvider } from 'context/geo-blocking-context/GeoBlockingContext';
import { UserWalletProvider } from 'context/user-wallet-context/UserWalletContext';
import { Web3AuthProvider } from 'context/web3-auth-context/Web3AuthContext';
import { WebSocketContextProvider } from 'context/websocket-context/d8x/WebSocketContextProvider';
import { theme } from 'styles/theme/theme';

import { App } from './App';
import { RainbowKitProviderWrapper } from './RainbowKitProviderWrapper';
import './i18n';
import './polyfills';

import { PrivyProvider } from '@privy-io/react-auth';
import '@rainbow-me/rainbowkit/styles.css';
import '@splidejs/react-splide/css';
import { privyConfig } from 'blockchain-api/privy/privyConfig';
import { config } from 'config';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.scss';

const container = document.getElementById('root');

const queryClient = new QueryClient();

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <JotaiProvider>
        <HelmetProvider>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
              <GeoBlockingProvider>
                <PrivyProvider appId={config.privyAppId} config={privyConfig}>
                  <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={wagmiConfig}>
                      <BrowserRouter>
                        <RainbowKitProviderWrapper>
                          <Web3AuthProvider>
                            <UserWalletProvider>
                              <WebSocketContextProvider>
                                <StaticBackground />
                                <App />
                              </WebSocketContextProvider>
                            </UserWalletProvider>
                          </Web3AuthProvider>
                        </RainbowKitProviderWrapper>
                      </BrowserRouter>
                    </WagmiProvider>
                  </QueryClientProvider>
                </PrivyProvider>
              </GeoBlockingProvider>
              <ThemeApplier />
            </ThemeProvider>
          </StyledEngineProvider>
        </HelmetProvider>
      </JotaiProvider>
    </StrictMode>
  );
}
