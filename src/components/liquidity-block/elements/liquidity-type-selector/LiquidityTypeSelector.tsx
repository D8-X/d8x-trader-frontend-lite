import classNames from 'classnames';
import { useAtom } from 'jotai';
import { memo } from 'react';

import { Box, Button } from '@mui/material';

import { liquidityTypeAtom } from 'store/vault-pools.store';
import { LiquidityTypeE } from 'types/enums';

import styles from './LiquidityTypeSelector.module.scss';

export const LiquidityTypeSelector = memo(() => {
  const [liquidityType, setLiquidityType] = useAtom(liquidityTypeAtom);

  return (
    <Box className={styles.root}>
      {Object.values(LiquidityTypeE).map((key) => (
        <Button
          key={key}
          className={classNames({ [styles.selected]: key === liquidityType })}
          variant="link"
          onClick={() => setLiquidityType(key)}
        >
          {LiquidityTypeE[key]}
        </Button>
      ))}
    </Box>
  );
});
