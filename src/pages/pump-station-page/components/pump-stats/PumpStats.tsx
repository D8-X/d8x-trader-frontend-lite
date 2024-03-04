import { Overview } from '../overview/Overview';
import { PumpStationBlock } from '../pump-station-block/PumpStationBlock';

import styles from './PumpStats.module.scss';

export const PumpStats = () => (
  <div className={styles.root}>
    <Overview />
    <PumpStationBlock />
  </div>
);
