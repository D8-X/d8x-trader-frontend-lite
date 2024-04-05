import { useAtomValue } from 'jotai';
import { useAccount } from 'wagmi';

import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';
import { strategyAddressesAtom } from 'store/strategies.store';

import { ConnectBlock } from './components/connect-block/ConnectBlock';
import { StrategyBlock } from './components/strategy-block/StrategyBlock';

import styles from './StrategiesPage.module.scss';

export const StrategiesPage = () => {
  const { address } = useAccount();

  const strategyAddresses = useAtomValue(strategyAddressesAtom);

  return (
    <>
      <Helmet title="Strategies | D8X App" />
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
