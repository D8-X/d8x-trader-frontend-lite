import { useAtom, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, useAccount, useWaitForTransaction, useWalletClient, useNetwork } from 'wagmi';

import { Box, Button, Typography } from '@mui/material';

import { initiateLiquidityWithdrawal } from 'blockchain-api/contract-interactions/initiateLiquidityWithdrawal';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import { selectedPoolAtom, traderAPIAtom } from 'store/pools.store';
import {
  dCurrencyPriceAtom,
  triggerUserStatsUpdateAtom,
  triggerWithdrawalsUpdateAtom,
  userAmountAtom,
  withdrawalsAtom,
} from 'store/vault-pools.store';
import { valueToFractionDigits } from 'utils/formatToCurrency';

import styles from './Action.module.scss';
import { getTxnLink } from 'helpers/getTxnLink';

enum ValidityCheckInitiateE {
  Empty = '-',
  NoAmount = 'no-amount',
  NoAddress = 'not-connected',
  AmountTooBig = 'amount-too-big',
  AmountBelowMinimum = 'amount-below-min',
  GoodToGo = 'good-to-go',
  NoFunds = 'no-funds',
}

export const Initiate = memo(() => {
  const { t } = useTranslation();
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [userAmount] = useAtom(userAmountAtom);
  const [withdrawals] = useAtom(withdrawalsAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const setTriggerWithdrawalsUpdate = useSetAtom(triggerWithdrawalsUpdateAtom);
  const setTriggerUserStatsUpdate = useSetAtom(triggerUserStatsUpdateAtom);
  const { address } = useAccount();

  const { chain } = useNetwork();
  const { data: walletClient } = useWalletClient();

  const [initiateAmount, setInitiateAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);

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
      toast.success(
        <ToastContent
          title={t('pages.vault.toast.initiated')}
          bodyLines={[
            {
              label: '',
              value: (
                <a
                  href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.shareLink}
                >
                  {txHash}
                </a>
              ),
            },
          ]}
        />
      );
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

  const minAmount = useMemo(() => {
    if (selectedPool && dCurrencyPrice) {
      return (0.5 * selectedPool.brokerCollateralLotSize) / dCurrencyPrice;
    }
  }, [selectedPool, dCurrencyPrice]);

  const isButtonDisabled = useMemo(() => {
    if (
      !withdrawals ||
      withdrawals.length > 0 ||
      !userAmount ||
      !initiateAmount ||
      requestSent ||
      !minAmount ||
      initiateAmount < minAmount
    ) {
      return true;
    } else {
      return userAmount < initiateAmount;
    }
  }, [withdrawals, userAmount, initiateAmount, requestSent, minAmount]);

  const validityCheckInitiateType = useMemo(() => {
    if (!address) {
      return ValidityCheckInitiateE.NoAddress;
    }
    if (requestSent || !minAmount || !withdrawals || withdrawals.length > 0) {
      return ValidityCheckInitiateE.Empty;
    }
    if (!userAmount || userAmount === 0) {
      return ValidityCheckInitiateE.NoFunds;
    }
    if (!initiateAmount) {
      return ValidityCheckInitiateE.NoAmount;
    }
    const isAmountTooBig = userAmount < initiateAmount;
    if (isAmountTooBig) {
      return ValidityCheckInitiateE.AmountTooBig;
    }
    const isAmountBelowMinimum = initiateAmount < minAmount;
    if (isAmountBelowMinimum) {
      return ValidityCheckInitiateE.AmountBelowMinimum;
    }
    return ValidityCheckInitiateE.GoodToGo;
  }, [address, withdrawals, userAmount, initiateAmount, requestSent, minAmount]);

  const validityCheckInitiateText = useMemo(() => {
    if (validityCheckInitiateType === ValidityCheckInitiateE.Empty) {
      return `${t('pages.vault.withdraw.initiate.validity-empty')}`;
    } else if (validityCheckInitiateType === ValidityCheckInitiateE.NoAddress) {
      return `${t('pages.vault.withdraw.initiate.validity-no-address')}`;
    } else if (validityCheckInitiateType === ValidityCheckInitiateE.NoFunds) {
      return `${t('pages.vault.withdraw.initiate.validity-no-funds')}`;
    } else if (validityCheckInitiateType === ValidityCheckInitiateE.AmountBelowMinimum) {
      const numberDigits = valueToFractionDigits(minAmount);
      return `${t('pages.vault.withdraw.initiate.validity-amount-below-min')} (${minAmount?.toFixed(
        numberDigits
      )} ${selectedPool?.poolSymbol})`;
    } else if (validityCheckInitiateType === ValidityCheckInitiateE.NoAmount) {
      return `${t('pages.vault.withdraw.initiate.validity-no-amount')}`;
    } else if (validityCheckInitiateType === ValidityCheckInitiateE.AmountTooBig) {
      return `${t('pages.vault.withdraw.initiate.validity-amount-too-big')}`;
    }
    return t('pages.vault.withdraw.initiate.button');
  }, [t, validityCheckInitiateType, minAmount, selectedPool?.poolSymbol]);

  return (
    <>
      <Box className={styles.withdrawLabel}>
        <InfoLabelBlock
          title={t('pages.vault.withdraw.initiate.title', { poolSymbol: selectedPool?.poolSymbol })}
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
          {validityCheckInitiateText}
        </Button>
      </Box>
    </>
  );
});
