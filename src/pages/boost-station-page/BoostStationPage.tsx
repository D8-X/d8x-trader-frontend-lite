import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';

import { BoostStats } from './components/boost-stats/BoostStats';

import styles from './BoostStationPage.module.scss';

export const BoostStationPage = () => {
  return (
    <>
      <Helmet title="Boost Station | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>
            <BoostStats />
          </Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};
