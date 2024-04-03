import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { pagesConfig } from 'config';

import { PrivateRoutes } from './PrivateRoutes';
import { RoutesE } from './RoutesE';
import { useChainId } from 'wagmi';

const BoostStationPage = lazy(async () => ({
  default: (await import('pages/boost-station-page/BoostStationPage')).BoostStationPage,
}));
const ReferPage = lazy(async () => ({ default: (await import('pages/refer-page/ReferPage')).ReferPage }));
const VaultPage = lazy(async () => ({ default: (await import('pages/vault-page/VaultPage')).VaultPage }));
const TraderPage = lazy(async () => ({ default: (await import('pages/trader-page/TraderPage')).TraderPage }));
const StrategiesPage = lazy(async () => ({
  default: (await import('pages/strategies-page/StrategiesPage')).StrategiesPage,
}));
const PortfolioPage = lazy(async () => ({
  default: (await import('pages/portfolio-page/PortfolioPage')).PortfolioPage,
}));

export const AppRoutes = () => {
  const chainId = useChainId();

  return (
    <Routes>
      {pagesConfig.enabledBoostStationPage && (
        <Route key="boost-station-page" path={RoutesE.BoostStation} element={<BoostStationPage />} />
      )}
      {pagesConfig.enabledVaultPage && <Route key="vault-page" path={RoutesE.Vault} element={<VaultPage />} />}
      {pagesConfig.enabledReferPage && <Route key="refer-page" path={RoutesE.Refer} element={<ReferPage />} />}
      {(pagesConfig.enabledStrategiesPage || pagesConfig.enabledPortfolioPage) && (
        <Route element={<PrivateRoutes />}>
          {pagesConfig.enabledStrategiesPage && pagesConfig.enabledStrategiesPageByChains.includes(chainId) && (
            <Route path={RoutesE.Strategies} element={<StrategiesPage />} />
          )}
          {pagesConfig.enabledPortfolioPage && <Route path={RoutesE.Portfolio} element={<PortfolioPage />} />}
        </Route>
      )}
      <Route key="trader-page" path="*" element={<TraderPage />} />
    </Routes>
  );
};
