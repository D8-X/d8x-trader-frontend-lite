import type { ReactNode } from 'react';

import { Tooltip, Typography } from '@mui/material';

import styles from './SidesRow.module.scss';

interface SidesRowPropsI {
  leftSide: ReactNode;
  leftSideTooltip?: string;
  rightSide: ReactNode;
  leftSideStyles?: string;
  rightSideStyles?: string;
}

export const SidesRow = ({ leftSide, leftSideTooltip, leftSideStyles, rightSide, rightSideStyles }: SidesRowPropsI) => {
  return (
    <div className={styles.root}>
      <Typography variant="bodySmall" className={leftSideStyles}>
        {leftSideTooltip ? (
          <Tooltip title={leftSideTooltip}>
            <span className={styles.tooltip}>{leftSide}</span>
          </Tooltip>
        ) : (
          leftSide
        )}
      </Typography>
      <Typography variant="bodySmall" className={rightSideStyles}>
        {rightSide}
      </Typography>
    </div>
  );
};
