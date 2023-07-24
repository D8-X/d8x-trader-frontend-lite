import { useAtom } from 'jotai';
import { memo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, useChainId } from 'wagmi';

import { Box } from '@mui/material';

import { Container } from 'components/container/Container';
import { Footer } from 'components/footer/Footer';
import { LiquidityPoolsSelect } from 'components/header/elements/liquidity-pools-select/LiquidityPoolsSelect';
import { Header } from 'components/header/Header';
import { getOpenWithdrawals } from 'network/history';
import { GlobalStats } from 'pages/vault-page/components/global-stats/GlobalStats';
import { LiquidityBlock } from 'pages/vault-page/components/liquidity-block/LiquidityBlock';
import { selectedLiquidityPoolAtom, triggerWithdrawalsUpdateAtom, withdrawalsAtom } from 'store/vault-pools.store';

import styles from './VaultPage.module.scss';

export const VaultPage = memo(() => {
  const chainId = useChainId();
  const { address } = useAccount();

  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
  const [triggerUserStatsUpdate] = useAtom(triggerWithdrawalsUpdateAtom);
  const [, setWithdrawals] = useAtom(withdrawalsAtom);

  const withdrawalsRequestSentRef = useRef(false);

  useEffect(() => {
    if (!chainId || !selectedLiquidityPool || !address) {
      setWithdrawals([]);
      return;
    }

    if (withdrawalsRequestSentRef.current) {
      return;
    }

    withdrawalsRequestSentRef.current = true;

    getOpenWithdrawals(chainId, address, selectedLiquidityPool.poolSymbol)
      .then(({ withdrawals }) => setWithdrawals(withdrawals))
      .catch(console.error)
      .finally(() => {
        withdrawalsRequestSentRef.current = false;
      });
  }, [chainId, address, selectedLiquidityPool, setWithdrawals, triggerUserStatsUpdate]);

  return (
    <>
      <Helmet>
        <title>{`${selectedLiquidityPool?.poolSymbol} Vault | D8X App`}</title>
      </Helmet>
      <Box className={styles.root}>
        <Header>
          <LiquidityPoolsSelect />
        </Header>
        <Container className={styles.container}>
          <GlobalStats />
          <LiquidityBlock />
        </Container>
        <Footer />
      </Box>
    </>
  );
});
