import { Container } from 'components/container/Container';
import { Helmet } from 'components/helmet/Helmet';

import { PumpStats } from './components/pump-stats/PumpStats';

import styles from './PumpStationPage.module.scss';

export const PumpStationPage = () => {
  return (
    <>
      <Helmet title="Pump Station | D8X App" />
      <div className={styles.root}>
        <Container className={styles.container}>
          <PumpStats />
        </Container>
      </div>
    </>
  );
};
