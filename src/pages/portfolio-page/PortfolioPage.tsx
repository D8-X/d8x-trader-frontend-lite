import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { CircularProgress } from '@mui/material';

import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { poolsAtom } from 'store/pools.store';

import { AccountValue } from './components/AccountValue/AccountValue';
import { AssetsBlock } from './components/AssetsBlock/AssetsBlock';
import { useFetchCalculations } from './hooks/useFetchCalculations';
import { accountValueAtom } from './store/portfolio.store';
import { totalReferralRewardsAtom } from './store/fetchTotalReferralsRewards';
import { totalMarginAtom, totalUnrealizedPnLAtom } from './store/fetchUnrealizedPnL';
import { poolShareTokensUSDBalanceAtom } from './store/fetchPoolShare';
import { syntheticPositionUSDAtom } from './store/fetchStrategySyntheticPosition';
import { poolTokensUSDBalanceAtom } from './store/fetchPoolTokensUSDBalance';

import styles from './PortfolioPage.module.scss';

export const PortfolioPage = () => {
  useFetchCalculations();

  const pools = useAtomValue(poolsAtom);
  const totalMargin = useAtomValue(totalMarginAtom);
  const totalUnrealizedPnL = useAtomValue(totalUnrealizedPnLAtom);
  const poolShareTokensUSDBalance = useAtomValue(poolShareTokensUSDBalanceAtom);
  const syntheticPositionUSD = useAtomValue(syntheticPositionUSDAtom);
  const totalReferralRewards = useAtomValue(totalReferralRewardsAtom);
  const poolTokensUSDBalance = useAtomValue(poolTokensUSDBalanceAtom);
  const setAccountValue = useSetAtom(accountValueAtom);

  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!pools.length || pools.some(({ poolId }) => poolId === 0)) {
      return;
    }

    const accountValue =
      poolTokensUSDBalance +
      (totalMargin || 0) +
      (totalUnrealizedPnL || 0) +
      (poolShareTokensUSDBalance || 0) +
      (syntheticPositionUSD || 0) +
      (totalReferralRewards || 0);

    setLoading(false);
    setAccountValue(accountValue);
  }, [
    pools,
    totalMargin,
    totalUnrealizedPnL,
    poolShareTokensUSDBalance,
    syntheticPositionUSD,
    totalReferralRewards,
    poolTokensUSDBalance,
    setAccountValue,
  ]);

  if (isLoading) {
    return (
      <div className={styles.spinnerContainer}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <Helmet title="Portfolio | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container>
            <div className={styles.container}>
              <AccountValue />
              <AssetsBlock />
            </div>
          </Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};
