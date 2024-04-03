import { useAtomValue } from 'jotai';

import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { strategyAddressAtom } from 'store/strategies.store';

import { ConnectBlock } from './components/connect-block/ConnectBlock';
import { StrategyBlock } from './components/strategy-block/StrategyBlock';

import styles from './StrategiesPage.module.scss';

export const StrategiesPage = () => {
  const strategyAddress = useAtomValue(strategyAddressAtom);

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
