import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { AppReload } from 'components/app-reload/AppReload';
import { pagesConfig } from 'config';
import { isEnabledChain } from 'utils/isEnabledChain';

import { PrivateRoutes } from './PrivateRoutes';
import { RoutesE } from './RoutesE';

const BoostStationPage = lazy(async () => {
  try {
    const lazyPage = await import('pages/boost-station-page/BoostStationPage');
    return {
      default: lazyPage.BoostStationPage,
    };
  } catch {
    return { default: () => <AppReload /> };
  }
});

const ReferPage = lazy(async () => {
  try {
    const lazyPage = await import('pages/refer-page/ReferPage');
    return {
      default: lazyPage.ReferPage,
    };
  } catch {
    return { default: () => <AppReload /> };
  }
});

const VaultPage = lazy(async () => {
  try {
    const lazyPage = await import('pages/vault-page/VaultPage');
    return {
      default: lazyPage.VaultPage,
    };
  } catch {
    return { default: () => <AppReload /> };
  }
});

const TraderPage = lazy(async () => {
  try {
    const lazyPage = await import('pages/trader-page/TraderPage');
    return {
      default: lazyPage.TraderPage,
    };
  } catch {
    return { default: () => <AppReload /> };
  }
});

const PortfolioPage = lazy(async () => {
  try {
    const lazyPage = await import('pages/portfolio-page/PortfolioPage');
    return {
      default: lazyPage.PortfolioPage,
    };
  } catch {
    return { default: () => <AppReload /> };
  }
});

const LeaderboardPage = lazy(async () => {
  try {
    const lazyPage = await import('pages/leaderboard-page/LeaderboardPage');
    return {
      default: lazyPage.LeaderboardPage,
    };
  } catch {
    return { default: () => <AppReload /> };
  }
});

export const AppRoutes = () => {
  const { chainId } = useAccount();

  return (
    <Routes>
      {pagesConfig.enabledBoostStationPage && (
        <Route key="boost-station-page" path={RoutesE.BoostStation} element={<BoostStationPage />} />
      )}
      {pagesConfig.enabledVaultPage && <Route key="vault-page" path={RoutesE.Vault} element={<VaultPage />} />}
      {pagesConfig.enabledReferPage && <Route key="refer-page" path={RoutesE.Refer} element={<ReferPage />} />}
      <Route key="leaderboard-page" path={RoutesE.Leaderboard} element={<LeaderboardPage />} />
      {(pagesConfig.enabledStrategiesPage || pagesConfig.enabledPortfolioPage) && isEnabledChain(chainId) && (
        <Route element={<PrivateRoutes />}>
          {pagesConfig.enabledPortfolioPage && <Route path={RoutesE.Portfolio} element={<PortfolioPage />} />}
        </Route>
      )}
      <Route key="trader-page" path="*" element={<TraderPage />} />
    </Routes>
  );
};
