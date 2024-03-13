import { useSetAtom } from 'jotai';
import { memo, Suspense, useEffect } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { Box, CircularProgress } from '@mui/material';

import { Footer } from 'components/footer/Footer';
import { Header } from 'components/header/Header';
import { ReferralConfirmModal } from 'components/referral-confirm-modal/ReferralConfirmModal';
import { SDKLoader } from 'components/sdk-loader/SDKLoader';
import { WelcomeModal } from 'components/welcome-modal/WelcomeModal';
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

export const App = memo(() => {
  const { width, height, ref } = useResizeDetector();

  const setDimensions = useSetAtom(appDimensionsAtom);

  useEffect(() => {
    setDimensions({ width, height });
  }, [width, height, setDimensions]);

  return (
    <Box className={styles.root} ref={ref}>
      <Box className={styles.content}>
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
        <WelcomeModal />
        <ReferralConfirmModal />
        <ToastContainerWrapper />
      </Box>
    </Box>
  );
});
