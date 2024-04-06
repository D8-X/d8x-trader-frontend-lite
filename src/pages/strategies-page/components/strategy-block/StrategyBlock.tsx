import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { STRATEGY_SYMBOL } from 'appConstants';
import { getPositionRisk } from 'network/network';
import { hasPositionAtom, strategyAddressesAtom, strategyPositionAtom } from 'store/strategies.store';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { EnterStrategy } from '../enter-strategy/EnterStrategy';
import { ExitStrategy } from '../exit-strategy/ExitStrategy';
import { Overview } from '../overview/Overview';

import styles from './StrategyBlock.module.scss';
import { CircularProgress } from '@mui/material';

const INTERVAL_FOR_DATA_POLLING = 10_000; // Each 10 sec

export const StrategyBlock = () => {
  const { t } = useTranslation();

  const chainId = useChainId();
  const { address } = useAccount();

  const [hasPosition, setHasPosition] = useAtom(hasPositionAtom);
  const strategyAddresses = useAtomValue(strategyAddressesAtom);
  const setStrategyPosition = useSetAtom(strategyPositionAtom);

  const requestSentRef = useRef(false);

  const disclaimerTextBlocks = useMemo(() => [t('pages.strategies.info.text1'), t('pages.strategies.info.text2')], [t]);

  const strategyAddress = useMemo(() => {
    return strategyAddresses.find(({ userAddress }) => userAddress === address?.toLowerCase())?.strategyAddress;
  }, [address, strategyAddresses]);

  const fetchStrategyPosition = useCallback(() => {
    if (requestSentRef.current || !strategyAddress || !address) {
      return;
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
  }, [chainId, strategyAddress, address, setStrategyPosition, setHasPosition]);

  useEffect(() => {
    fetchStrategyPosition();

    const intervalId = setInterval(() => {
      fetchStrategyPosition();
    }, INTERVAL_FOR_DATA_POLLING);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchStrategyPosition]);

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
