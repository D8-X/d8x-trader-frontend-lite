import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAccount, useWaitForTransaction, useWalletClient } from 'wagmi';

import { Box, Button, InputAdornment, Link, OutlinedInput, Typography } from '@mui/material';

import { ReactComponent as SwitchIcon } from 'assets/icons/switchSeparator.svg';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { addLiquidity } from 'blockchain-api/contract-interactions/addLiquidity';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import {
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { dCurrencyPriceAtom, triggerUserStatsUpdateAtom, sdkConnectedAtom } from 'store/vault-pools.store';
import type { AddressT } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './Action.module.scss';

export const Add = memo(() => {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient({
    onError(error) {
      console.log(error);
    },
  });

  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [, setTriggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [poolTokenDecimals] = useAtom(poolTokenDecimalsAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);

  const [inputValue, setInputValue] = useState(`${addAmount}`);
  const [txHash, setTxHash] = useState<AddressT | undefined>(undefined);

  const requestSentRef = useRef(false);
  const inputValueChangedRef = useRef(false);

  const handleInputCapture = useCallback((orderSizeValue: string) => {
    if (orderSizeValue) {
      setAddAmount(+orderSizeValue);
      setInputValue(orderSizeValue);
    } else {
      setAddAmount(0);
      setInputValue('');
    }
    inputValueChangedRef.current = true;
  }, []);

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${addAmount}`);
    }
    inputValueChangedRef.current = false;
  }, [addAmount]);

  useWaitForTransaction({
    hash: txHash,
    onSuccess() {
      toast.success(<ToastContent title={t('pages.vault.toast.added')} bodyLines={[]} />);
    },
    onError(reason) {
      toast.error(
        <ToastContent
          title={t('pages.vault.toast.error.title')}
          bodyLines={[{ label: t('pages.vault.toast.error.body'), value: reason.message }]}
        />
      );
    },
    onSettled() {
      setTxHash(undefined);
      setTriggerUserStatsUpdate((prevValue) => !prevValue);
    },
    enabled: !!txHash,
  });

  const handleAddLiquidity = useCallback(() => {
    if (requestSentRef.current) {
      return;
    }

    if (!liqProvTool || !isSDKConnected || !selectedPool || !addAmount || addAmount < 0 || !poolTokenDecimals) {
      return;
    }

    if (!address || !walletClient || !proxyAddr) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    approveMarginToken(walletClient, selectedPool.marginTokenAddr, proxyAddr, addAmount, poolTokenDecimals)
      .then(() => {
        addLiquidity(walletClient, liqProvTool, selectedPool.poolSymbol, addAmount).then((tx) => {
          console.log(`addLiquidity tx hash: ${tx.hash}`);
          setTxHash(tx.hash);
          toast.success(<ToastContent title={t('pages.vault.toast.adding')} bodyLines={[]} />);
        });
      })
      .catch((err) => {
        console.error(err);
        let msg = (err?.message ?? err) as string;
        msg = msg.length > 30 ? `${msg.slice(0, 25)}...` : msg;
        toast.error(
          <ToastContent
            title={t('pages.vault.toast.error.title')}
            bodyLines={[{ label: t('pages.vault.toast.error.body'), value: msg }]}
          />
        );
      })
      .finally(() => {
        setAddAmount(0);
        setInputValue('0');
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
      });
  }, [
    addAmount,
    liqProvTool,
    selectedPool,
    address,
    proxyAddr,
    walletClient,
    isSDKConnected,
    poolTokenDecimals,
    setTriggerUserStatsUpdate,
    t,
  ]);

  const handleMaxAmount = useCallback(() => {
    if (poolTokenBalance) {
      handleInputCapture(`${poolTokenBalance}`);
    }
  }, [handleInputCapture, poolTokenBalance]);

  const predictedAmount = useMemo(() => {
    if (addAmount > 0 && dCurrencyPrice != null) {
      return addAmount / dCurrencyPrice;
    }
    return 0;
  }, [addAmount, dCurrencyPrice]);

  const isButtonDisabled = useMemo(() => {
    if (!addAmount || requestSent || !isSDKConnected || !selectedPool?.brokerCollateralLotSize || !poolTokenBalance) {
      return true;
    }
    return addAmount > poolTokenBalance || addAmount < selectedPool.brokerCollateralLotSize;
  }, [addAmount, requestSent, isSDKConnected, selectedPool, poolTokenBalance]);

  return (
    <div className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5">{t('pages.vault.add.title')}</Typography>
        <Typography variant="body2" className={styles.text}>
          {t('pages.vault.add.info1', { poolSymbol: selectedPool?.poolSymbol })}
        </Typography>
        <Typography variant="body2" className={styles.text}>
          {t('pages.vault.add.info2', { poolSymbol: selectedPool?.poolSymbol })}
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            <InfoBlock
              title={<>{t('pages.vault.add.amount.title', { poolSymbol: selectedPool?.poolSymbol })}</>}
              content={<>{t('pages.vault.add.amount.info1', { poolSymbol: selectedPool?.poolSymbol })}</>}
              classname={styles.actionIcon}
            />
          </Box>
          <ResponsiveInput
            id="add-amount-size"
            className={styles.inputHolder}
            inputValue={inputValue}
            setInputValue={handleInputCapture}
            currency={selectedPool?.poolSymbol}
            step="1"
            min={0}
            max={poolTokenBalance || 999999}
          />
        </Box>
        {poolTokenBalance ? (
          <Typography className={styles.helperText} variant="bodyTiny">
            {t('pages.vault.add.max')}{' '}
            <Link onClick={handleMaxAmount}>{formatToCurrency(poolTokenBalance, selectedPool?.poolSymbol)}</Link>
          </Typography>
        ) : null}
        <Box className={styles.iconSeparator}>
          <SwitchIcon />
        </Box>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>{t('pages.vault.add.receive', { poolSymbol: selectedPool?.poolSymbol })}</Box>
          <Box className={styles.inputHolder}>
            <OutlinedInput
              id="expected-amount"
              endAdornment={
                <InputAdornment position="end" className={styles.expectedAmountInput}>
                  <Typography variant="adornment">d{selectedPool?.poolSymbol}</Typography>
                </InputAdornment>
              }
              type="text"
              value={formatToCurrency(predictedAmount, '')}
              disabled
            />
          </Box>
        </Box>
        <Box className={styles.buttonHolder}>
          <Button
            variant="primary"
            disabled={isButtonDisabled}
            onClick={handleAddLiquidity}
            className={styles.actionButton}
          >
            {t('pages.vault.add.button')}
          </Button>
        </Box>
      </Box>
    </div>
  );
});
