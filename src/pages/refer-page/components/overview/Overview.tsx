import { Box, Typography } from '@mui/material';

import type { OverviewItemI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './Overview.module.scss';

interface OverviewPropsI {
  title: string;
  items: OverviewItemI[];
}

export const Overview = ({ title, items }: OverviewPropsI) => {
  return (
    <Box className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {title}
      </Typography>
      <Box className={styles.dataBlock}>
        {items.map(({ title: itemTitle, poolsItems }) => (
          <Box key={itemTitle}>
            <Typography variant="bodyTiny" component="p" className={styles.dataTitle}>
              {itemTitle}
            </Typography>
            {poolsItems.map(({ symbol, value }) => (
              <Typography variant="bodyMedium" className={styles.dataValue} key={symbol}>
                {typeof value === 'string' ? value : formatToCurrency(value, symbol, true)}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
