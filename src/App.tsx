import { useSetAtom } from 'jotai';
import { memo, Suspense, useEffect, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { CircularProgress } from '@mui/material';

import { AtomsGlobalUpdates } from 'components/atoms-global-updates/AtomsGlobalUpdates';
import { CedeWidgetModal } from 'components/cede-widget-modal/CedeWidgetModal';
import { ChainSwitchHandler } from 'components/chain-switch-handler/ChainSwitchHandler';
import { ConnectModal } from 'components/connect-modal/ConnectModal';
import { Footer } from 'components/footer/Footer';
import { Header } from 'components/header/Header';
import { MarketSelectModal } from 'components/market-select-modal/MarketSelectModal';
import { ReferralConfirmModal } from 'components/referral-confirm-modal/ReferralConfirmModal';
import { SDKLoader } from 'components/sdk-loader/SDKLoader';
import { WelcomeModal } from 'components/welcome-modal/WelcomeModal';
import { useTabActive } from 'hooks/useTabActive';
import { AppRoutes } from 'routes/routes';
import { appDimensionsAtom } from 'store/app.store';
import { ToastContainerWrapper } from 'ToastContainerWrapper';

import 'core-js/es/array';
import 'core-js/es/map';
import 'core-js/es/math';
import 'core-js/es/number';
import 'core-js/es/object';
import 'core-js/es/promise';
import 'core-js/es/string';

import styles from './App.module.scss';

const INACTIVE_DELAY = 1_800_000; // 30 minutes

export const App = memo(() => {
  const { width, height, ref } = useResizeDetector();

  const setDimensions = useSetAtom(appDimensionsAtom);

  const timerRef = useRef<number | null>(null);

  const isTabActive = useTabActive();

  useEffect(() => {
    if (isTabActive) {
      if (timerRef.current === null) {
        return;
      }

      if (Date.now() - timerRef.current > INACTIVE_DELAY) {
        setTimeout(() => {
          window.location.reload();
        });
      }
      timerRef.current = null;
    } else if (timerRef.current === null) {
      timerRef.current = Date.now();
    }
  }, [isTabActive]);

  useEffect(() => {
    setDimensions({ width, height });
  }, [width, height, setDimensions]);

  return (
    <div className={styles.root} ref={ref}>
      <div className={styles.content}>
        <Header />
        <Suspense
          fallback={
            <div className={styles.spinnerContainer}>
              <CircularProgress />
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
        <Footer />

        <SDKLoader />
        <AtomsGlobalUpdates />
        <WelcomeModal />
        <ReferralConfirmModal />
        <MarketSelectModal />
        <CedeWidgetModal />
        <ChainSwitchHandler />
        <ConnectModal />
        <ToastContainerWrapper />
      </div>
    </div>
  );
});
