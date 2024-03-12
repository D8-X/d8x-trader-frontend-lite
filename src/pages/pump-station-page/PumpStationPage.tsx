import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';
import { MaintenanceWrapper } from 'components/maintenance-wrapper/MaintenanceWrapper';

import { PumpStats } from './components/pump-stats/PumpStats';

import styles from './PumpStationPage.module.scss';

export const PumpStationPage = () => {
  return (
    <>
      <Helmet title="Pump Station | D8X App" />
      <div className={styles.root}>
        <MaintenanceWrapper>
          <Container className={styles.container}>
            <PumpStats />
          </Container>
        </MaintenanceWrapper>
      </div>
    </>
  );
};
