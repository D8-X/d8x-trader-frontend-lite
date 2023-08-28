import { useAtom } from 'jotai';
import { memo, useEffect } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { Box } from '@mui/material';

import { ReferralConfirmModal } from 'components/referral-confirm-modal/ReferralConfirmModal';
import { StaticBackground } from 'components/static-background/StaticBackground';
import { ReferPage } from 'pages/refer-page/ReferPage';
import { WelcomeModal } from 'components/welcome-modal/WelcomeModal';
import { TraderPage } from 'pages/trader-page/TraderPage';
import { VaultPage } from 'pages/vault-page/VaultPage';
import { appDimensionsAtom } from 'store/app.store';
import { PageE } from 'types/enums';

import 'core-js/es/promise';
import 'core-js/es/array';
import 'core-js/es/string';
import 'core-js/es/map';
import 'core-js/es/number';
import 'core-js/es/math';
import 'core-js/es/array';
import 'core-js/es/object';

import styles from './App.module.scss';

export const App = memo(() => {
  const { width, height, ref } = useResizeDetector();

  const [, setDimensions] = useAtom(appDimensionsAtom);

  useEffect(() => {
    setDimensions({ width, height });
  }, [width, height, setDimensions]);

  return (
    <Box className={styles.root} ref={ref}>
      <Box className={styles.content}>
        <StaticBackground />
        <Routes>
          <Route key="vault-page" path={PageE.Vault} element={<VaultPage />} />
          <Route key="refer-page" path={PageE.Refer} element={<ReferPage />} />
          <Route key="trader-page" path="*" element={<TraderPage />} />
        </Routes>
        <WelcomeModal />
        <ReferralConfirmModal />
        <ToastContainer position="top-left" autoClose={10_000} />
      </Box>
    </Box>
  );
});
