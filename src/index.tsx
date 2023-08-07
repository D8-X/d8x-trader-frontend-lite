import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Provider as JotaiProvider } from 'jotai';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';

import { chains, wagmiClient } from 'blockchain-api/wagmi/wagmiClient';
import { Disclaimer } from 'components/disclaimer/disclaimer';
// import { CandlesWebSocketContextProvider } from 'context/websocket-context/candles/CandlesWebSocketContextProvider';
// import { WebSocketContextProvider } from 'context/websocket-context/d8x/WebSocketContextProvider';
import { theme } from 'styles/theme/theme';

import { MyApp } from './MyApp';

import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.scss';

import 'wagmi/window';

const container = document.getElementById('root');

console.log('hello', container);

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <JotaiProvider>
        <HelmetProvider>
          {/*
          <WebSocketContextProvider>
            <CandlesWebSocketContextProvider>
            */}
          <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider
              chains={chains}
              initialChain={80001}
              appInfo={{ appName: 'D8X', disclaimer: Disclaimer, learnMoreUrl: 'https://d8x.exchange/' }}
              modalSize="compact"
            >
              <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>
                  <BrowserRouter>
                    <MyApp />
                  </BrowserRouter>
                </ThemeProvider>
              </StyledEngineProvider>
            </RainbowKitProvider>
          </WagmiConfig>
          {/*
            </CandlesWebSocketContextProvider>
          </WebSocketContextProvider>
          */}
        </HelmetProvider>
      </JotaiProvider>
    </StrictMode>
  );
}
