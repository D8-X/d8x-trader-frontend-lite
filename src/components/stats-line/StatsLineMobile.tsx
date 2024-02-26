import { useAtom } from 'jotai';
import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import ChartLineIcon from 'assets/icons/chartLineIcon.svg?react';
import { showChartForMobileAtom } from 'store/pools.store';

import type { StatDataI } from './types';

import styles from './StatsLine.module.scss';

interface StatsLinePropsI {
  items: StatDataI[];
}

export const StatsLineMobile = memo(({ items }: StatsLinePropsI) => {
  const [showChartForMobile, setShowChartForMobile] = useAtom(showChartForMobileAtom);

  const handleChartIconClick = () => {
    setShowChartForMobile(!showChartForMobile);
  };

  return (
    <Box className={styles.rootMobile}>
      <Box key={items[0].id} className={styles.statContainer}>
        <Box>
          <Typography variant="bodyTiny" className={styles.statLabel}>
            {items[0].label}
          </Typography>
          <Typography variant="bodyLarge" className={styles.statValue}>
            {items[0].numberOnly}
          </Typography>
          <Typography variant="bodyTiny" className={styles.statCurrency}>
            {items[0].currencyOnly}
          </Typography>
        </Box>
        <Box>
          <Button onClick={handleChartIconClick} className={styles.iconButton} variant="primary">
            <ChartLineIcon />
          </Button>
        </Box>
      </Box>

      <Box key="grouped-stats" className={styles.statContainer}>
        <Box key="column-1">
          {items
            .filter((item) => item.columnNr === 1)
            .map((item) => (
              <Box key={item.id} className={styles.groupedStat}>
                <Typography variant="bodyTiny" className={styles.statLabel}>
                  {item.label}
                </Typography>
                <Typography variant="bodyTiny" className={styles.statValue}>
                  {item.numberOnly}
                </Typography>
              </Box>
            ))}
        </Box>
        <Box key="column-2">
          {items
            .filter((item) => item.columnNr === 2)
            .map((item) => (
              <Box key={item.id} className={styles.groupedStat}>
                <Typography variant="bodyTiny" className={styles.statLabel}>
                  {item.label}
                </Typography>
                <Typography variant="bodyLarge" className={styles.statValue}>
                  {item.value}
                </Typography>
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  );
});
