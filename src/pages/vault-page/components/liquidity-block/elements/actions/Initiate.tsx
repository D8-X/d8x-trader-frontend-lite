import { toUtf8String } from '@ethersproject/strings';
import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { usePublicClient, useWaitForTransaction, useWalletClient } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { initiateLiquidityWithdrawal } from 'blockchain-api/contract-interactions/initiateLiquidityWithdrawal';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import {
  userAmountAtom,
  withdrawalsAtom,
  triggerUserStatsUpdateAtom,
  triggerWithdrawalsUpdateAtom,
} from 'store/vault-pools.store';

import styles from './Action.module.scss';
import { AddressT } from 'types/types';

export const Initiate = memo(() => {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [, setTriggerWithdrawalsUpdate] = useAtom(triggerWithdrawalsUpdateAtom);
  const [, setTriggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [initiateAmount, setInitiateAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<AddressT | undefined>(undefined);

  const [inputValue, setInputValue] = useState(`${initiateAmount}`);

  const requestSentRef = useRef(false);
  const inputValueChangedRef = useRef(false);

  const handleInputCapture = useCallback((orderSizeValue: string) => {
    if (orderSizeValue) {
      setInitiateAmount(+orderSizeValue);
      setInputValue(orderSizeValue);
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

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      toast.success(<ToastContent title="Withdrawal Initiated" bodyLines={[]} />);
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

  const handleInitiateLiquidity = useCallback(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !selectedPool || !initiateAmount || initiateAmount < 0 || !walletClient) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    initiateLiquidityWithdrawal(publicClient, walletClient, liqProvTool, selectedPool.poolSymbol, initiateAmount)
      .then((tx) => {
        console.log(`initiateLiquidityWithdrawal tx hash: ${tx.hash}`);
        setTxHash(tx.hash);
        toast.success(<ToastContent title="Initiating Liquidity Withdrawal" bodyLines={[]} />);
      })
      .catch((err) => {
        console.error(err);
        toast.error(<ToastContent title="Error Initiating Withdrawal" bodyLines={[{ label: 'Reason', value: '' }]} />);
      })
      .finally(() => {
        setInitiateAmount(0);
        setInputValue('0');
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [initiateAmount, liqProvTool, walletClient, selectedPool, setTriggerUserStatsUpdate, setTriggerWithdrawalsUpdate]);

  const isButtonDisabled = useMemo(() => {
    if (!withdrawals || withdrawals.length > 0 || !userAmount || !initiateAmount || requestSent) {
      return true;
    } else {
      return userAmount < initiateAmount;
    }
  }, [withdrawals, userAmount, initiateAmount, requestSent]);

  return (
    <>
      <Box className={styles.withdrawLabel}>
        <InfoBlock
          title={
            <>
              1. Initiate withdrawal of <strong>{selectedPool?.poolSymbol}</strong>
            </>
          }
          content={
            <>
              <Typography>
                Specify the amount of d{selectedPool?.poolSymbol} you want to exchange for {selectedPool?.poolSymbol}.
              </Typography>
              <Typography>
                After 48 hours, this amount can be converted to {selectedPool?.poolSymbol} and can be withdrawn from the
                pool.
              </Typography>
            </>
          }
          classname={styles.actionIcon}
        />
      </Box>
      <ResponsiveInput
        id="initiate-amount-size"
        className={styles.initiateInputHolder}
        inputValue={inputValue}
        setInputValue={handleInputCapture}
        currency={`d${selectedPool?.poolSymbol ?? '--'}`}
        step="1"
        min={0}
      />
      <Box className={styles.buttonHolder}>
        <Button
          variant="primary"
          disabled={isButtonDisabled}
          onClick={handleInitiateLiquidity}
          className={styles.actionButton}
        >
          Initiate withdrawal
        </Button>
      </Box>
    </>
  );
});
