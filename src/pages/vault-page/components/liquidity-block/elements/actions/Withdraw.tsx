import { toUtf8String } from '@ethersproject/strings';
import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useSigner } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { PERIOD_OF_2_DAYS } from 'app-constants';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import {
  dCurrencyPriceAtom,
  liqProvToolAtom,
  loadStatsAtom,
  selectedLiquidityPoolAtom,
  userAmountAtom,
  withdrawalsAtom,
} from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './Action.module.scss';

export const Withdraw = memo(() => {
  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
  const [liqProvTool] = useAtom(liqProvToolAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [, setLoadStats] = useAtom(loadStatsAtom);

  const { data: signer } = useSigner();

  const [requestSent, setRequestSent] = useState(false);

  const requestSentRef = useRef(false);

  const handleWithdrawLiquidity = useCallback(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !selectedLiquidityPool || !signer) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    liqProvTool
      .executeLiquidityWithdrawal(selectedLiquidityPool.poolSymbol)
      .then(async (tx) => {
        console.log(`initiateWithdrawal tx hash: ${tx.hash}`);
        setLoadStats(false);
        toast.success(<ToastContent title="Withdrawing liquidity" bodyLines={[]} />);
        tx.wait()
          .then((receipt) => {
            if (receipt.status === 1) {
              setLoadStats(true);
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
            setLoadStats(true);
            requestSentRef.current = false;
            setRequestSent(false);
            toast.success(
              <ToastContent title="Error withdrawing liquidity" bodyLines={[{ label: 'Reason', value: reason }]} />
            );
          });
      })
      .catch(async (err) => {
        setLoadStats(true);
        requestSentRef.current = false;
        setRequestSent(false);
        toast.error(
          <ToastContent title="Error withdrawing liquidity" bodyLines={[{ label: 'Reason', value: err as string }]} />
        );
      });
  }, [liqProvTool, selectedLiquidityPool, signer, setLoadStats]);

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
          Withdraw {selectedLiquidityPool?.poolSymbol} from the pool.
        </Typography>
        <Typography variant="body2" className={styles.text}>
          Keep in mind that you need to initiate a withdrawal request before you can withdraw your funds. Once done, a
          withdrawable amount of d{selectedLiquidityPool?.poolSymbol} can be exchanged for{' '}
          {selectedLiquidityPool?.poolSymbol} at d{selectedLiquidityPool?.poolSymbol} price.
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            <InfoBlock
              title="Withdrawable amount"
              content={
                <>
                  <Typography>
                    This amount can be converted to {selectedLiquidityPool?.poolSymbol}, which can be withdrawn from the
                    pool.
                  </Typography>
                </>
              }
            />
          </Box>
          <Typography variant="body1" className={styles.value}>
            {formatToCurrency(shareAmount, `d${selectedLiquidityPool?.poolSymbol}`)}
          </Typography>
        </Box>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            <InfoBlock
              title="dMATIC price"
              content={
                <>
                  <Typography>
                    This is the price at which you can convert d{selectedLiquidityPool?.poolSymbol} to{' '}
                    {selectedLiquidityPool?.poolSymbol}.
                  </Typography>
                </>
              }
            />
          </Box>
          <Typography variant="body1" className={styles.value}>
            {formatToCurrency(dCurrencyPrice, selectedLiquidityPool?.poolSymbol)}
          </Typography>
        </Box>
        <Separator />
        <Box className={styles.summaryBlock}>
          <Box className={styles.row}>
            <Typography variant="body2">You receive:</Typography>
            <Typography variant="body2">
              {formatToCurrency(predictedAmount, selectedLiquidityPool?.poolSymbol)}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="primary"
          onClick={handleWithdrawLiquidity}
          className={styles.actionButton}
          disabled={isButtonDisabled}
        >
          Withdraw
        </Button>
      </Box>
    </div>
  );
});
