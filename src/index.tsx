import { Provider as JotaiProvider } from 'jotai';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.scss';
import { LiFiWidgetModal } from './components/li-fi-widget-modal/LiFiWidgetModal';

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
                <WagmiProvider config={wagmiConfig}>
                  <QueryClientProvider client={queryClient}>
                    <RainbowKitProviderWrapper>
                      <Web3AuthProvider>
                        <UserWalletProvider>
                          <WebSocketContextProvider>
                            <BrowserRouter>
                              <StaticBackground />
                              <App />
                            </BrowserRouter>

                            <LiFiWidgetModal />
                          </WebSocketContextProvider>
                        </UserWalletProvider>
                      </Web3AuthProvider>
                    </RainbowKitProviderWrapper>
                  </QueryClientProvider>
                </WagmiProvider>
              </GeoBlockingProvider>
              <ThemeApplier />
            </ThemeProvider>
          </StyledEngineProvider>
        </HelmetProvider>
      </JotaiProvider>
    </StrictMode>
  );
}
