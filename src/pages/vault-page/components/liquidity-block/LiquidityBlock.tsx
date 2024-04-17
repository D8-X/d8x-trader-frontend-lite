import { useAtomValue } from 'jotai';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { PERIOD_OF_2_DAYS, PERIOD_OF_4_DAYS } from 'appConstants';
import { Separator } from 'components/separator/Separator';
import { liquidityTypeAtom, withdrawalsAtom } from 'store/vault-pools.store';
import { LiquidityTypeE } from 'types/enums';

import { PersonalStats } from '../personal-stats/PersonalStats';
import { Add } from './elements/actions/Add';
import { Withdraw } from './elements/actions/Withdraw';
import { LiquidityTypeSelector } from './elements/liquidity-type-selector/LiquidityTypeSelector';

import styles from './LiquidityBlock.module.scss';

export const LiquidityBlock = memo(() => {
  const { t } = useTranslation();

  const liquidityType = useAtomValue(liquidityTypeAtom);
  const withdrawals = useAtomValue(withdrawalsAtom);

  const withdrawOn = useMemo(() => {
    if (!withdrawals || withdrawals.length === 0) {
      return t('pages.vault.na');
    }
    const currentTime = Date.now();
    const latestWithdrawalTimeElapsed = withdrawals[withdrawals.length - 1].timeElapsedSec * 1000;

    const withdrawalTime = currentTime + PERIOD_OF_2_DAYS - latestWithdrawalTimeElapsed;
    if (currentTime < withdrawalTime) {
      return format(new Date(withdrawalTime), 'MMMM d yyyy HH:mm');
    } else if (currentTime >= withdrawalTime + PERIOD_OF_4_DAYS) {
      return t('pages.vault.overdue');
    } else {
      return t('pages.vault.now');
    }
  }, [withdrawals, t]);

  return (
    <Box className={styles.root}>
      <Box className={styles.infoBlock}>
        <PersonalStats withdrawOn={withdrawOn} />
      </Box>
      <Box className={styles.actionBlock}>
        <LiquidityTypeSelector />
        <Separator className={styles.separator} />
        {liquidityType === LiquidityTypeE.Add && <Add />}
        {liquidityType === LiquidityTypeE.Withdraw && <Withdraw withdrawOn={withdrawOn} />}
      </Box>
    </Box>
  );
});
