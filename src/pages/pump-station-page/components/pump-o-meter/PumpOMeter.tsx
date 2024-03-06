import classnames from 'classnames';
import { memo, type ReactNode, useMemo } from 'react';

import styles from './PumpOMeter.module.scss';

interface PumpOMeterPropsI {
  percent: number;
}

const DIVISIONS_COUNT = 20;

export const PumpOMeter = memo(({ percent }: PumpOMeterPropsI) => {
  const divisions: ReactNode[] = [];
  for (let i = 0; i < DIVISIONS_COUNT; i++) {
    divisions.push(
      <div
        key={i}
        className={classnames(styles.division, { [styles.done]: percent > 0 && (i / 20) * 100 <= percent })}
      />
    );
  }

  const percentFixed = useMemo(() => {
    if (percent <= 10) {
      return percent.toFixed(2);
    }
    if (percent < 100) {
      return percent.toFixed(1);
    }
    return percent.toFixed(0);
  }, [percent]);

  return (
    <div className={styles.root}>
      <div className={styles.divisionsHolder}>{divisions}</div>
      <div className={styles.value}>{percentFixed}</div>
    </div>
  );
});
