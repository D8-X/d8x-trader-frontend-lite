import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { STRATEGY_SYMBOL } from 'appConstants';
import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { selectedPoolAtom } from 'store/pools.store';
import { strategyAddressesAtom } from 'store/strategies.store';

import { ConnectBlock } from './components/connect-block/ConnectBlock';
import { StrategyBlock } from './components/strategy-block/StrategyBlock';

import styles from './StrategiesPage.module.scss';

export const StrategiesPage = () => {
  const { address } = useAccount();

  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const setSelectedPool = useSetAtom(selectedPoolAtom);

  useEffect(() => {
    setSelectedPool(STRATEGY_SYMBOL.split('-')?.at(-1) ?? '');
  }, [setSelectedPool]);

  return (
    <>
      <Helmet title="Boost Station | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>
            {address && strategyAddresses.some(({ userAddress }) => userAddress === address.toLowerCase()) ? (
              <StrategyBlock />
            ) : (
              <ConnectBlock />
            )}
          </Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};
