import { ReactElement, ReactNode } from 'react';

import { Tooltip, useMediaQuery } from '@mui/material';

const HIDE_DELAY = 5_000; // 5sec

interface TooltipMobilePropsI {
  tooltip: ReactNode;
  children: ReactElement;
}

export const TooltipMobile = ({ tooltip, children }: TooltipMobilePropsI) => {
  const isMobile = useMediaQuery('(max-width: 600px)');

  return isMobile ? (
    // If it's mobile, don't render the tooltip, just the children
    <>{children}</>
  ) : (
    <Tooltip title={tooltip} enterTouchDelay={0} leaveTouchDelay={HIDE_DELAY}>
      {children}
    </Tooltip>
  );
};
