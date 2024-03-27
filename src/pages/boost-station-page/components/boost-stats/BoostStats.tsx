import { Overview } from '../overview/Overview';
import { BoostStationBlock } from '../boost-station-block/BoostStationBlock';

import styles from './BoostStats.module.scss';

export const BoostStats = () => (
  <div className={styles.root}>
    <Overview />
    <BoostStationBlock />
  </div>
);
