import { format } from 'date-fns';
import { useAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { PERIOD_OF_2_DAYS, PERIOD_OF_4_DAYS } from 'app-constants';
import { getEarnings } from 'network/history';
import { formatToCurrency } from 'utils/formatToCurrency';
import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import { triggerUserStatsUpdateAtom, sdkConnectedAtom, userAmountAtom, withdrawalsAtom } from 'store/vault-pools.store';

import styles from './PersonalStats.module.scss';

export const PersonalStats = memo(() => {
  const chainId = useChainId();
  const { address } = useAccount();

  const [selectedPool] = useAtom(selectedPoolAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [userAmount, setUserAmount] = useAtom(userAmountAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [triggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);

  const [estimatedEarnings, setEstimatedEarnings] = useState<number>();

  const earningsRequestSentRef = useRef(false);

  useEffect(() => {
    setUserAmount(null);
    if (selectedPool && traderAPI && isSDKConnected && address) {
      traderAPI.getPoolShareTokenBalance(address, selectedPool.poolSymbol).then((amount) => {
        setUserAmount(amount);
      });
    }
  }, [selectedPool, traderAPI, isSDKConnected, address, triggerUserStatsUpdate, setUserAmount]);

  useEffect(() => {
    if (!chainId || !selectedPool || !address) {
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
  }, [chainId, address, selectedPool, triggerUserStatsUpdate]);

  const withdrawnOn = useMemo(() => {
    if (!withdrawals || withdrawals.length === 0) {
      return 'na';
    }
    const currentTime = Date.now();
    const latestWithdrawalTimeElapsed = withdrawals[withdrawals.length - 1].timeElapsedSec * 1000;

    const withdrawalTime = currentTime + PERIOD_OF_2_DAYS - latestWithdrawalTimeElapsed;
    if (currentTime < withdrawalTime) {
      return format(new Date(withdrawalTime), 'MMMM d yyyy HH:mm');
    } else if (currentTime >= withdrawalTime + PERIOD_OF_4_DAYS) {
      return 'Overdue';
    } else {
      // (currentTime >= withdrawalTime)
      return 'Now';
    }
  }, [withdrawals]);

  return (
    <Box className={styles.root}>
      <Typography variant="h5" className={styles.heading}>
        Your stats
      </Typography>
      <Box key="amount" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoBlock
            title={'Amount'}
            content={
              <>
                <Typography> Amount of pool tokens you own. </Typography>
              </>
            }
            classname={styles.actionIcon}
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {userAmount !== undefined ? formatToCurrency(userAmount, `d${selectedPool?.poolSymbol}`) : '--'}
        </Typography>
      </Box>
      <Box key="estimatedEarnings" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoBlock
            title={'Estimated earnings'}
            content={
              <>
                <Typography> Estimated earnings are an approximation of how much you've earned. </Typography>
                <Typography>
                  Estimated earnings = d{selectedPool?.poolSymbol} balance at market value + total{' '}
                  {selectedPool?.poolSymbol} withdrawn - total {selectedPool?.poolSymbol} deposited
                </Typography>
              </>
            }
            classname={styles.actionIcon}
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {estimatedEarnings !== undefined
            ? formatToCurrency(
                estimatedEarnings < -0.0000000001 ? estimatedEarnings : Math.max(estimatedEarnings, 0),
                selectedPool?.poolSymbol,
                false,
                10
              )
            : '--'}
        </Typography>
      </Box>
      <Box key="withdrawalInitiated" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoBlock
            title={'Withdrawal initiated?'}
            content={
              <>
                <Typography>
                  {' '}
                  Indicates if you have initated a withdrawal request for the {selectedPool?.poolSymbol} pool.
                </Typography>
              </>
            }
            classname={styles.actionIcon}
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {withdrawals && withdrawals.length > 0 ? 'Yes' : 'No'}
        </Typography>
      </Box>
      <Box key="withdrawalAmount" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoBlock
            title={'Withdrawal amount'}
            content={
              <>
                <Typography> The amount of d{selectedPool?.poolSymbol} you initiated to withdraw. </Typography>
                <Typography>
                  Your liquidity continues to participate in the PnL and fee revenue of the pool until you withdraw.
                </Typography>
              </>
            }
            classname={styles.actionIcon}
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {withdrawals && withdrawals.length > 0
            ? formatToCurrency(withdrawals[withdrawals.length - 1].shareAmount, `d${selectedPool?.poolSymbol}`)
            : 'na'}
        </Typography>
      </Box>
      <Box key="withdrawalDate" className={styles.statContainer}>
        <Box className={styles.statLabel}>
          <InfoBlock
            title={'Can be withdrawn on'}
            content={
              <>
                <Typography> You can withdraw your liquidity two days after initializing withdrawal. </Typography>
                <Typography>
                  If you do not withdraw your funds within four days after they are ready to be withdrawn, anyone can
                  execute the withdrawal on your behalf. In this case the funds are sent to your address, and the
                  executor will earn a small fee paid out of your funds.
                </Typography>
              </>
            }
            classname={styles.actionIcon}
          />
        </Box>
        <Typography variant="bodyMedium" className={styles.statValue}>
          {withdrawnOn}
        </Typography>
      </Box>
    </Box>
  );
});
