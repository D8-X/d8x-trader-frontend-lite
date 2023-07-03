import { toUtf8String } from '@ethersproject/strings';
import { format } from 'date-fns';
import { useAtom } from 'jotai';
import { ChangeEvent, memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSigner } from 'wagmi';

import { Box, Button, InputAdornment, OutlinedInput, Typography } from '@mui/material';

import { PERIOD_OF_2_DAYS } from 'app-constants';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { ToastContent } from 'components/toast-content/ToastContent';
import { Separator } from 'components/separator/Separator';
import {
  dCurrencyPriceAtom,
  liqProvToolAtom,
  userAmountAtom,
  selectedLiquidityPoolAtom,
  withdrawalsAtom,
  loadStatsAtom,
} from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './Action.module.scss';

export const Initiate = memo(() => {
  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
  const [liqProvTool] = useAtom(liqProvToolAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [, setLoadStats] = useAtom(loadStatsAtom);

  const { data: signer } = useSigner();

  const [initiateAmount, setInitiateAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);

  const [inputValue, setInputValue] = useState(`${initiateAmount}`);

  const requestSentRef = useRef(false);
  const inputValueChangedRef = useRef(false);

  const handleInputCapture = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const targetValue = event.target.value;
    if (targetValue) {
      setInitiateAmount(+targetValue);
      setInputValue(targetValue);
    } else {
      setInitiateAmount(0);
      setInputValue('');
    }
    inputValueChangedRef.current = true;
  }, []);

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${initiateAmount}`);
    }
    inputValueChangedRef.current = false;
  }, [initiateAmount]);

  const handleInitiateLiquidity = useCallback(async () => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !selectedLiquidityPool || !initiateAmount || initiateAmount < 0 || !signer) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    await liqProvTool
      .initiateLiquidityWithdrawal(selectedLiquidityPool.poolSymbol, initiateAmount)
      .then(async (tx) => {
        console.log(`initiateWithdrawal tx hash: ${tx.hash}`);
        setLoadStats(false);
        toast.success(<ToastContent title="Initiating liquidity withdrawal" bodyLines={[]} />);
        tx.wait()
          .then((receipt) => {
            if (receipt.status === 1) {
              setLoadStats(true);
              setInitiateAmount(0);
              setInputValue('0');
              requestSentRef.current = false;
              setRequestSent(false);
              toast.success(<ToastContent title="Liquidity withdrawal initiated" bodyLines={[]} />);
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
              <ToastContent title="Error initiating withdrawal" bodyLines={[{ label: 'Reason', value: reason }]} />
            );
          });
      })
      .catch(async () => {
        setLoadStats(true);
        requestSentRef.current = false;
        setRequestSent(false);
        toast.error(<ToastContent title="Error adding liquidity" bodyLines={[]} />);
      });
  }, [initiateAmount, liqProvTool, signer, selectedLiquidityPool, setLoadStats]);

  const predictedAmount = useMemo(() => {
    if (initiateAmount > 0 && dCurrencyPrice != null) {
      return initiateAmount * dCurrencyPrice;
    }
    return 0;
  }, [initiateAmount, dCurrencyPrice]);

  const isButtonDisabled = useMemo(() => {
    if (!withdrawals || withdrawals.length > 0 || !userAmount || !initiateAmount || requestSent) {
      return true;
    } else {
      return userAmount < initiateAmount;
    }
  }, [withdrawals, userAmount, initiateAmount, requestSent]);

  return (
    <div className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5">Initiate withdrawal</Typography>
        <Typography variant="body2" className={styles.text}>
          Are you looking to withdraw your {selectedLiquidityPool?.poolSymbol} from the liquidity pool? If so, you can
          initiate a withdrawal request.
        </Typography>
        <Typography variant="body2" className={styles.text}>
          Keep in mind that it takes 48 hours to process your request and you can only have one withdrawal request at a
          time.
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            <InfoBlock
              title="Amount"
              content={
                <>
                  <Typography>
                    Specify the amount of d{selectedLiquidityPool?.poolSymbol} you want to exchange for{' '}
                    {selectedLiquidityPool?.poolSymbol}.
                  </Typography>
                  <Typography>
                    After 48 hours, this amount can be converted to {selectedLiquidityPool?.poolSymbol} and can be
                    withdrawn from the pool.
                  </Typography>
                </>
              }
            />
          </Box>
          <OutlinedInput
            id="initiate-amount-size"
            endAdornment={
              <InputAdornment position="end">
                <Typography variant="adornment">{`d${selectedLiquidityPool?.poolSymbol}`}</Typography>
              </InputAdornment>
            }
            type="number"
            inputProps={{ step: 1, min: 0 }}
            value={inputValue}
            onChange={handleInputCapture}
          />
        </Box>
        <Separator />
        <Box className={styles.summaryBlock}>
          <Box className={styles.row}>
            <Typography variant="body2">Amount</Typography>
            <Typography variant="body2">
              {formatToCurrency(predictedAmount, selectedLiquidityPool?.poolSymbol)}
            </Typography>
          </Box>
          <Box className={styles.row}>
            <Typography variant="body2">Can be withdrawn on:</Typography>
            <Typography variant="body2">
              {format(new Date(Date.now() + PERIOD_OF_2_DAYS), 'MMMM d yyyy HH:mm')}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="primary"
          disabled={isButtonDisabled}
          onClick={handleInitiateLiquidity}
          className={styles.actionButton}
        >
          Initiate withdrawal
        </Button>
      </Box>
    </div>
  );
});
