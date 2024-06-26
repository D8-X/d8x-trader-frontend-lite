import { ReactElement, ReactNode } from 'react';

import { Tooltip } from '@mui/material';

const HIDE_DELAY = 5_000; // 5sec

interface TooltipMobilePropsI {
  tooltip: ReactNode;
  children: ReactElement;
}

export const TooltipMobile = ({ tooltip, children }: TooltipMobilePropsI) => {
  return (
    <Tooltip title={tooltip} enterTouchDelay={0} leaveTouchDelay={HIDE_DELAY}>
      {children}
    </Tooltip>
  );
};
