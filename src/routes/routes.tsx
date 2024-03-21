import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { pagesConfig } from 'config';

import { PrivateRoutes } from './PrivateRoutes';
import { RoutesE } from './RoutesE';

const BoostStationPage = lazy(async () => ({
  default: (await import('pages/boost-station-page/BoostStationPage')).BoostStationPage,
}));
const ReferPage = lazy(async () => ({ default: (await import('pages/refer-page/ReferPage')).ReferPage }));
const VaultPage = lazy(async () => ({ default: (await import('pages/vault-page/VaultPage')).VaultPage }));
const TraderPage = lazy(async () => ({ default: (await import('pages/trader-page/TraderPage')).TraderPage }));
const PortfolioPage = lazy(async () => ({
  default: (await import('pages/portfolio-page/PortfolioPage')).PortfolioPage,
}));

export const AppRoutes = () => {
  return (
    <Routes>
      {pagesConfig.enabledBoostStationPage && (
        <Route key="boost-station-page" path={RoutesE.BoostStation} element={<BoostStationPage />} />
      )}
      {pagesConfig.enabledVaultPage && <Route key="vault-page" path={RoutesE.Vault} element={<VaultPage />} />}
      {pagesConfig.enabledReferPage && <Route key="refer-page" path={RoutesE.Refer} element={<ReferPage />} />}
      {pagesConfig.enabledPortfolioPage && (
        <Route element={<PrivateRoutes />}>
          <Route path={RoutesE.Portfolio} element={<PortfolioPage />} />
        </Route>
      )}
      <Route key="trader-page" path="*" element={<TraderPage />} />
    </Routes>
  );
};
