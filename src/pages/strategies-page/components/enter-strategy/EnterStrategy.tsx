import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useChainId, useReadContracts, useWalletClient } from 'wagmi';

import { Button, CircularProgress, Link, Typography } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { enterStrategy } from 'blockchain-api/contract-interactions/enterStrategy';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { pagesConfig } from 'config';
import { poolFeeAtom, traderAPIAtom } from 'store/pools.store';
import { strategyAddressesAtom, strategyPoolAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import { useEnterStrategy } from './hooks/useEnterStrategy';

import styles from './EnterStrategy.module.scss';

export const EnterStrategy = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const strategyPool = useAtomValue(strategyPoolAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const feeRate = useAtomValue(poolFeeAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [inputValue, setInputValue] = useState(`${addAmount}`);
  const [requestSent, setRequestSent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [temporaryValue, setTemporaryValue] = useState(inputValue);
  const [loading, setLoading] = useState(false);

  const inputValueChangedRef = useRef(false);
  const requestSentRef = useRef(false);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const { data: weEthPoolBalance, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: strategyPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: strategyPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled: address && traderAPI?.chainId === chainId && !!strategyPool?.marginTokenAddr && isConnected,
    },
  });

  const weEthBalance = weEthPoolBalance ? +formatUnits(weEthPoolBalance[0], weEthPoolBalance[1]) : 0;

  const { setTxHash } = useEnterStrategy(addAmount);

  const handleInputCapture = useCallback(
    (orderSizeValue: string) => {
      // Directly update the temporaryValue with user input without any validation
      if (isEditing) {
        setTemporaryValue(orderSizeValue);
      } else {
        // This part is for handling non-editing updates, like programmatically setting the value
        const numericValue = parseFloat(orderSizeValue);
        if (!isNaN(numericValue) && numericValue >= 0.01) {
          setAddAmount(numericValue);
          setInputValue(orderSizeValue);
        } else {
          setAddAmount(0);
          setInputValue('');
        }
      }
    },
    [isEditing]
  );

  const handleBlur = () => {
    setIsEditing(false);

    if (temporaryValue === '0') {
      setAddAmount(0);
      setInputValue('0');
      return;
    } else if (temporaryValue === '') {
      setAddAmount(0);
      setInputValue('');
      return;
    }

    // Convert the temporaryValue to a number and check it
    const numericValue = parseFloat(temporaryValue);

    // Enforce minimum only if the user leaves the field (on blur)
    if (numericValue === 0) {
      setAddAmount(0);
      setInputValue('0');
    } else if (isNaN(numericValue) || numericValue < 0.01) {
      setAddAmount(0.01);
      setInputValue('0.01');
    } else {
      setAddAmount(numericValue);
      setInputValue(numericValue.toString());
    }
  };

  useEffect(() => {
    // Convert the temporaryValue to a number and check it
    const numericValue = parseFloat(temporaryValue);

    if (isNaN(numericValue) || numericValue >= 0.01) {
      setAddAmount(numericValue);
    } else {
      setAddAmount(0);
    }
  }, [temporaryValue]);

  const handleFocus = () => {
    setIsEditing(true);
    setTemporaryValue(inputValue);
  };

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${addAmount}`);
    }
    inputValueChangedRef.current = false;
  }, [addAmount]);

  const handleEnter = useCallback(() => {
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
    setLoading(true);

    enterStrategy({
      chainId,
      walletClient,
      symbol: STRATEGY_SYMBOL,
      traderAPI,
      amount: addAmount,
      feeRate,
      strategyAddress,
    })
      .then(({ hash }) => {
        console.log(`submitting enter strategy txn ${hash}`);
        setTxHash(hash);
      })
      .finally(() => {
        setRequestSent(false);
        requestSentRef.current = false;
        refetch();
      });
  }, [chainId, walletClient, traderAPI, feeRate, addAmount, strategyAddress, setTxHash, refetch]);

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
          inputValue={isEditing ? temporaryValue : inputValue}
          setInputValue={handleInputCapture}
          handleInputBlur={handleBlur}
          handleInputFocus={handleFocus}
          currency="weETH"
          step="0.001"
          min={isEditing ? undefined : 0.01}
          max={weEthBalance || 0}
        />
      </div>
      {weEthBalance ? (
        <Typography className={styles.helperText} variant="bodyTiny">
          {t('common.max')}{' '}
          <Link onClick={() => handleInputCapture(`${weEthBalance}`)}>{formatToCurrency(weEthBalance, 'weETH')}</Link>
        </Typography>
      ) : null}
      <GasDepositChecker className={styles.button} multiplier={2n}>
        <Button
          onClick={handleEnter}
          className={styles.button}
          variant="primary"
          disabled={requestSent || loading || addAmount === 0}
        >
          {t('pages.strategies.enter.deposit-button')}
        </Button>
      </GasDepositChecker>

      {loading && (
        <div className={styles.loaderWrapper}>
          <CircularProgress />
        </div>
      )}
    </div>
  );
};
