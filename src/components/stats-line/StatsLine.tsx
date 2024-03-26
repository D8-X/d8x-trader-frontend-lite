import classNames from 'classnames';
import { memo } from 'react';

import { Tooltip, Typography } from '@mui/material';

import type { StatDataI } from './types';

import styles from './StatsLine.module.scss';

interface StatsLinePropsI {
  items: StatDataI[];
}

export const StatsLine = memo(({ items }: StatsLinePropsI) => (
  <div className={styles.root}>
    {items.map((item) => (
      <div key={item.id} className={styles.statContainer}>
        {item.tooltip ? (
          <Tooltip title={item.tooltip}>
            <Typography variant="bodyTiny" className={classNames(styles.statLabel, styles.tooltip)}>
              {item.label}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="bodyTiny" className={styles.statLabel}>
            {item.label}
          </Typography>
        )}
        <Typography variant="bodyLarge" className={styles.statValue}>
          {item.numberOnly}
        </Typography>
        <Typography variant="bodyTiny" className={styles.statCurrency}>
          {item.currencyOnly}
        </Typography>
      </div>
    ))}
  </div>
));
