import { useAtomValue, useSetAtom } from 'jotai';

import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { strategyAddressAtom } from 'store/strategies.store';

import { ConnectBlock } from './components/connect-block/ConnectBlock';
import { StrategyBlock } from './components/strategy-block/StrategyBlock';

import styles from './StrategiesPage.module.scss';
import { selectedPoolAtom } from 'store/pools.store';
import { STRATEGY_SYMBOL } from 'appConstants';
import { useEffect } from 'react';

export const StrategiesPage = () => {
  const strategyAddress = useAtomValue(strategyAddressAtom);
  const setSelectedPool = useSetAtom(selectedPoolAtom);

  useEffect(() => {
    setSelectedPool(STRATEGY_SYMBOL.split('-')?.at(-1) ?? '');
  }, [setSelectedPool]);

  return (
    <>
      <Helmet title="Boost Station | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>{strategyAddress ? <StrategyBlock /> : <ConnectBlock />}</Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};
