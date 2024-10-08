import classnames from 'classnames';
import { memo } from 'react';

import { useMediaQuery, useTheme } from '@mui/material';

import MobileBackground from 'assets/background/mobile-background.svg?react';

import styles from './StaticBackground.module.scss';

const FIGURES_ARRAY = ['left-top-1', 'right-top-1', 'center-bottom-1', 'center-bottom-2'];

export const StaticBackground = memo(() => {
  const theme = useTheme();
  const isUpToDesktop = useMediaQuery(theme.breakpoints.down('lg'));

  if (isUpToDesktop) {
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
