import { Provider as JotaiProvider } from 'jotai';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';

import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { StaticBackground } from 'components/static-background/StaticBackground';
import { ThemeApplier } from 'components/theme-applier/ThemeApplier';
import { GeoBlockingProvider } from 'context/geo-blocking-context/GeoBlockingContext';
import { WebSocketContextProvider } from 'context/websocket-context/d8x/WebSocketContextProvider';
import { theme } from 'styles/theme/theme';

import { App } from './App';
import { RainbowKitProviderWrapper } from './RainbowKitProviderWrapper';
import './i18n';
import './polyfills';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.scss';

import 'wagmi/window';
import { EagerConnectionWrapper } from 'EagerConnectionWrapper';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <JotaiProvider>
        <HelmetProvider>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
              <GeoBlockingProvider>
                <WagmiConfig config={wagmiConfig}>
                  <EagerConnectionWrapper>
                    <RainbowKitProviderWrapper>
                      <WebSocketContextProvider>
                        <BrowserRouter>
                          <StaticBackground />
                          <App />
                        </BrowserRouter>
                      </WebSocketContextProvider>
                    </RainbowKitProviderWrapper>
                  </EagerConnectionWrapper>
                </WagmiConfig>
              </GeoBlockingProvider>
              <ThemeApplier />
            </ThemeProvider>
          </StyledEngineProvider>
        </HelmetProvider>
      </JotaiProvider>
    </StrictMode>
  );
}
