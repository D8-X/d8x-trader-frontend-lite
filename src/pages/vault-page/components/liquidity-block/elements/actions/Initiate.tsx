import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useWaitForTransaction, useWalletClient } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { initiateLiquidityWithdrawal } from 'blockchain-api/contract-interactions/initiateLiquidityWithdrawal';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import {
  triggerUserStatsUpdateAtom,
  triggerWithdrawalsUpdateAtom,
  userAmountAtom,
  withdrawalsAtom,
} from 'store/vault-pools.store';
import type { AddressT } from 'types/types';

import styles from './Action.module.scss';

export const Initiate = memo(() => {
  const { t } = useTranslation();
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [, setTriggerWithdrawalsUpdate] = useAtom(triggerWithdrawalsUpdateAtom);
  const [, setTriggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);

  const { data: walletClient } = useWalletClient();

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
      toast.success(<ToastContent title={t('pages.vault.toast.initiated')} bodyLines={[]} />);
    },
    onError(reason) {
      toast.error(
        <ToastContent
          title={t('pages.vault.toast.error-initiating.title')}
          bodyLines={[{ label: t('pages.vault.toast.error-initiating.body'), value: reason.message }]}
        />
      );
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

    initiateLiquidityWithdrawal(walletClient, liqProvTool, selectedPool.poolSymbol, initiateAmount)
      .then((tx) => {
        console.log(`initiateLiquidityWithdrawal tx hash: ${tx.hash}`);
        setTxHash(tx.hash);
        toast.success(<ToastContent title={t('pages.vault.toast.initiating')} bodyLines={[]} />);
      })
      .catch((err) => {
        console.error(err);
        let msg = (err?.message ?? err) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.vault.toast.error-initiating.title')}
            bodyLines={[{ label: t('pages.vault.toast.error-initiating.body'), value: msg }]}
          />
        );
      })
      .finally(() => {
        setInitiateAmount(0);
        setInputValue('0');
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        setTriggerWithdrawalsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [
    initiateAmount,
    liqProvTool,
    walletClient,
    selectedPool,
    setTriggerUserStatsUpdate,
    setTriggerWithdrawalsUpdate,
    t,
  ]);

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
          title={<>{t('pages.vault.withdraw.initiate.title', { poolSymbol: selectedPool?.poolSymbol })}</>}
          content={
            <>
              <Typography>
                {t('pages.vault.withdraw.initiate.info1', { poolSymbol: selectedPool?.poolSymbol })}
              </Typography>
              <Typography>
                {t('pages.vault.withdraw.initiate.info2', { poolSymbol: selectedPool?.poolSymbol })}
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
          {t('pages.vault.withdraw.initiate.button')}
        </Button>
      </Box>
    </>
  );
});
