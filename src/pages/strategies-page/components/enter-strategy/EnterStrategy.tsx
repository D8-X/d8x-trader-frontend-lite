import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainId, useWalletClient } from 'wagmi';

import { Button, Link, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { enterStrategy } from 'blockchain-api/contract-interactions/enterStrategy';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { pagesConfig } from 'config';
import { poolFeeAtom, poolTokenBalanceAtom, traderAPIAtom } from 'store/pools.store';
import { hasPositionAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './EnterStrategy.module.scss';

export const EnterStrategy = () => {
  const { t } = useTranslation();

  const chainId = useChainId();

  const { data: walletClient } = useWalletClient();

  const weEthBalance = useAtomValue(poolTokenBalanceAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const feeRate = useAtomValue(poolFeeAtom);
  const setHasPosition = useSetAtom(hasPositionAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [inputValue, setInputValue] = useState(`${addAmount}`);
  const [requestSent, setRequestSent] = useState(false);

  const inputValueChangedRef = useRef(false);
  const requestSentRef = useRef(false);

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

  const handleEnter = useCallback(() => {
    console.log({ feeRate, addAmount });
    if (
      requestSentRef.current ||
      !walletClient ||
      !traderAPI ||
      feeRate === undefined ||
      !pagesConfig.enabledStrategiesPageByChains.includes(chainId) ||
      addAmount === 0
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    enterStrategy({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI, amount: addAmount, feeRate })
      .then(({ hash }) => {
        console.log(`submitting strategy txn ${hash}`);
        setHasPosition(true);
      })
      .finally(() => {
        setRequestSent(false);
        requestSentRef.current = false;
      });
  }, [chainId, walletClient, traderAPI, feeRate, addAmount, setHasPosition]);

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('pages.strategies.enter.title')}
      </Typography>
      <div className={styles.inputLine}>
        <div className={styles.labelHolder}>
          <InfoLabelBlock title={t('common.amount-label')} content={t('pages.strategies.enter.amount-info')} />
        </div>
        <ResponsiveInput
          id="enter-amount-size"
          className={styles.inputHolder}
          inputValue={inputValue}
          setInputValue={handleInputCapture}
          currency="weETH"
          step="0.001"
          min={0}
          max={weEthBalance || 0}
        />
      </div>
      {weEthBalance ? (
        <Typography className={styles.helperText} variant="bodyTiny">
          {t('common.max')}{' '}
          <Link
            onClick={() => {
              if (weEthBalance) {
                handleInputCapture(`${weEthBalance}`);
              }
            }}
          >
            {formatToCurrency(weEthBalance, 'weETH')}
          </Link>
        </Typography>
      ) : null}
      <Button onClick={handleEnter} className={styles.button} variant="primary" disabled={requestSent}>
        <span className={styles.modalButtonText}>{t('pages.strategies.enter.deposit-button')}</span>
      </Button>
    </div>
  );
};
