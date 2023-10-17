import classnames from 'classnames';
import { memo } from 'react';

import { useMediaQuery, useTheme } from '@mui/material';

import { ReactComponent as MobileBackground } from 'assets/background/mobile-background.svg';

import styles from './StaticBackground.module.scss';

const FIGURES_ARRAY = ['left-top-1', 'right-top-1', 'center-bottom-1', 'center-bottom-2'];

export const StaticBackground = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  if (isMobile || isTablet) {
    return (
      <div className={classnames(styles.root, styles.fixed)}>
        <MobileBackground className={styles.mobileBackground} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <ul className={styles.figures}>
        {FIGURES_ARRAY.map((name) => (
          <li key={name} data-role={name} />
        ))}
      </ul>
    </div>
  );
});
