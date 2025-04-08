import { useAtomValue } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { flatTokenAtom, selectedPoolAtom } from 'store/pools.store';
import { withdrawalOnChainAtom, withdrawalsAtom } from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './PersonalStats.module.scss';

interface PersonalStatsPropsI {
  withdrawOn: string;
}

export const PersonalStats = memo(({ withdrawOn }: PersonalStatsPropsI) => {
  const { t } = useTranslation();
  const flatToken = useAtomValue(flatTokenAtom);

  const selectedPool = useAtomValue(selectedPoolAtom);
  const withdrawals = useAtomValue(withdrawalsAtom);
  const hasOpenRequestOnChain = useAtomValue(withdrawalOnChainAtom);

  const shareSymbol = `d${selectedPool?.settleSymbol}`;

  const [userSymbol] =
    !!flatToken && selectedPool?.poolId === flatToken.poolId && !!flatToken.registeredSymbol
      ? [flatToken.registeredSymbol]
      : [selectedPool?.poolSymbol ?? ''];

  return (
    <Box className={styles.root}>
      <Box className={styles.rightColumn}>
        <Box key="withdrawalInitiated" className={styles.statContainer}>
          <Box className={styles.statLabel}>
            <InfoLabelBlock
              title={t('pages.vault.personal-stats.initiated.title')}
              content={
                <Typography>{t('pages.vault.personal-stats.initiated.info1', { poolSymbol: userSymbol })}</Typography>
              }
            />
          </Box>
          <Typography variant="bodyMedium" className={styles.statValue}>
            {(withdrawals && withdrawals.length > 0) || hasOpenRequestOnChain ? 'Yes' : 'No'}
          </Typography>
        </Box>
        <Box key="withdrawalAmount" className={styles.statContainer}>
          <Box className={styles.statLabel}>
            <InfoLabelBlock
              title={t('pages.vault.personal-stats.withdrawal-amount.title')}
              content={
                <>
                  <Typography>
                    {t('pages.vault.personal-stats.withdrawal-amount.info1', {
                      shareSymbol,
                    })}
                  </Typography>
                  <Typography>{t('pages.vault.personal-stats.withdrawal-amount.info2')}</Typography>
                </>
              }
            />
          </Box>
          <Typography variant="bodyMedium" className={styles.statValue}>
            {withdrawals && withdrawals.length > 0
              ? formatToCurrency(withdrawals[withdrawals.length - 1].shareAmount, shareSymbol)
              : 'N/A'}
          </Typography>
        </Box>
        <Box key="withdrawalDate" className={styles.statContainer}>
          <Box className={styles.statLabel}>
            <InfoLabelBlock
              title={t('pages.vault.personal-stats.date.title')}
              content={
                <>
                  <Typography>{t('pages.vault.personal-stats.date.info1')}</Typography>
                  <Typography>{t('pages.vault.personal-stats.date.info2')}</Typography>
                </>
              }
            />
          </Box>
          <Typography variant="bodyMedium" className={styles.statValue}>
            {withdrawOn}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});
