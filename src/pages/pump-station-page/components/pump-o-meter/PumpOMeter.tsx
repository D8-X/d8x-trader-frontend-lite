import classnames from 'classnames';
import { memo, type ReactNode } from 'react';

import styles from './PumpOMeter.module.scss';

interface PumpOMeterPropsI {
  percent: number;
}

const DIVISIONS_COUNT = 20;

export const PumpOMeter = memo(({ percent }: PumpOMeterPropsI) => {
  const divisions: ReactNode[] = [];
  for (let i = 0; i < DIVISIONS_COUNT; i++) {
    divisions.push(<div className={classnames(styles.division, { [styles.done]: (i / 20) * 100 <= percent })} />);
  }

  return (
    <div className={styles.root}>
      <div className={styles.divisionsHolder}>{divisions}</div>
      <div className={styles.value}>{percent}</div>
    </div>
  );
});
