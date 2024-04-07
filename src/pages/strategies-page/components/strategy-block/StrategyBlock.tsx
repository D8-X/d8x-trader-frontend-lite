import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { CircularProgress } from '@mui/material';

import { STRATEGY_SYMBOL } from 'appConstants';
import { getPositionRisk } from 'network/network';
import {
  enableFrequentUpdatesAtom,
  hasPositionAtom,
  strategyAddressesAtom,
  strategyPositionAtom,
} from 'store/strategies.store';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { EnterStrategy } from '../enter-strategy/EnterStrategy';
import { ExitStrategy } from '../exit-strategy/ExitStrategy';
import { Overview } from '../overview/Overview';

import styles from './StrategyBlock.module.scss';
import { claimStrategyFunds } from 'blockchain-api/contract-interactions/claimStrategyFunds';
import { traderAPIAtom } from 'store/pools.store';

const INTERVAL_FOR_DATA_POLLING = 5_000; // Each 5 sec
const INTERVAL_FREQUENT_POLLING = 1_000; // Each 1 sec
const MAX_FREQUENT_UPDATES = 10;

export const StrategyBlock = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const traderAPI = useAtomValue(traderAPIAtom);
  const [hasPosition, setHasPosition] = useAtom(hasPositionAtom);
  const [isFrequentUpdates, enableFrequentUpdates] = useAtom(enableFrequentUpdatesAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const setStrategyPosition = useSetAtom(strategyPositionAtom);

  const [frequentUpdates, setFrequentUpdates] = useState(0);
  const [hadPosition, setHadPosition] = useState(hasPosition);

  const requestSentRef = useRef(false);
  const claimRequestSentRef = useRef(false);

  const disclaimerTextBlocks = useMemo(() => [t('pages.strategies.info.text1'), t('pages.strategies.info.text2')], [t]);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const fetchStrategyPosition = useCallback(
    (frequentUpdatesEnabled: boolean) => {
      if (requestSentRef.current || !strategyAddress || !address) {
        return;
      }

      if (frequentUpdatesEnabled) {
        setFrequentUpdates((prevState) => prevState + 1);
      }

      requestSentRef.current = true;

      getPositionRisk(chainId, null, strategyAddress)
        .then(({ data: positions }) => {
          const strategy = positions.find(
            ({ symbol, positionNotionalBaseCCY }) => symbol === STRATEGY_SYMBOL && positionNotionalBaseCCY !== 0
          );
          setHasPosition(!!strategy);
          setStrategyPosition(strategy);
        })
        .finally(() => {
          requestSentRef.current = false;
        });
    },
    [chainId, strategyAddress, address, setStrategyPosition, setHasPosition]
  );

  useEffect(() => {
    fetchStrategyPosition(isFrequentUpdates);

    const intervalId = setInterval(
      () => {
        fetchStrategyPosition(isFrequentUpdates);
      },
      isFrequentUpdates ? INTERVAL_FREQUENT_POLLING : INTERVAL_FOR_DATA_POLLING
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchStrategyPosition, isFrequentUpdates]);

  useEffect(() => {
    if (frequentUpdates >= MAX_FREQUENT_UPDATES) {
      setFrequentUpdates(0);
      enableFrequentUpdates(false);
    }
  }, [frequentUpdates, enableFrequentUpdates]);

  useEffect(() => {
    console.log(hasPosition, hadPosition, chainId, claimRequestSentRef.current);
    if (!hasPosition && hadPosition && !claimRequestSentRef.current && traderAPI && walletClient) {
      claimRequestSentRef.current = true;
      claimStrategyFunds({ chainId, walletClient, symbol: STRATEGY_SYMBOL, traderAPI })
        .then(() => {
          console.log('claiming funds');
        })
        .finally(() => {
          claimRequestSentRef.current = false;
        });
    }
  }, [hasPosition, hadPosition, chainId, traderAPI, walletClient]);

  useEffect(() => {
    setHadPosition(!hasPosition);
  }, [hasPosition, setHadPosition]);

  return (
    <div className={styles.root}>
      <Overview />
      <div className={styles.actionBlock}>
        <Disclaimer title={t('pages.strategies.info.title')} textBlocks={disclaimerTextBlocks} />
        <div className={styles.divider} />
        {hasPosition === null && (
          <div className={styles.emptyBlock}>
            <div className={styles.loaderWrapper}>
              <CircularProgress />
            </div>
          </div>
        )}
        {hasPosition === true && <ExitStrategy />}
        {hasPosition === false && <EnterStrategy />}
      </div>
    </div>
  );
};
