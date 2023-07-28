import { toUtf8String } from '@ethersproject/strings';
import { useAtom } from 'jotai';
import { format } from 'date-fns';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useSigner } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { PERIOD_OF_2_DAYS } from 'app-constants';
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

import styles from './Action.module.scss';

export const Withdraw = memo(() => {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [, setTriggerWithdrawalsUpdate] = useAtom(triggerWithdrawalsUpdateAtom);
  const [, setTriggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);

  const { data: signer } = useSigner();

  const [requestSent, setRequestSent] = useState(false);

  const requestSentRef = useRef(false);

  const handleWithdrawLiquidity = useCallback(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !selectedPool || !signer) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    liqProvTool
      .executeLiquidityWithdrawal(signer, selectedPool.poolSymbol)
      .then(async (tx) => {
        console.log(`initiateWithdrawal tx hash: ${tx.hash}`);
        toast.success(<ToastContent title="Withdrawing liquidity" bodyLines={[]} />);
        tx.wait()
          .then((receipt) => {
            if (receipt.status === 1) {
              setTriggerUserStatsUpdate((prevValue) => !prevValue);
              setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
              requestSentRef.current = false;
              setRequestSent(false);
              toast.success(<ToastContent title="Liquidity withdrawn" bodyLines={[]} />);
            }
          })
          .catch(async (err) => {
            console.log(err);
            const response = await signer.call(
              {
                to: tx.to,
                from: tx.from,
                nonce: tx.nonce,
                gasLimit: tx.gasLimit,
                gasPrice: tx.gasPrice,
                data: tx.data,
                value: tx.value,
                chainId: tx.chainId,
                type: tx.type ?? undefined,
                accessList: tx.accessList,
              },
              tx.blockNumber
            );
            const reason = toUtf8String('0x' + response.substring(138)).replace(/\0/g, '');
            setTriggerUserStatsUpdate((prevValue) => !prevValue);
            setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
            requestSentRef.current = false;
            setRequestSent(false);
            toast.error(
              <ToastContent title="Error withdrawing liquidity" bodyLines={[{ label: 'Reason', value: reason }]} />
            );
          });
      })
      .catch(async (err) => {
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
        toast.error(
          <ToastContent title="Error withdrawing liquidity" bodyLines={[{ label: 'Reason', value: err as string }]} />
        );
      });
  }, [liqProvTool, selectedPool, signer, setTriggerUserStatsUpdate, setTriggerWithdrawalsUpdate]);

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
      // (currentTime >= withdrawalTime)
      return latestWithdrawal.shareAmount;
    }
  }, [withdrawals]);

  const predictedAmount = useMemo(() => {
    if (shareAmount && shareAmount > 0 && dCurrencyPrice != null) {
      return shareAmount * dCurrencyPrice;
    }
    return 0;
  }, [shareAmount, dCurrencyPrice]);

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
          />
        </Box>
        <Box className={styles.summaryBlock}>
          <Box className={styles.row}>
            <Typography variant="body2">Can be withdrawn on:</Typography>
            <Typography variant="body2">
              <strong>{format(new Date(Date.now() + PERIOD_OF_2_DAYS), 'MMMM d yyyy HH:mm')}</strong>
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
