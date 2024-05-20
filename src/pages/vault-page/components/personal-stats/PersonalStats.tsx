import { useAtom, useAtomValue } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Box, Typography } from '@mui/material';

import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { getEarnings } from 'network/history';
import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import {
  sdkConnectedAtom,
  triggerUserStatsUpdateAtom,
  userAmountAtom,
  withdrawalOnChainAtom,
  withdrawalsAtom,
} from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { isEnabledChain } from 'utils/isEnabledChain';

import styles from './PersonalStats.module.scss';

interface PersonalStatsPropsI {
  withdrawOn: string;
}

export const PersonalStats = memo(({ withdrawOn }: PersonalStatsPropsI) => {
  const { t } = useTranslation();

  const { address, chainId } = useAccount();

  const selectedPool = useAtomValue(selectedPoolAtom);
  const withdrawals = useAtomValue(withdrawalsAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const triggerUserStatsUpdate = useAtomValue(triggerUserStatsUpdateAtom);
  const isSDKConnected = useAtomValue(sdkConnectedAtom);
  const hasOpenRequestOnChain = useAtomValue(withdrawalOnChainAtom);
  const [userAmount, setUserAmount] = useAtom(userAmountAtom);

  const [estimatedEarnings, setEstimatedEarnings] = useState<number>();

  const earningsRequestSentRef = useRef(false);

  useEffect(() => {
    setUserAmount(null);
    if (selectedPool?.poolSymbol && traderAPI && isSDKConnected && address && isEnabledChain(chainId)) {
      traderAPI.getPoolShareTokenBalance(address, selectedPool.poolSymbol).then((amount) => {
        setUserAmount(amount);
      });
    }
  }, [selectedPool?.poolSymbol, traderAPI, isSDKConnected, address, chainId, triggerUserStatsUpdate, setUserAmount]);

  useEffect(() => {
    if (!selectedPool?.poolSymbol || !address || !isEnabledChain(chainId)) {
      setEstimatedEarnings(undefined);
      return;
    }

    if (earningsRequestSentRef.current) {
      return;
    }

    earningsRequestSentRef.current = true;

    getEarnings(chainId, address, selectedPool.poolSymbol)
      .then(({ earnings }) => setEstimatedEarnings(earnings))
      .catch(console.error)
      .finally(() => {
        earningsRequestSentRef.current = false;
      });
  }, [chainId, address, selectedPool?.poolSymbol, triggerUserStatsUpdate]);

  return (
    <Box className={styles.root}>
      <Typography variant="h5" className={styles.heading}>
        {t('pages.vault.personal-stats.title')}
      </Typography>
      <Box key="amount" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoLabelBlock
            title={t('pages.vault.personal-stats.amount.title')}
            content={
              <Typography>
                {t('pages.vault.personal-stats.amount.info', { poolSymbol: selectedPool?.poolSymbol })}
              </Typography>
            }
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {userAmount !== undefined ? formatToCurrency(userAmount, `d${selectedPool?.poolSymbol}`, true) : '--'}
        </Typography>
      </Box>
      <Box key="estimatedEarnings" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoLabelBlock
            title={t('pages.vault.personal-stats.earnings.title')}
            content={
              <>
                <Typography>{t('pages.vault.personal-stats.earnings.info1')}</Typography>
                <Typography>
                  {t('pages.vault.personal-stats.earnings.info2', { poolSymbol: selectedPool?.poolSymbol })}
                </Typography>
              </>
            }
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {estimatedEarnings !== undefined
            ? formatToCurrency(
                estimatedEarnings < -0.0000000001 ? estimatedEarnings : Math.max(estimatedEarnings, 0),
                selectedPool?.poolSymbol,
                false,
                Math.max(2, Math.ceil(4 - Math.log10(Math.max(Math.abs(estimatedEarnings), 0.0000000001))))
              )
            : '--'}
        </Typography>
      </Box>
      <Box key="withdrawalInitiated" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoLabelBlock
            title={t('pages.vault.personal-stats.initiated.title')}
            content={
              <Typography>
                {t('pages.vault.personal-stats.initiated.info1', { poolSymbol: selectedPool?.poolSymbol })}
              </Typography>
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
                    poolSymbol: selectedPool?.poolSymbol,
                  })}
                </Typography>
                <Typography>
                  {t('pages.vault.personal-stats.withdrawal-amount.info2', { poolSymbol: selectedPool?.poolSymbol })}
                </Typography>
              </>
            }
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {withdrawals && withdrawals.length > 0
            ? formatToCurrency(withdrawals[withdrawals.length - 1].shareAmount, `d${selectedPool?.poolSymbol}`)
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
  );
});
