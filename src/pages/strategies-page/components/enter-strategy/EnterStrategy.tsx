import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useReadContracts, useWalletClient } from 'wagmi';

import { Button, Link, Typography } from '@mui/material';

import { STRATEGY_POOL_SYMBOL, STRATEGY_SYMBOL } from 'appConstants';
import { enterStrategy } from 'blockchain-api/contract-interactions/enterStrategy';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { pagesConfig } from 'config';
import { poolFeeAtom, poolsAtom, traderAPIAtom } from 'store/pools.store';
import { hasPositionAtom } from 'store/strategies.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './EnterStrategy.module.scss';
import { Address, erc20Abi, formatUnits } from 'viem';

export const EnterStrategy = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const pools = useAtomValue(poolsAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const feeRate = useAtomValue(poolFeeAtom);
  const setHasPosition = useSetAtom(hasPositionAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [inputValue, setInputValue] = useState(`${addAmount}`);
  const [requestSent, setRequestSent] = useState(false);

  const inputValueChangedRef = useRef(false);
  const requestSentRef = useRef(false);

  const weEthPool = useMemo(() => {
    if (pools.length) {
      const foundPool = pools.find((pool) => pool.poolSymbol === STRATEGY_POOL_SYMBOL);
      if (foundPool) {
        return foundPool;
      }
    }
    return null;
  }, [pools]);

  const { data: weEthPoolBalance, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: weEthPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: weEthPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled: address && traderAPI?.chainId === chainId && !!weEthPool?.marginTokenAddr && isConnected,
    },
  });

  const weEthBalance = weEthPoolBalance ? +formatUnits(weEthPoolBalance[0], weEthPoolBalance[1]) : 0;

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
        refetch();
      });
  }, [chainId, walletClient, traderAPI, feeRate, addAmount, setHasPosition, refetch]);

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
          <Link onClick={() => handleInputCapture(`${weEthBalance}`)}>{formatToCurrency(weEthBalance, 'weETH')}</Link>
        </Typography>
      ) : null}
      <GasDepositChecker className={styles.button} multiplier={2n}>
        <Button
          onClick={handleEnter}
          className={styles.button}
          variant="primary"
          disabled={requestSent || addAmount === 0}
        >
          <span className={styles.modalButtonText}>{t('pages.strategies.enter.deposit-button')}</span>
        </Button>
      </GasDepositChecker>
    </div>
  );
};
