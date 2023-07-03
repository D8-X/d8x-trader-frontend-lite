import { useAtom } from 'jotai';
import { memo } from 'react';

import { Box } from '@mui/material';

import { Separator } from 'components/separator/Separator';
import { liquidityTypeAtom } from 'store/vault-pools.store';
import { LiquidityTypeE } from 'types/enums';

import { Add } from './elements/actions/Add';
import { Initiate } from './elements/actions/Initiate';
import { Withdraw } from './elements/actions/Withdraw';
import { LiquidityTypeSelector } from './elements/liquidity-type-selector/LiquidityTypeSelector';

import styles from './LiquidityBlock.module.scss';
import { PersonalStats } from '../personal-stats/PersonalStats';

export const LiquidityBlock = memo(() => {
  const [liquidityType] = useAtom(liquidityTypeAtom);

  return (
    <Box className={styles.root}>
      <Box className={styles.infoBlock}>
        <PersonalStats />
      </Box>
      <Box className={styles.actionBlock}>
        <LiquidityTypeSelector />
        <Separator className={styles.separator} />
        {liquidityType === LiquidityTypeE.Add && <Add />}
        {liquidityType === LiquidityTypeE.Initiate && <Initiate />}
        {liquidityType === LiquidityTypeE.Withdraw && <Withdraw />}
      </Box>
    </Box>
  );
});
