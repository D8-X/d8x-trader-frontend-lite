import { useAtom } from 'jotai';

import { useMediaQuery, useTheme } from '@mui/material';

import ViewChartIcon from 'assets/icons/new/graph.svg?react';
import { MarketSelect } from 'components/market-select/MarketSelect';
import { ToggleButton } from 'components/toggle-button/ToggleButton';
import { showChartForMobileAtom } from 'store/pools.store';

import styles from './MobileMarketSelect.module.scss';

export const MobileMarketSelect = () => {
  const theme = useTheme();
  const isUpToMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [showChartForMobile, setShowChartForMobile] = useAtom(showChartForMobileAtom);

  if (!isUpToMobileScreen) {
    return null;
  }

  return (
    <div className={styles.root}>
      <MarketSelect />
      <div className={styles.chartToggle}>
        <div className={styles.viewChart} onClick={() => setShowChartForMobile(!showChartForMobile)}>
          <ViewChartIcon className={styles.viewChartIcon} />
          <ToggleButton isActive={showChartForMobile} />
        </div>
      </div>
    </div>
  );
};
