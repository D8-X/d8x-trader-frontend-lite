import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

import { CircularProgress } from '@mui/material';

import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { useFetchOpenRewards } from 'pages/refer-page/components/trader-tab/useFetchOpenRewards';
import { poolsAtom, traderAPIAtom } from 'store/pools.store';
import { isEnabledChain } from 'utils/isEnabledChain';

import { AccountValue } from './components/AccountValue/AccountValue';
import { AssetsBlock } from './components/AssetsBlock/AssetsBlock';
import { fetchPortfolioAtom } from './store/fetchPortfolio';

import styles from './PortfolioPage.module.scss';

export const PortfolioPage = () => {
  const { address, chainId } = useAccount();

  const { openRewards } = useFetchOpenRewards();

  const pools = useAtomValue(poolsAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const fetchPortfolio = useSetAtom(fetchPortfolioAtom);

  const [isLoading, setLoading] = useState(true);

  const requestSentRef = useRef(false);

  useEffect(() => {
    if (
      requestSentRef.current ||
      !traderAPI ||
      !address ||
      !isEnabledChain(chainId) ||
      !pools.length ||
      pools.some(({ poolId }) => poolId === 0)
    ) {
      return;
    }

    requestSentRef.current = true;

    fetchPortfolio(address!, chainId, openRewards)
      .then()
      .catch(console.error)
      .finally(() => {
        requestSentRef.current = false;
        setLoading(false);
      });
  }, [openRewards, traderAPI, address, chainId, pools, fetchPortfolio]);

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
