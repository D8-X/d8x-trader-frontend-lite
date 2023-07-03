import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import type { StatDataI } from './types';

import styles from './StatsLine.module.scss';

interface StatsLinePropsI {
  items: StatDataI[];
}

export const StatsLine = memo(({ items }: StatsLinePropsI) => (
  <Box className={styles.root}>
    {items.map((item) => (
      <Box key={item.id} className={styles.statContainer}>
        <Typography variant="bodyTiny" className={styles.statLabel}>
          {item.label}
        </Typography>
        <Typography variant="bodyLarge" className={styles.statValue}>
          {item.value}
        </Typography>
      </Box>
    ))}
  </Box>
));
