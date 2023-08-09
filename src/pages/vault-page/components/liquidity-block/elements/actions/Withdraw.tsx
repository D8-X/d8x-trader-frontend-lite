import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useWaitForTransaction, useWalletClient } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { PERIOD_OF_2_DAYS } from 'app-constants';
import { executeLiquidityWithdrawal } from 'blockchain-api/contract-interactions/executeLiquidityWithdrawal';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { Initiate } from './Initiate';

import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import {
  dCurrencyPriceAtom,
  triggerUserStatsUpdateAtom,
  triggerWithdrawalsUpdateAtom,
  userAmountAtom,
  withdrawalsAtom,
} from 'store/vault-pools.store';

import { formatToCurrency } from 'utils/formatToCurrency';

import { AddressT } from 'types/types';
import styles from './Action.module.scss';

interface WithdrawPropsI {
  withdrawOn: string;
}

export const Withdraw = memo(({ withdrawOn }: WithdrawPropsI) => {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [, setTriggerWithdrawalsUpdate] = useAtom(triggerWithdrawalsUpdateAtom);
  const [, setTriggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);

  const { data: walletClient } = useWalletClient();

  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<AddressT | undefined>(undefined);

  const requestSentRef = useRef(false);

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      toast.success(<ToastContent title="Liquidity Withdrawn" bodyLines={[]} />);
    },
    onError() {
      toast.error(<ToastContent title="Error Processing Transaction" bodyLines={[]} />);
    },
    onSettled() {
      setTxHash(undefined);
      setTriggerUserStatsUpdate((prevValue) => !prevValue);
    },
    enabled: !!txHash,
  });

  const handleWithdrawLiquidity = useCallback(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !selectedPool || !walletClient) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    executeLiquidityWithdrawal(walletClient, liqProvTool, selectedPool.poolSymbol)
      .then((tx) => {
        console.log(`executeLiquidityWithdrawal tx hash: ${tx.hash}`);
        setTxHash(tx.hash);
        toast.success(<ToastContent title="Withdrawing liquidity" bodyLines={[]} />);
      })
      .catch((err) => {
        console.error(err);
        let msg = (err?.message ?? err) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(<ToastContent title="Error withdrawing liquidity" bodyLines={[{ label: 'Reason', value: msg }]} />);
      })
      .finally(() => {
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [liqProvTool, selectedPool, walletClient, setTriggerUserStatsUpdate, setTriggerWithdrawalsUpdate]);

  const shareAmount = useMemo(() => {
    if (!withdrawals) {
      return;
    }
    if (withdrawals.length === 0) {
      return 0;
    }
    const currentTime = Date.now();
    const latestWithdrawal = withdrawals[withdrawals.length - 1];
    const latestWithdrawalTimeElapsed = latestWithdrawal.timeElapsedSec * 1000;

    const withdrawalTime = currentTime + PERIOD_OF_2_DAYS - latestWithdrawalTimeElapsed;
    if (currentTime < withdrawalTime) {
      return 0;
    } else {
      return latestWithdrawal.shareAmount;
    }
  }, [withdrawals]);

  const predictedAmount = useMemo(() => {
    if (!withdrawals) {
      return;
    }
    if (withdrawals.length === 0) {
      return 0;
    }
    const latestWithdrawal = withdrawals[withdrawals.length - 1];

    if (dCurrencyPrice) {
      return latestWithdrawal.shareAmount * dCurrencyPrice;
    }
    return 0;
  }, [dCurrencyPrice, withdrawals]);

  const isButtonDisabled = useMemo(() => {
    return !userAmount || !shareAmount || requestSent;
  }, [userAmount, shareAmount, requestSent]);

  return (
    <div className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5">Withdraw liquidity</Typography>
        <Typography variant="body2" className={styles.text}>
          To withdraw liquidity you first initiate your withdrawal. Keep in mind that it takes 48 hours to process your
          request and you can only have one withdrawal request at a time.
        </Typography>
        <Typography variant="body2" className={styles.text}>
          After 48 hours, a withdrawable amount of d{selectedPool?.poolSymbol} can be exchanged for{' '}
          {selectedPool?.poolSymbol} at d{selectedPool?.poolSymbol} price.
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        {!withdrawals.length && (
          <>
            <Initiate />
            <Separator className={styles.separator} />
          </>
        )}
        <Box className={styles.withdrawLabel}>
          <InfoBlock
            title={
              <>
                {!withdrawals.length && '2.'} Withdraw <strong>{selectedPool?.poolSymbol}</strong>
              </>
            }
            content={
              <>
                <Typography>
                  This amount can be converted to {selectedPool?.poolSymbol}, which can be withdrawn from the pool.
                </Typography>
              </>
            }
            classname={styles.actionIcon}
          />
        </Box>
        <Box className={styles.summaryBlock}>
          <Box className={styles.row}>
            <Typography variant="body2">Can be withdrawn on:</Typography>
            <Typography variant="body2">
              <strong>{withdrawOn}</strong>
            </Typography>
          </Box>
          <Box className={styles.row}>
            <Typography variant="body2">You receive:</Typography>
            <Typography variant="body2">
              <strong>{formatToCurrency(predictedAmount, selectedPool?.poolSymbol)}</strong>
            </Typography>
          </Box>
        </Box>
        <Box className={styles.buttonHolder}>
          <Button
            variant="primary"
            onClick={handleWithdrawLiquidity}
            className={styles.actionButton}
            disabled={isButtonDisabled}
          >
            Withdraw
          </Button>
        </Box>
      </Box>
    </div>
  );
});
