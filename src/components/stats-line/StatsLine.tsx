import classNames from 'classnames';
import { memo } from 'react';

import { Typography } from '@mui/material';

import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';

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
          <TooltipMobile tooltip={item.tooltip}>
            <Typography variant="bodyTiny" className={classNames(styles.statLabel, styles.tooltip)}>
              {item.label}
            </Typography>
          </TooltipMobile>
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
