import classnames from 'classnames';
import { memo } from 'react';

import { Box } from '@mui/material';

import styles from './Separator.module.scss';

interface SeparatorPropsI {
  className?: string;
}

export const Separator = memo(({ className }: SeparatorPropsI) => {
  return (
    <Box className={classnames(styles.root, className)}>
      <div className={styles.line}></div>
    </Box>
  );
});
