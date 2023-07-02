import { useAtom } from 'jotai';
import { memo, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Box } from '@mui/material';

import { Container } from 'components/container/Container';
import { Footer } from 'components/footer/Footer';
import { LiquidityPoolsSelect } from 'components/header/elements/luquidity-pools-select/LiquidityPoolsSelect';
import { Header } from 'components/header/Header';
import { GlobalStats } from 'components/global-stats/GlobalStats';
import { LiquidityBlock } from 'components/liquidity-block/LiquidityBlock';
import { PersonalStats } from 'components/personal-stats/PersonalStats';
import { getOpenWithdrawals } from 'network/history';
import { selectedLiquidityPoolAtom, withdrawalsAtom } from 'store/vault-pools.store';

import styles from './VaultPage.module.scss';

export const VaultPage = memo(() => {
  const chainId = useChainId();
  const { address } = useAccount();

  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
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
      .finally(() => {
        withdrawalsRequestSentRef.current = false;
      });
  }, [chainId, address, selectedLiquidityPool, setWithdrawals]);

  return (
    <Box className={styles.root}>
      <Header>
        <LiquidityPoolsSelect />
      </Header>
      <Container className={styles.container}>
        <GlobalStats />
        <PersonalStats />
        <LiquidityBlock />
      </Container>
      <Footer />
    </Box>
  );
});
