import classnames from 'classnames';
import { memo, type ReactNode, useMemo } from 'react';

import styles from './PumpOMeter.module.scss';

interface PumpOMeterPropsI {
  totalBoost: number;
}

const DIVISIONS_COUNT = 20;

export const PumpOMeter = memo(({ totalBoost }: PumpOMeterPropsI) => {
  const divisions: ReactNode[] = [];
  const sqrtBoost = totalBoost ? totalBoost ** 0.5 : 0;

  for (let i = 0; i < DIVISIONS_COUNT; i++) {
    divisions.push(
      <div
        key={i}
        className={classnames(styles.division, { [styles.done]: totalBoost > 0 && (i / 20) * 10 + 0.5 < sqrtBoost })}
      />
    );
  }

  const totalBoostFixed = useMemo(() => {
    if (totalBoost <= 10) {
      return totalBoost.toFixed(1);
    }
    if (totalBoost < 100) {
      return totalBoost.toFixed(0);
    }
    return totalBoost.toFixed(0);
  }, [totalBoost]);

  return (
    <div className={styles.root}>
      <div className={styles.divisionsHolder}>{divisions}</div>
      <div className={styles.value}>{totalBoostFixed} x</div>
    </div>
  );
});
