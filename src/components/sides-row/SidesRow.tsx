import type { ReactNode } from 'react';

import { Typography } from '@mui/material';

import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';

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
          <TooltipMobile tooltip={leftSideTooltip}>
            <span className={styles.tooltip}>{leftSide}</span>
          </TooltipMobile>
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
